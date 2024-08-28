import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import apolloClient, {
  type ApolloQueryResult,
  type DocumentNode,
  type OperationVariables,
} from '@apollo/client';
import { ApolloError } from '@apollo/client/errors';
import { HttpLink } from '@apollo/client/link/http/HttpLink.js';
import { getOperationName } from '@apollo/client/utilities/graphql/getFromAST.js';
import { expect, type Page } from '@playwright/test';
import type { FallbackLngObjList, i18n } from 'i18next';
import i18next from 'i18next';

import type { ApolloClientType } from '@/common/apollo.js';
import i18nConfig from '../../next-i18next.config.js';
import type {
  PlaywrightGetInstanceBasicsQuery,
  PlaywrightGetInstanceBasicsQueryVariables,
  PlaywrightGetInstanceInfoQuery,
  PlaywrightGetInstanceInfoQueryVariables,
} from '../__generated__/graphql.ts';

const { ApolloClient, InMemoryCache, gql } = apolloClient;

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.paths.kausal.dev/v1';

const BASE_URL = process.env.TEST_PAGE_BASE_URL || `http://{instanceId}.localhost:3000`;

const GET_INSTANCE_BASICS = gql`
  query PlaywrightGetInstanceBasics($instance: ID!) @instance(identifier: $instance) {
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

const LOG_MAX_ERRORS = 3;

export type ApolloErrorContext = {
  query: DocumentNode;
  variables?: OperationVariables;
  client?: ApolloClientType;
  component?: string;
};

export function logApolloError(error: Error, context?: ApolloErrorContext) {
  const query = context?.query;
  const operationName = query ? getOperationName(query) : null;
  const variables = context?.variables ? JSON.stringify(context.variables, null, 0) : null;

  let link = context?.client?.link;
  let uri: string | null = null;
  let nrLinks = 0;
  while (link && nrLinks < 10) {
    if (link instanceof HttpLink) {
      if (typeof link.options.uri === 'string') {
        uri = link.options.uri;
      }
    }
    link = link.right;
    nrLinks++;
  }
  console.error(
    `GraphQL query ${operationName} to ${uri} returned an error. Variables: ${variables}`
  );
  const ctx: Record<string, string> = {};
  if (variables) {
    ctx.variables = variables;
  }
  if (error instanceof ApolloError) {
    const { clientErrors, graphQLErrors, networkError } = error;
    if (clientErrors.length) {
      clientErrors.forEach((err, idx) => {
        if (idx >= LOG_MAX_ERRORS) return;
        console.error(err, 'Client error');
      });
    }
    if (graphQLErrors.length) {
      graphQLErrors.forEach((err, idx) => {
        if (idx >= LOG_MAX_ERRORS) return;
        console.error(err, 'GraphQL errors');
      });
    }
    if (networkError) {
      const message = networkError.message;
      const result = 'result' in networkError ? networkError.result : null;
      console.error(networkError, `Network error: ${message}`);

      const errors: Error[] | null = result?.['errors'].length ? result['errors'] : null;
      if (errors) {
        errors.forEach((err, idx) => {
          if (idx >= LOG_MAX_ERRORS) return;
          console.error(err, 'Network result errors');
        });
      } else if (result) {
        console.error(result, 'Network result');
      }
    }
  }
}

const i18nRes = Object.fromEntries(
  (i18nConfig.i18n.locales as string[]).map((lng) => {
    return [
      lng,
      {
        common: JSON.parse(
          fs.readFileSync(`${projectRoot}/public/locales/${lng}/common.json`, {
            encoding: 'utf8',
          })
        ),
      },
    ];
  })
);

function initI18n(lang: string) {
  const errCallback = (err, t) => {
    if (err) console.error(err);
  };
  const fallbackLng = i18nConfig.fallbackLng as FallbackLngObjList;
  return i18next.createInstance(
    {
      lng: lang,
      resources: i18nRes,
      fallbackLng: fallbackLng[lang],
      defaultNS: 'common',
      missingKeyHandler(lngs, ns, key, fallbackValue, updateMissing, options) {
        console.error('missing i18n key', lngs, ns, key, options);
      },
    },
    errCallback
  );
}

export class InstanceContext {
  instance: InstanceInfo;
  baseURL: string;
  i18n: i18n;

  constructor(instance: InstanceInfo, baseURL: string) {
    this.instance = instance;
    this.baseURL = baseURL;
    const lng = this.instance.instance.defaultLanguage;
    this.i18n = initI18n(lng);
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
    await expect(siteName).toHaveAttribute('content', this.instance.instance.name);
    await expect(page.locator('html')).toHaveAttribute('lang', this.i18n.language);
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

    let langRes: ApolloQueryResult<PlaywrightGetInstanceBasicsQuery>;
    try {
      langRes = await apolloClient.query<
        PlaywrightGetInstanceBasicsQuery,
        PlaywrightGetInstanceBasicsQueryVariables
      >({
        query: GET_INSTANCE_BASICS,
        variables: { instance: instanceId },
      });
    } catch (err) {
      logApolloError(err, { query: GET_INSTANCE_BASICS, variables: { instance: instanceId } });
      throw err;
    }
    const primaryLanguage = langRes.data!.instance.defaultLanguage;
    const baseURL = getPageBaseUrlToTest(instanceId);
    let res: ApolloQueryResult<PlaywrightGetInstanceInfoQuery>;
    try {
      res = await apolloClient.query<
        PlaywrightGetInstanceInfoQuery,
        PlaywrightGetInstanceInfoQueryVariables
      >({
        query: GET_INSTANCE_INFO,
        variables: { instance: instanceId, locale: primaryLanguage },
      });
    } catch (err) {
      logApolloError(err, {
        query: GET_INSTANCE_INFO,
        variables: { instance: instanceId, locale: primaryLanguage },
      });
      throw err;
    }
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
  return BASE_URL.replace('{instanceId}', instanceId);
}

export function displayConfiguration() {
  const p = (s: string) => (s + ':').padEnd(22);

  console.log(p('API base URL'), API_BASE);
  console.log(p('Instances to test'), getIdentifiersToTest().join(', '));
  console.log(p('Base URL'), BASE_URL);
  console.log(p('  URL for Sunnydale'), getPageBaseUrlToTest('sunnydale'));
}
