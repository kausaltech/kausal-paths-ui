import React from 'react';
import App, { type AppContext, type AppProps } from 'next/app';

import { ApolloClient, ApolloProvider, isApolloError } from '@apollo/client';
import type { Theme } from '@kausal/themes/types';
import * as Sentry from '@sentry/nextjs';
import type {
  GetAvailableInstancesQuery,
  GetInstanceContextQuery,
  GetInstanceContextQueryVariables,
} from 'common/__generated__/graphql';
import { type ApolloClientOpts, type ApolloClientType, initializeApollo } from 'common/apollo';
import { activeGoalVar, activeScenarioVar, yearRangeVar } from 'common/cache';
import { getI18n } from 'common/i18n';
import InstanceContext, { GET_INSTANCE_CONTEXT, type InstanceContextType } from 'common/instance';
import { loadTheme } from 'common/theme';
import ThemedGlobalStyles from 'common/ThemedGlobalStyles';
import Layout from 'components/Layout';
import SiteContext, { type SiteContextType, type SiteI18nConfig } from 'context/site';
import { appWithTranslation, useTranslation } from 'next-i18next';
import numbro from 'numbro';
import { ThemeProvider } from 'styled-components';

import {
  BASE_PATH_HEADER,
  DEFAULT_LANGUAGE_HEADER,
  INSTANCE_HOSTNAME_HEADER,
  INSTANCE_IDENTIFIER_HEADER,
  SUPPORTED_LANGUAGES_HEADER,
  THEME_IDENTIFIER_HEADER,
} from '@/common/const';
import { assetPrefix, deploymentType, wildcardDomains } from '@/common/environment';
import { getLogger, logApolloError } from '@/common/log';
import LocalizedNumbersContext, { createNumbersContext } from '@/context/numbers';
import PathsError from './_error';

require('../../styles/default/main.scss');

const logger = getLogger('app');

const defaultSiteContext: { [key: string]: SiteContextType } = {
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
  tampere: {
    /** Should user be able to choose reference year and end year */
    /** Should user be able to select different scenarios */
    watchLink: {
      title: 'Ilmastovahti',
      url: 'https://ilmastovahti.tampere.fi',
    }, // remove, replace with instance.externalLinks[0]
  },
  ilmastoruoka: {
    watchLink: null,
  },
  healthimpact: {
    watchLink: null,
  },
  gronlogik: {
    watchLink: {
      title: 'Sunnydale Climate Watch',
      url: 'https://sunnydale.test.kausal.tech/climate',
    },
  },
  espoo: {
    watchLink: {
      title: 'Ilmastovahti',
      url: 'https://ilmastovahti.espoo.fi',
    },
  },
  zuerich: {
    watchLink: null,
  },
  'lappeenranta-syke': {
    watchLink: {
      title: 'Lappeenrannan ilmastovahti',
      url: 'https://kestavyysvahti.lappeenranta.fi/ilmasto',
    },
  },
  longmont: {
    watchLink: {
      title: 'Longmont Indicators',
      url: 'https://indicators.longmontcolorado.gov',
    },
  },
  saskatoon: {
    watchLink: {
      title: "Saskatoon's Low Emissions Community Plan",
      url: 'https://saskatoon-lec.watch-test.kausal.tech/',
    },
  },
  surrey: {
    watchLink: {
      title: "Surrey's Climate Action Tracker",
      url: 'https://surrey-ccas.watch-test.kausal.tech/',
    },
  },
};

function renderFallbackError({ error: Error, eventId: string }) {
  return <PathsError statusCode={500} />;
}

export type PathsAppProps = AppProps & {
  siteContext: SiteContextType;
  instanceContext: InstanceContextType;
  themeProps: Theme;
  apolloClient?: ApolloClientType;
};

function PathsApp(props: PathsAppProps) {
  const { Component, pageProps, siteContext, instanceContext, themeProps } = props;
  const isProd = deploymentType === 'production';
  const { i18n } = useTranslation();
  // FIXME: Remove this when possible; it's not safe for async contexts
  numbro.setLanguage(
    i18n.language,
    i18n.language.indexOf('-') > 0 ? i18n.language.split('-')[0] : undefined
  );
  const component = <Component {...pageProps} />;

  if (!instanceContext || !siteContext) {
    // getInitialProps errored, return with a very simple layout
    return <ThemeProvider theme={themeProps}>{component};</ThemeProvider>;
  }
  const instance = instanceContext;

  const numbersContext = createNumbersContext(
    i18n.language,
    instance.features.showSignificantDigits
  );

  const activeScenario = siteContext.scenarios.find((sc) => sc.isActive);
  const goals = instance.goals;

  if (!activeGoalVar()) {
    const defaultGoal = goals.length > 1 ? goals.find((goal) => goal.default) : goals[0];
    activeGoalVar(defaultGoal ?? null);
  }

  if (!activeScenarioVar()) {
    activeScenarioVar(activeScenario);
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
    <SiteContext.Provider value={siteContext}>
      <InstanceContext.Provider value={instanceContext}>
        <ApolloProvider client={apolloClient}>
          <ThemeProvider theme={themeProps}>
            <LocalizedNumbersContext.Provider value={numbersContext}>
              <ThemedGlobalStyles />
              <Layout>
                <Sentry.ErrorBoundary showDialog={!isProd} fallback={renderFallbackError}>
                  {component}
                </Sentry.ErrorBoundary>
              </Layout>
            </LocalizedNumbersContext.Provider>
          </ThemeProvider>
        </ApolloProvider>
      </InstanceContext.Provider>
    </SiteContext.Provider>
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

  // Instance is identified either by a hard-coded identifier or by the
  // request hostname.
  const apolloConfig: ApolloClientOpts = {
    instanceHostname: host,
    instanceIdentifier: instanceIdentifier,
    wildcardDomains,
    authorizationToken: req.user?.idToken,
    clientIp: req.ip,
    locale: i18nConf.locale,
    currentURL: req.currentURL,
    clientCookies: req.apiCookies ? req.apiCookies.join('; ') : undefined,
  };
  const apolloClient: ApolloClient<object> = initializeApollo(null, apolloConfig);

  // Load the instance configuration from backend
  let instance: InstanceContextType;
  let siteContext: SiteContextType;
  try {
    const { data } = await apolloClient.query<
      GetInstanceContextQuery,
      GetInstanceContextQueryVariables
    >({
      query: GET_INSTANCE_CONTEXT,
      context: {
        locale: i18nConf.locale,
        logger,
      },
    });
    const { scenarios } = data;
    instance = data.instance!;
    const basePath = req.headers[BASE_PATH_HEADER] as string;

    siteContext = {
      scenarios: data.scenarios,
      parameters: data.parameters,
      menuPages: data.menuPages,
      title: instance.name!,
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
  } catch (error) {
    if (isApolloError(error)) {
      logApolloError(error, { query: GET_INSTANCE_CONTEXT }, logger);
      const isProtected = error.graphQLErrors.find(
        (err) => err.extensions?.code == 'instance_protected'
      );
      if (isProtected) {
      }
    }
    throw error;
  }
  Object.assign(siteContext, defaultSiteContext[instance.id] || defaultSiteContext['sunnydale']);
  return {
    siteContext,
    instanceContext: instance,
  };
}

async function getI18nProps(ctx: PathsPageContext) {
  // SSR only
  const { serverSideTranslations } = await import('next-i18next/serverSideTranslations');
  const { req } = ctx;
  const nextI18nConfig = (await import('../../next-i18next.config')).default;
  let defaultLanguage = req.headers[DEFAULT_LANGUAGE_HEADER] as string | undefined;
  if (!defaultLanguage) {
    logger.warn('no i18n headers set');
    console.log(ctx.locale, ctx.locales, ctx.defaultLocale);
    defaultLanguage = 'en';
  }

  logger.debug({
    'default-language': req.headers[DEFAULT_LANGUAGE_HEADER],
    'supported-languages': req.headers[SUPPORTED_LANGUAGES_HEADER],
    locale: ctx.locale,
    'context-locales': ctx.locales,
    'context-default-locale': ctx.defaultLocale,
  });

  if (!ctx.locale) {
    logger.warn('no active locale');
    ctx.locale = 'en';
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
      defaultLocale: defaultLanguage ?? 'default',
      locales: supportedLanguages,
    },
  };
  const i18nConfig = await serverSideTranslations(ctx.locale!, ['common', 'errors'], conf);
  return i18nConfig;
}

type InstanceConfig = GetAvailableInstancesQuery['availableInstances'][0];

type PathsAppRequest = AppContext['ctx']['req'] & {
  ip: string;
  instanceConfig: InstanceConfig;
  currentURL: {
    baseURL: string;
    path: string;
    hostname: string;
  };
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

PathsApp.getInitialProps = async (appContext: PathsAppContext) => {
  const { ctx } = appContext;

  if (process.browser) {
    const appProps = await App.getInitialProps(appContext);
    const nextData = window.__NEXT_DATA__;
    const { _nextI18Next } = nextData.props.pageProps;
    const { siteContext, instanceContext, themeProps } = nextData.props;
    const ret = {
      ...appProps,
      siteContext,
      instanceContext,
      themeProps,
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
  if (ctx.res && deploymentType === 'production') {
    ctx.res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=59');
  }

  return appProps;
};

const PathsAppWithTranslation = appWithTranslation(PathsApp);

export default PathsAppWithTranslation;
