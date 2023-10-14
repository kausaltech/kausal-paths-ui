import React from 'react';
import { ApolloProvider, ApolloClient, isApolloError } from '@apollo/client';
import App, { AppContext, AppProps } from 'next/app';
import router from 'next/router';
import { ThemeProvider } from 'styled-components';
import getConfig from 'next/config';

import { appWithTranslation, useTranslation } from 'next-i18next';
import * as Sentry from '@sentry/nextjs';

import { ApolloClientType, initializeApollo } from 'common/apollo';
import { setBasePath } from 'common/links';
import { loadTheme } from 'common/theme';
import { getI18n } from 'common/i18n';
import ThemedGlobalStyles from 'common/ThemedGlobalStyles';
import { yearRangeVar, activeScenarioVar, activeGoalVar } from 'common/cache';
import InstanceContext, {
  GET_INSTANCE_CONTEXT,
  InstanceContextType,
} from 'common/instance';
import SiteContext, { SiteContextType } from 'context/site';
import Layout from 'components/Layout';
import {
  GetAvailableInstancesQuery,
  GetInstanceContextQuery,
  GetInstanceContextQueryVariables,
} from 'common/__generated__/graphql';
import { Theme } from '@kausal/themes/types';
import numbro from 'numbro';
import { setSignificantDigits } from 'common/preprocess';

const basePath = getConfig().publicRuntimeConfig.basePath || '';

require('../../styles/default/main.scss');

if (process.browser) {
  setBasePath();
}

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

export type PathsAppProps = AppProps & {
  siteContext: SiteContextType;
  instanceContext: InstanceContextType;
  themeProps: Theme;
  apolloClient?: ApolloClientType;
};

function PathsApp(props: PathsAppProps) {
  const { Component, pageProps, siteContext, instanceContext, themeProps } =
    props;

  const { i18n } = useTranslation();
  console.log('app render');
  const apolloClient = initializeApollo(null, siteContext.apolloConfig);

  numbro.setLanguage(
    i18n.language,
    i18n.language.indexOf('-') > 0 ? i18n.language.split('-')[0] : undefined
  );

  // NextJS messes up client router's defaultLocale in some instances.
  // Override it here.
  if (typeof window !== 'undefined') {
    const defaultLocale = window.__NEXT_DATA__.defaultLocale;
    if (router.defaultLocale !== defaultLocale) {
      router.defaultLocale = defaultLocale;
    }
  }

  const instance = instanceContext;
  setSignificantDigits(instance.features.showSignificantDigits);

  const activeScenario = siteContext.scenarios.find((sc) => sc.isActive);
  const goals = instance.goals;

  if (!activeGoalVar()) {
    const defaultGoal =
      goals.length > 1 ? goals.find((goal) => goal.default) : goals[0];
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

  const component = <Component {...pageProps} />;

  return (
    <SiteContext.Provider value={siteContext}>
      <InstanceContext.Provider value={instanceContext}>
        <ApolloProvider client={apolloClient}>
          <ThemeProvider theme={themeProps}>
            <ThemedGlobalStyles />
            <Layout>
              <Sentry.ErrorBoundary>{component}</Sentry.ErrorBoundary>
            </Layout>
          </ThemeProvider>
        </ApolloProvider>
      </InstanceContext.Provider>
    </SiteContext.Provider>
  );
}

async function getSiteContext(ctx: PathsPageContext, locale: string) {
  /**
   * Load the static, global data related to the instance and theme.
   *
   * SSR only
   */

  // First determine the hostname for the request which we might need
  // for loading the instance that is related to it.
  let host: string;
  const { req } = ctx;
  if (req) {
    host = req.currentURL.hostname;
  } else {
    host = window.location.hostname;
  }
  const { instanceConfig } = req;

  const { isProtected } = instanceConfig;

  // Instance is identified either by a hard-coded identifier or by the
  // request hostname.
  const apolloConfig = {
    instanceHostname: host,
    instanceIdentifier: instanceConfig.identifier,
    authorizationToken: req.user?.idToken,
  };
  const apolloConfigServer = {
    forwardedFor: req.headers['x-forwarded-for'],
    remoteAddress: req.socket.remoteAddress,
    currentURL: req.currentURL,
  };
  const apolloClient: ApolloClient<object> = initializeApollo(null, {
    ...apolloConfig,
    ...apolloConfigServer,
  });

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
        locale,
      },
    });
    const { scenarios } = data;
    instance = data.instance!;

    siteContext = {
      scenarios: data.scenarios,
      parameters: data.parameters,
      menuPages: data.menuPages,
      title: instance.name!,
      apolloConfig,
      availableNormalizations: data.availableNormalizations,
      referenceYear: instance.referenceYear ?? null,
      minYear: instance.minimumHistoricalYear,
      maxYear: instance.modelEndYear,
      targetYear: instance.targetYear ?? instance.modelEndYear,
      latestMetricYear: instance.maximumHistoricalYear || 2018,
      baselineName: scenarios.find((scenario) => scenario.id === 'baseline')
        ?.name,
      iconBase: `${basePath}/static/themes/default/images/favicon`,
      ogImage: `${basePath}/static/themes/default/images/og-image-default.png`,
    };
  } catch (error) {
    if (isApolloError(error)) {
      const isProtected = error.graphQLErrors.find(
        (err) => err.extensions?.code == 'instance_protected'
      );
      console.log(error.graphQLErrors);
      if (isProtected) {
      }
    }
    throw new Error(`Error loading instance data: ${error}`);
  }
  Object.assign(
    siteContext,
    defaultSiteContext[instance.id] || defaultSiteContext['sunnydale']
  );
  return {
    siteContext,
    instanceContext: instance,
  };
}

async function getI18nProps(ctx: PathsPageContext) {
  // SSR only
  const { serverSideTranslations } = await import(
    'next-i18next/serverSideTranslations'
  );
  const nextI18nConfig = (await import('../../next-i18next.config')).default;
  const { publicRuntimeConfig } = getConfig();
  const locale: string =
    ctx.locale || publicRuntimeConfig.locale || ctx.locales?.[0];
  const i18n = getI18n();

  if (!locale) {
    throw new Error('Locale not set');
  }
  if (i18n) {
    await i18n.changeLanguage(locale);
  }
  const conf = {
    ...nextI18nConfig,
    i18n: {
      ...nextI18nConfig.i18n,
      defaultLocale: ctx.defaultLocale!,
      locales: ctx.locales!,
    },
  };
  const i18nConfig = await serverSideTranslations(locale, ['common'], conf);
  return i18nConfig;
}

type InstanceConfig = GetAvailableInstancesQuery['availableInstances'][0];

type PathsAppRequest = AppContext['ctx']['req'] & {
  instanceConfig: InstanceConfig;
  currentURL: {
    baseURL: string;
    path: string;
    hostname: string;
  };
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

PathsApp.getInitialProps = async (appContext: PathsAppContext) => {
  const { ctx } = appContext;

  if (process.browser) {
    console.log('browser getinitialprops');
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

  // SSR
  setBasePath();
  const i18nProps = await getI18nProps(ctx);
  const siteProps = await getSiteContext(ctx, ctx.locale!);
  const appProps = await App.getInitialProps(appContext);
  const pageProps = {
    ...appProps.pageProps,
    ...i18nProps,
  };
  const theme = await loadTheme(
    siteProps?.instanceContext?.themeIdentifier || 'default'
  );

  return {
    ...appProps,
    ...(siteProps || {}),
    themeProps: theme,
    pageProps,
  };
};

const PathsAppWithTranslation = appWithTranslation(PathsApp);

export default PathsAppWithTranslation;
