import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type {
  ApolloClient as ApolloClientType,
  DocumentNode,
  OperationVariables,
} from '@apollo/client';
import { ApolloClient, HttpLink, InMemoryCache, gql } from '@apollo/client';
import { shouldIgnoreConsoleMessage } from '@e2e-common/console-output.js';
import { type ConsoleMessage, test as baseTest } from '@playwright/test';
import { type Page, type PageScreenshotOptions, type Response, expect } from '@playwright/test';
import type { FallbackLngObjList, i18n } from 'i18next';
import i18next from 'i18next';

import type {
  PlaywrightGetInstanceBasicsQuery,
  PlaywrightGetInstanceBasicsQueryVariables,
  PlaywrightGetInstanceInfoQuery,
  PlaywrightGetInstanceInfoQueryVariables,
} from '../__generated__/graphql.ts';
import { snapshotsPath } from '../playwright.config.ts';

const SUPPORTED_LOCALES = ['en', 'fi', 'sv', 'de', 'de-CH', 'cs', 'da', 'lv', 'pl', 'es-US', 'el'];
const FALLBACK_LNG: FallbackLngObjList = {
  'en-AU': ['en'],
  'de-CH': ['de'],
  default: ['en'],
};

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

function getApiBase() {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  if (process.env.PATHS_BACKEND_URL) return `${process.env.PATHS_BACKEND_URL}/v1`;
  return 'https://api.paths.kausal.dev/v1';
}

const API_BASE = getApiBase();

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
      features {
        showRefreshPrompt
      }
      goals {
        id
      }
    }
    pages {
      urlPath
      title
      showInMenus
      __typename
    }
    actions {
      id
      isVisible
      group {
        id
      }
      parameters {
        localId
        isCustomizable
      }
    }
  }
`;

type InstanceInfo = NonNullable<PlaywrightGetInstanceInfoQuery>;
type ActionInfo = InstanceInfo['actions'][0];

export type PathsPage = NonNullable<InstanceInfo['pages']>[0];
export type ActionListPage = PathsPage & {
  __typename: 'ActionListPage';
};

export type ApolloErrorContext = {
  query: DocumentNode;
  variables?: OperationVariables;
  client?: ApolloClientType;
  component?: string;
};

export const test = baseTest.extend<{ ctx: InstanceContext }>({});
export type TestType = typeof test;

type LocaleDefs = Record<string, string>;

const i18nRes = Object.fromEntries(
  SUPPORTED_LOCALES.map((lng) => {
    return [
      lng,
      {
        common: JSON.parse(
          fs.readFileSync(`${projectRoot}/public/locales/${lng}/common.json`, {
            encoding: 'utf8',
          })
        ) as LocaleDefs,
      },
    ];
  })
);

function initI18n(lang: string) {
  const errCallback = (err: unknown) => {
    if (err) console.error(err);
  };
  const fallbackLng = FALLBACK_LNG;
  return i18next.createInstance(
    {
      lng: lang,
      resources: i18nRes,
      fallbackLng: fallbackLng[lang],
      defaultNS: 'common',
      missingKeyHandler(lngs, ns, key, fallbackValue, updateMissing, options) {
        console.error('missing i18n key', lngs, ns, key, options);
      },
      showSupportNotice: false,
    },
    errCallback
  );
}

export class InstanceContext {
  instance: InstanceInfo;
  baseURL: string;
  i18n: i18n;
  takeScreenshots: boolean;
  compareScreenshots: boolean;

  consoleMessages: ConsoleMessage[];

  constructor(instance: InstanceInfo, baseURL: string) {
    this.instance = instance;
    this.baseURL = baseURL;
    const lng = this.instance.instance.defaultLanguage;
    this.i18n = initI18n(lng);
    this.takeScreenshots = process.env.TEST_TAKE_SCREENSHOTS === '1';
    this.compareScreenshots = process.env.TEST_COMPARE_SCREENSHOTS === '1';
    this.consoleMessages = [];
  }

  static getBaseURL(instanceId: string) {
    return getPageBaseUrlToTest(instanceId);
  }

  static getAnnotations(instanceId: string) {
    return [
      {
        type: 'instance',
        description: instanceId,
      },
      {
        type: 'url',
        description: this.getBaseURL(instanceId),
      },
    ];
  }

  static setupTests(instanceId: string, test: TestType) {
    test.use({
      // eslint-disable-next-line no-empty-pattern
      ctx: async ({}, use) => {
        const planInfo = await InstanceContext.fromInstanceId(instanceId);
        await use(planInfo);
      },
    });
    test.beforeEach(async ({ page, ctx }) => {
      await ctx.beforeEach(page);
    });
    test.afterEach(async ({ page, ctx }) => {
      await ctx.afterEach(page);
    });
  }

  handleConsoleMessage = async (msg: ConsoleMessage) => {
    if (shouldIgnoreConsoleMessage(msg)) {
      return;
    }
    console.log(`Console message (${msg.type()}, ${msg.args().length} args):\n`);
    const values: unknown[] = [];
    for (const arg of msg.args()) values.push(await arg.jsonValue());
    console.log(...values);
    this.consoleMessages.push(msg);
  };

  handleNetworkResponse = async (response: Response) => {
    const request = response.request();
    const url = request.url();
    const status = response.status();
    if (url.endsWith('/api/graphql')) {
      if (!response.ok()) {
        throw new Error(`GraphQL request failed with status ${status}`);
      }
      let data: Record<string, unknown>;
      try {
        data = (await response.json()) as Record<string, unknown>;
      } catch (error) {
        if (
          error instanceof Error &&
          (error.message.includes('No data found for resource') ||
            error.message.includes('Test ended'))
        ) {
          return;
        }
        throw error;
      }
      if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
        console.log(data.errors);
        throw new Error(`GraphQL request failed with ${data.errors.length} errors`);
      }
      return;
    }
    if (status >= 400) {
      throw new Error(
        `Network request ${url} failed with status ${status}: ${response.statusText()}`
      );
    }
  };

  // eslint-disable-next-line @typescript-eslint/require-await
  async beforeEach(page: Page) {
    this.consoleMessages = [];
    page.on('console', this.handleConsoleMessage);
    page.on('response', this.handleNetworkResponse);
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async afterEach(page: Page) {
    page.off('response', this.handleNetworkResponse);
    page.off('console', this.handleConsoleMessage);
    if (process.env.TEST_ALLOW_CONSOLE_OUTPUT !== '0') return;
    expect(this.consoleMessages.length, {
      message: 'Test produced console output',
    }).toBe(0);
  }

  // Returns the first page of the given type, or null if no such page exists
  getPageOfType(type: string): PathsPage | null {
    const item = this.instance.pages.find((page) => page.__typename === type) || null;
    return item;
  }

  getActionListPage(): ActionListPage | null {
    function isActionPage(item: PathsPage): item is ActionListPage {
      if (item.__typename !== 'ActionListPage') return false;
      return true;
    }
    const item = this.instance.pages.find(isActionPage) || null;
    return item;
  }

  getVisibleActions(): ActionInfo[] {
    return this.instance.actions.filter((action) => action.isVisible && action.group !== null);
  }

  getActionURL(action: ActionInfo) {
    return `${this.baseURL}/actions/${action.id}`;
  }

  async navigateTo(page: Page, url: string) {
    await page.goto(url);
    await this.checkMeta(page);
    await this.waitForLoaded(page);
  }

  async checkMeta(page: Page) {
    const siteName = page.locator('head meta[property="og:site_name"]').first();
    await expect(siteName).toHaveAttribute('content', this.instance.instance.name);
    await expect(page.locator('html')).toHaveAttribute('lang', this.i18n.language);
  }

  async waitForLoaded(page: Page, opts: { timeout?: number } = {}) {
    await expect(page.locator('*[aria-busy=true]')).toHaveCount(0, {
      timeout: opts.timeout || 20000,
    });
  }

  async waitForNavbarVisible(page: Page) {
    const brandingNav = page.locator('nav#branding-navigation-bar').first();
    const globalNav = page.locator('nav#global-navigation-bar').first();
    await expect
      .poll(async () => (await brandingNav.isVisible()) || (await globalNav.isVisible()), {
        timeout: 5000,
      })
      .toBeTruthy();
  }

  async takeScreenshot(
    page: Page,
    screenshotId: string,
    opts?: Omit<PageScreenshotOptions, 'path'>
  ) {
    const finalOpts = {
      fullPage: true,
      ...(opts || {}),
    };
    if (this.compareScreenshots) {
      await expect(page).toHaveScreenshot(
        [this.instance.instance.id, `${screenshotId}.png`],
        finalOpts
      );
      await expect(page.getByRole('main')).toMatchAriaSnapshot({
        name: `${this.instance.instance.id}/${screenshotId}.aria.yml`,
      });
    }

    if (!this.takeScreenshots) return;

    const screenshotDir = snapshotsPath;
    const path = `${screenshotDir}/${this.instance.instance.id}/${screenshotId}.png`;
    await page.screenshot({ path, ...finalOpts });
  }

  static async fromInstanceId(instanceId: string) {
    const apolloClient = new ApolloClient({
      cache: new InMemoryCache(),
      link: new HttpLink({ uri: `${API_BASE}/graphql/` }),
    });

    let langRes: ApolloClient.QueryResult<PlaywrightGetInstanceBasicsQuery>;
    try {
      langRes = await apolloClient.query<
        PlaywrightGetInstanceBasicsQuery,
        PlaywrightGetInstanceBasicsQueryVariables
      >({
        query: GET_INSTANCE_BASICS,
        variables: { instance: instanceId },
      });
    } catch (err) {
      console.error(err);
      throw err;
    }
    const instanceData = langRes.data?.instance;
    if (!instanceData) {
      throw new Error('Instance basics data not found for instance ' + instanceId);
    }
    const primaryLanguage = instanceData.defaultLanguage;
    const baseURL = getPageBaseUrlToTest(instanceId);
    let res: ApolloClient.QueryResult<PlaywrightGetInstanceInfoQuery>;
    try {
      res = await apolloClient.query<
        PlaywrightGetInstanceInfoQuery,
        PlaywrightGetInstanceInfoQueryVariables
      >({
        query: GET_INSTANCE_INFO,
        variables: { instance: instanceId, locale: primaryLanguage },
      });
    } catch (err) {
      console.error(err);
      throw err;
    }
    const data = res.data;
    if (!data) {
      throw new Error('Instance info data not found for instance ' + instanceId);
    }
    return new InstanceContext(data, baseURL);
  }
}

type InstanceTestFunction = ({ test }: { test: TestType }) => void;

export function runInstanceTests(instanceId: string, fn: InstanceTestFunction) {
  const annotations = InstanceContext.getAnnotations(instanceId);
  test.describe(
    instanceId,
    {
      annotation: annotations,
    },
    () => {
      InstanceContext.setupTests(instanceId, test);
      test.describe.configure({ mode: 'serial' });
      fn({ test });
    }
  );
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
