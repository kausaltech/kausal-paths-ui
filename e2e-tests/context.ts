import i18nConfig from '../next-i18next.config';
import i18next, { i18n } from 'i18next';
import fs from 'fs';
import * as apolloModule from '@apollo/client';
import { Page, TestType, expect } from '@playwright/test';
import type {
  PlaywrightGetInstanceInfoQuery,
  PlaywrightGetInstanceBasicsQueryVariables,
  PlaywrightGetInstanceBasicsQuery,
  PlaywrightGetInstanceInfoQueryVariables,
} from './__generated__/graphql';

// @ts-ignore
const { ApolloClient, InMemoryCache, gql } = apolloModule.default;

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || 'https://api.paths.kausal.tech/v1';

const GET_INSTANCE_BASICS = gql`
  query PlaywrightGetInstanceBasics($instance: ID!)
  @instance(identifier: $instance) {
    instance {
      id
      defaultLanguage
      supportedLanguages
    }
  }
`;

const GET_INSTANCE_INFO = gql`
  query PlaywrightGetInstanceInfo($instance: ID!, $locale: String!)
  @locale(lang: $locale)
  @instance(identifier: $instance) {
    instance {
      id
      name
      defaultLanguage
      supportedLanguages
    }
    pages {
      urlPath
      title
      showInMenus
      __typename
    }
    actions {
      id
    }
  }
`;

type InstanceInfo = NonNullable<PlaywrightGetInstanceInfoQuery>;
type ActionInfo = InstanceInfo['actions'][0];

export type PathsPage = NonNullable<InstanceInfo['pages']>[0];
export type ActionListPage = PathsPage & {
  __typename: 'ActionListPage';
};

const i18nRes = Object.fromEntries(
  (i18nConfig.i18n.locales as string[]).map((lng) => {
    return [
      lng,
      {
        common: JSON.parse(
          fs.readFileSync(`public/locales/${lng}/common.json`, {
            encoding: 'utf8',
          })
        ),
      },
    ];
  })
);

i18next.init(
  {
    lng: 'en',
    resources: i18nRes,
    supportedLngs: i18nConfig.supportedLngs,
    fallbackLng: i18nConfig.fallbackLng,
    defaultNS: i18nConfig.defaultNS,
    fallbackNS: i18nConfig.fallbackNS,
  },
  (err, t) => {
    if (err) console.log(err);
  }
);

export class InstanceContext {
  instance: InstanceInfo;
  baseURL: string;
  i18n: i18n;

  constructor(instance: InstanceInfo, baseURL: string) {
    this.instance = instance;
    this.baseURL = baseURL;
    const lng = this.instance.instance.defaultLanguage;
    this.i18n = i18next.cloneInstance({
      lng,
    });
  }

  getActionListPage(): ActionListPage | null {
    function isActionPage(item: PathsPage): item is ActionListPage {
      if (item.__typename !== 'ActionListPage') return false;
      return true;
    }
    const item = this.instance.pages.find(isActionPage) || null;
    return item;
  }

  getActionURL(action: ActionInfo) {
    return `${this.baseURL}/actions/${action.id}`;
  }

  async checkMeta(page: Page) {
    const siteName = page.locator('head meta[property="og:site_name"]');
    await expect(siteName).toHaveAttribute(
      'content',
      this.instance.instance.name
    );
  }

  async waitForLoaded(page: Page) {
    await expect(page.locator('*[aria-busy=true]')).toHaveCount(0, {
      timeout: 20000,
    });
  }

  static async fromInstanceId(instanceId: string) {
    const apolloClient = new ApolloClient({
      cache: new InMemoryCache(),
      uri: `${API_BASE}/graphql/`,
    });

    const langRes = await apolloClient.query<
      PlaywrightGetInstanceBasicsQuery,
      PlaywrightGetInstanceBasicsQueryVariables
    >({
      query: GET_INSTANCE_BASICS,
      variables: { instance: instanceId },
    });
    const primaryLanguage = langRes.data!.instance.defaultLanguage;
    const baseURL = `http://${instanceId}.localhost:3000`;
    const res = await apolloClient.query<
      PlaywrightGetInstanceInfoQuery,
      PlaywrightGetInstanceInfoQueryVariables
    >({
      query: GET_INSTANCE_INFO,
      variables: { instance: instanceId, locale: primaryLanguage },
    });
    const data = res.data!;
    return new InstanceContext(data, baseURL);
  }
}

export function getIdentifiersToTest(): string[] {
  const val = process.env.TEST_INSTANCE_IDENTIFIERS || 'sunnydale';

  return val
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s);
}

export function getPageBaseUrlToTest(instanceId: string): string {
  let baseUrl =
    process.env.TEST_PAGE_BASE_URL ||
    `https://{instanceId}.paths.staging.kausal.tech`;
  baseUrl = baseUrl.replace('{instanceId}', instanceId);
  return baseUrl;
}

export function displayConfiguration() {
  console.log('Base URL: ', process.env.TEST_); // FIXME: Typo? (Copy and paste from KW UI)
  console.log('URL for Sunnydale: ', getPageBaseUrlToTest('sunnydale'));
  console.log('API base URL: ', API_BASE);
}
