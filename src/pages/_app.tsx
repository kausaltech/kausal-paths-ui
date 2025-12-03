import '../../styles/default/main.scss';

import React, { useState } from 'react';

import {
  appWithTranslation,
  useTranslation,
} from 'next-i18next';
import App, {
  type AppContext,
  type AppProps,
} from 'next/app';
import numbro from 'numbro';

import type {
  GetAvailableInstancesQuery,
  GetInstanceContextQuery,
  GetInstanceContextQueryVariables,
} from '@/common/__generated__/graphql';
import {
  type ApolloClientOpts,
  type ApolloClientType,
  initializeApollo,
} from '@/common/apollo';
import {
  activeGoalVar,
  activeScenarioVar,
  yearRangeVar,
} from '@/common/cache';
import {
  BASE_PATH_HEADER,
  DEFAULT_LANGUAGE_HEADER,
  INSTANCE_HOSTNAME_HEADER,
  INSTANCE_IDENTIFIER_HEADER,
  SUPPORTED_LANGUAGES_HEADER,
  THEME_IDENTIFIER_HEADER,
} from '@/common/const';
import { getI18n } from '@/common/i18n';
import InstanceContext, {
  GET_INSTANCE_CONTEXT,
  type InstanceContextType,
} from '@/common/instance';
import { initializeMuiTheme } from '@/common/mui-theme/theme';
import { loadTheme } from '@/common/theme';
import ThemedGlobalStyles from '@/common/ThemedGlobalStyles';
import Layout from '@/components/Layout';
import LocalizedNumbersContext, { createNumbersContext } from '@/context/numbers';
import SiteContext, {
  type SiteContextType,
  type SiteI18nConfig,
} from '@/context/site';
import type { ApolloClient } from '@apollo/client';
import { ApolloProvider } from '@apollo/client';
import {
  getAssetPrefix,
  getWildcardDomains,
  isLocalDev,
  isProductionDeployment,
  printRuntimeConfig,
} from '@common/env';
import { getLogger } from '@common/logging/logger';
import { CommonThemeProvider } from '@common/providers/CommonThemeProvider';
import {
  getClientIP,
  getCurrentURL,
} from '@common/utils';
import type { Theme } from '@kausal/themes/types';
import { AppCacheProvider } from '@mui/material-nextjs/v14-pagesRouter';
import { ThemeProvider } from '@mui/material/styles';
import * as Sentry from '@sentry/nextjs';

type WatchLink = {
  title: string | { [key: string]: string };
  url: string | { [key: string]: string };
} | null;
type DemoPage = { id: string; lang: string; title: string; urlPath: string };

const defaultSiteContext: {
  [key: string]: { instanceId?: string; watchLink: WatchLink; demoPages?: DemoPage[] };
} = {
  'cork-nzc': {
    watchLink: {
      title: 'Benefits Dashboard',
      url: 'https://cork-planner.watch-test.kausal.tech/',
    },
  },
  'demo-stadt-bisko': {
    watchLink: {
      title: {
        en: 'Demo City climate action plan',
        de: 'Klimaneutrales Demo-Stadt',
      },
      url: {
        en: 'https://demo-duesseldorf.watch-test.kausal.tech/en/',
        de: 'https://demo-duesseldorf.watch-test.kausal.tech',
      },
    },
  },
  espoo: {
    instanceId: 'espoo',
    watchLink: {
      title: {
        fi: 'Ilmastovahti',
        en: 'Espoo Climate Watch',
        sv: 'Esbo klimatvakt',
      },
      url: {
        fi: 'https://ilmastovahti.espoo.fi',
        en: 'https://ilmastovahti.espoo.fi/en',
        sv: 'https://ilmastovahti.espoo.fi/sv',
      },
    },
  },
  gronlogik: {
    watchLink: {
      title: 'Sunnydale Climate Watch',
      url: 'https://sunnydale.test.kausal.tech/climate',
    },
  },
  healthimpact: {
    watchLink: null,
  },
  ilmastoruoka: {
    watchLink: null,
  },
  'lappeenranta-nzc': {
    watchLink: {
      title: 'Lappeenrannan ilmastovahti',
      url: 'https://kestavyysvahti.lappeenranta.fi/ilmasto',
    },
  },
  'lappeenranta-syke': {
    watchLink: {
      title: 'Lappeenrannan ilmastovahti',
      url: 'https://kestavyysvahti.lappeenranta.fi/ilmasto',
    },
  },
  longmont: {
    instanceId: 'longmont',
    watchLink: {
      title: {
        en: 'Longmont Indicators',
        'es-US': 'Indicadores de Longmont',
      },
      url: {
        en: 'https://indicators.longmontcolorado.gov',
        'es-US': 'https://indicators.longmontcolorado.gov/es-US',
      },
    },
  },
  'muenchen-demo': {
    watchLink: {
      title: 'Maßnahmenplan',
      url: 'https://demo-muenchen.watch-test.kausal.tech/',
    },
  },
  'potsdam-gpc': {
    watchLink: {
      title: 'Klima-Monitor-Potsdam',
      url: 'https://klima-monitor.potsdam.de/',
    },
  },
  saskatoon: {
    watchLink: {
      title: "Saskatoon's Climate Dashboard",
      url: 'https://saskatoon.ca/climatedashboard',
    },
  },
  sunnydale: {
    watchLink: null,
    demoPages: [
      {
        id: 's-en-1',
        lang: 'en',
        title: 'About',
        urlPath: '/demo/about',
      },
      {
        id: 's-de-1',
        lang: 'de',
        title: 'Info',
        urlPath: '/demo/about',
      },
      {
        id: 's-fi-1',
        lang: 'fi',
        title: 'Tietoa palvelusta',
        urlPath: '/demo/about',
      },
    ],
  },
  surrey: {
    watchLink: {
      title: "Surrey's Climate Action Tracker",
      url: 'https://climateactiontracker.surrey.ca/',
    },
  },
  tampere: {
    /** Should user be able to choose reference year and end year */
    /** Should user be able to select different scenarios */
    watchLink: {
      title: 'Ilmastovahti',
      url: 'https://ilmastovahti.tampere.fi',
    }, // remove, replace with instance.externalLinks[0]
  },
  zuerich: {
    watchLink: null,
  },
};

export type PathsAppProps = AppProps<Record<string, unknown>> & {
  siteContext: SiteContextType;
  instanceContext: InstanceContextType;
  themeProps: Theme;
  apolloClient?: ApolloClientType;
};

function PathsApp(props: PathsAppProps) {
  const {
    Component,
    pageProps,
    siteContext: initialSiteContext,
    instanceContext,
    themeProps,
  } = props;
  const [siteContext, setSiteContext] = useState<SiteContextType>(initialSiteContext);
  const { i18n } = useTranslation();
  const logger = getLogger({ name: 'app-component' });
  const muiTheme = initializeMuiTheme(themeProps);

  // FIXME: Remove this when possible; it's not safe for async contexts
  numbro.setLanguage(
    i18n.language,
    i18n.language.indexOf('-') > 0 ? i18n.language.split('-')[0] : undefined
  );
  const component = <Component {...pageProps} />;
  if (!instanceContext || !siteContext) {
    // getInitialProps errored, return with a very simple layout
    logger.error('no site context');
    return <ThemeProvider theme={muiTheme}>{component}</ThemeProvider>;
  }

  const instance = instanceContext;

  const numbersContext = createNumbersContext(
    i18n.language,
    instance.features.showSignificantDigits ?? undefined
  );

  const activeScenario = siteContext.scenarios.find((sc) => sc.isActive);
  const goals = instance.goals;

  if (!activeGoalVar()) {
    const defaultGoal = goals.length > 1 ? goals.find((goal) => goal.default) : goals[0];
    activeGoalVar(defaultGoal ?? null);
  }

  if (!activeScenarioVar() && activeScenario) {
    activeScenarioVar({ ...activeScenario, isUserSelected: true });
  }

  if (!yearRangeVar()) {
    const yearRange: [number, number] = [
      instance.minimumHistoricalYear ?? siteContext.referenceYear ?? 2010,
      siteContext.targetYear,
    ];
    yearRangeVar(yearRange);
  }
  const apolloClient = initializeApollo(null, siteContext.apolloConfig);

  return (
    <AppCacheProvider {...props}>
      <SiteContext.Provider value={[siteContext, setSiteContext]}>
        <InstanceContext.Provider value={instanceContext}>
          <ApolloProvider client={apolloClient}>
            <ThemeProvider theme={muiTheme}>
              <CommonThemeProvider theme={themeProps}>
                <ThemedGlobalStyles />
                <LocalizedNumbersContext.Provider value={numbersContext}>
                  <Layout>{component}</Layout>
                </LocalizedNumbersContext.Provider>
              </CommonThemeProvider>
            </ThemeProvider>
          </ApolloProvider>
        </InstanceContext.Provider>
      </SiteContext.Provider>
    </AppCacheProvider>
  );
}

async function getSiteContext(ctx: PathsPageContext, i18nConf: SiteI18nConfig) {
  /**
   * Load the static, global data related to the instance and theme.
   *
   * SSR only
   */

  // First determine the hostname for the request which we might need
  // for loading the instance that is related to it.
  const { req } = ctx;
  const host = req.headers[INSTANCE_HOSTNAME_HEADER] as string;
  const instanceIdentifier = req.headers[INSTANCE_IDENTIFIER_HEADER] as string | undefined;
  if (!instanceIdentifier) {
    return null;
  }
  const logger = getLogger({ name: 'app', request: req });

  // Instance is identified either by a hard-coded identifier or by the
  // request hostname.
  const apolloConfig: ApolloClientOpts & { instanceHostname: string; instanceIdentifier: string } =
    {
      instanceHostname: host,
      instanceIdentifier: instanceIdentifier,
      wildcardDomains: getWildcardDomains(),
      authorizationToken: req.user?.idToken,
      clientIp: getClientIP(req),
      currentURL: getCurrentURL(req),
      locale: i18nConf.locale,
      clientCookies: req.apiCookies ? req.apiCookies.join('; ') : undefined,
    };
  const apolloClient: ApolloClient<object> = initializeApollo(null, apolloConfig);

  // Load the instance configuration from backend
  const { data } = await apolloClient.query<
    GetInstanceContextQuery,
    GetInstanceContextQueryVariables
  >({
    query: GET_INSTANCE_CONTEXT,
    context: {
      'instance-hostname': apolloConfig.instanceHostname,
      logger,
      'component-name': 'PathsApp.getSiteContext',
    },
  });
  const { scenarios } = data;
  const instance = data.instance;
  const basePath = req.headers[BASE_PATH_HEADER] as string;
  const assetPrefix = getAssetPrefix();
  const siteContext: SiteContextType = {
    scenarios: data.scenarios,
    parameters: data.parameters,
    menuPages: data.menuPages,
    footerPages: data.footerPages,
    additionalLinkPages: data.additionalLinkPages,
    title: instance.name,
    owner: instance.owner!,
    apolloConfig,
    availableNormalizations: data.availableNormalizations,
    referenceYear: instance.referenceYear ?? null,
    minYear: instance.minimumHistoricalYear,
    maxYear: instance.modelEndYear,
    targetYear: instance.targetYear ?? instance.modelEndYear,
    latestMetricYear: instance.maximumHistoricalYear || 2018,
    baselineName: scenarios.find((scenario) => scenario.id === 'baseline')?.name,
    iconBase: `${assetPrefix}/static/themes/default/images/favicon`,
    ogImage: `${assetPrefix}/static/themes/default/images/og-image-default.png`,
    i18n: i18nConf,
    basePath,
    assetPrefix,
  };
  Object.assign(siteContext, defaultSiteContext[instance.id] || defaultSiteContext['sunnydale']);
  return {
    siteContext,
    instanceContext: instance,
  };
}

function hasInstanceIdentifier(ctx: PathsPageContext) {
  return !!ctx.req.headers[INSTANCE_IDENTIFIER_HEADER];
}

function getLocaleDebug(ctx: PathsPageContext) {
  const { req } = ctx;
  return {
    url: ctx.req.url,
    host: ctx.req.headers['host'],
    locale: ctx.locale,
    'default-language': req.headers[DEFAULT_LANGUAGE_HEADER],
    'supported-languages': req.headers[SUPPORTED_LANGUAGES_HEADER],
    'context-locales': ctx.locales,
    'context-default-locale': ctx.defaultLocale,
  };
}

async function getI18nProps(ctx: PathsPageContext) {
  // SSR only
  const { serverSideTranslations } = await import('next-i18next/serverSideTranslations');
  const { req } = ctx;
  const nextI18nConfig = (await import('../../next-i18next.config')).default;
  let defaultLanguage = req.headers[DEFAULT_LANGUAGE_HEADER] as string | undefined;
  const logger = getLogger({ name: 'app-get-i18n-props', request: req });

  if (!defaultLanguage || defaultLanguage === 'default') {
    if (hasInstanceIdentifier(ctx)) {
      logger.warn(getLocaleDebug(ctx), 'no i18n headers set, but instance identifier is present');
    }
    defaultLanguage = 'en';
  }

  if (false) {
    logger.debug(getLocaleDebug(ctx));
  }

  if (!ctx.locale) {
    logger.warn(getLocaleDebug(ctx), 'no active locale');
    ctx.locale = defaultLanguage;
  }
  const header = req.headers[SUPPORTED_LANGUAGES_HEADER] as string | undefined;
  const supportedLanguages = (header ?? defaultLanguage).split(',');
  const i18n = getI18n();

  if (i18n) {
    await i18n.changeLanguage(ctx.locale);
  }
  const conf = {
    ...nextI18nConfig,
    i18n: {
      ...nextI18nConfig.i18n,
      defaultLocale: defaultLanguage,
      locales: supportedLanguages,
    },
  };
  const i18nConfig = await serverSideTranslations(ctx.locale, ['common', 'errors'], conf);
  return i18nConfig;
}

type InstanceConfig = GetAvailableInstancesQuery['availableInstances'][0];

type PathsAppRequest = AppContext['ctx']['req'] & {
  ip: string;
  instanceConfig: InstanceConfig;
  apiCookies?: string[];
  user?: {
    idToken: string;
  };
};

type PathsPageContext = Omit<AppContext['ctx'], 'req'> & {
  req: PathsAppRequest;
};

type PathsAppContext = Omit<AppContext, 'ctx'> & {
  ctx: PathsPageContext;
};

let defaultTheme: Theme | undefined;

const getInitialProps = async (appContext: PathsAppContext) => {
  const { ctx } = appContext;

  if (process.browser) {
    if (isLocalDev) {
      printRuntimeConfig('Kausal Paths UI');
    }
    const appProps = await App.getInitialProps(appContext);
    const nextData = window.__NEXT_DATA__;
    const pageProps = nextData.props as PathsAppProps;
    const { _nextI18Next } = pageProps.pageProps;
    const { siteContext, instanceContext, themeProps } = pageProps;
    const ret = {
      ...appProps,
      siteContext,
      instanceContext,
      themeProps,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      pageProps: {
        ...appProps.pageProps,
        _nextI18Next,
      },
    };
    return ret;
  }

  if (!defaultTheme) {
    defaultTheme = await loadTheme('default');
  }

  // SSR
  const appProps: Partial<PathsAppProps> = await App.getInitialProps(appContext);
  if (!appProps.pageProps) {
    appProps.pageProps = {};
  }
  const pageProps = appProps.pageProps;

  const i18nProps = await getI18nProps(ctx);
  const i18nConf = i18nProps._nextI18Next!.userConfig!.i18n;
  const siteI18nConf: SiteI18nConfig = {
    locale: ctx.locale!,
    defaultLocale: i18nConf.defaultLocale,
    supportedLocales: i18nConf.locales,
  };
  Object.assign(pageProps, i18nProps);
  const siteProps = await getSiteContext(ctx, siteI18nConf);
  if (siteProps) {
    appProps.siteContext = siteProps.siteContext;
    appProps.instanceContext = siteProps.instanceContext;
  }
  const themeIdentifier = ctx.req?.headers[THEME_IDENTIFIER_HEADER] as string | undefined;
  const theme = themeIdentifier ? await loadTheme(themeIdentifier) : defaultTheme;
  appProps.themeProps = theme;

  // We instruct the upstream cache to cache for a minute
  if (ctx.res && isProductionDeployment()) {
    ctx.res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=59');
  }
  return appProps;
};

PathsApp.getInitialProps = async (appContext: PathsAppContext) => {
  return Sentry.startSpan({ name: 'PathsApp.getInitialProps' }, async (_span) => {
    return await getInitialProps(appContext);
  });
};

const PathsAppWithTranslation = appWithTranslation(PathsApp);

export default PathsAppWithTranslation;
