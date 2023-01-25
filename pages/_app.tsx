import { gql, ApolloProvider, ApolloClient, ApolloError, isApolloError } from '@apollo/client';
import { useEffect } from 'react';
import App, { AppContext, AppProps } from "next/app";
import { useRouter } from 'next/router';
import { ThemeProvider } from 'styled-components';
import getConfig from 'next/config';

import { appWithTranslation } from 'next-i18next';
import * as Sentry from '@sentry/react';

import { ApolloClientType, initializeApollo } from 'common/apollo';
import { setBasePath } from 'common/links';
import { loadTheme } from 'common/theme';
import { getI18n } from 'common/i18n';
import ThemedGlobalStyles from 'common/ThemedGlobalStyles';
import { yearRangeVar, settingsVar, activeScenarioVar } from 'common/cache';
import { GET_INSTANCE_CONTEXT, InstanceContextType } from 'common/instance';
import SiteContext, { SiteContextType } from 'context/site';
import Layout from 'components/Layout';
import type { GetAvailableInstancesQuery, GetInstanceContextQuery, GetInstanceContextQueryVariables } from 'common/__generated__/graphql';
import { Theme } from '@kausal/themes/types';
import { scenarioFragment } from 'common/queries/instance';

let basePath = getConfig().publicRuntimeConfig.basePath || '';

require('../styles/default/main.scss');

if (process.browser) {
  setBasePath();
}

const defaultSiteContext: {[key: string]: SiteContextType} = {
  sunnydale: {
    showYearSelector: true,
    showScenarios: true,
    showTargetBar: true,
    split: true,
    loginLink: false,
    showBaseline: true,
    showTarget: true,
    useBaseYear: true,
    showNavTitle: true,
    showLangSelector: true,
    watchLink: null,
    demoPages: [
      {
        id: 's-en-1',
        lang: 'en',
        title: 'About',
        urlPath: '/demo/about'
      },
      {
        id: 's-de-1',
        lang: 'de',
        title: 'Info',
        urlPath: '/demo/about'
      },
      {
        id: 's-fi-1',
        lang: 'fi',
        title: 'Tietoa palvelusta',
        urlPath: '/demo/about'
      },
    ]
  },
  tampere: {
    /** Should user be able to choose reference year and end year */
    showYearSelector: true,
    /** Should user be able to select different scenarios */
    showScenarios: true, 
    showTargetBar: true, // remove, replace with targetBarNodes?? instead
    split: true, // remove
    loginLink: false, // replace with instance.adminUrl
    showBaseline: true, // replace with instance.features.baselineVisibleInGraphs
    showTarget: true, // remove
    useBaseYear: true, // remove, use instance.referenceYear != null instead
    showNavTitle: true, // remove
    showLangSelector: true, // remove, check instead for instance.supportedLanguages.length
    watchLink: {
      title: 'Ilmastovahti',
      url: 'https://ilmastovahti.tampere.fi',
    },  // remove, replace with instance.externalLinks[0]
    // add instance.homeLinkTitle
  },
  ilmastoruoka: {
    showYearSelector: true,
    showScenarios: true,
    showTargetBar: false,
    split: true,
    loginLink: false,
    showBaseline: true,
    showTarget: true,
    useBaseYear: false,
    showNavTitle: true,
    showLangSelector: false,
    watchLink: null,
  },
  healthimpact: {
    showYearSelector: true,
    showScenarios: true,
    showTargetBar: false,
    split: true,
    loginLink: false,
    showBaseline: true,
    showTarget: true,
    useBaseYear: false,
    showNavTitle: true,
    showLangSelector: false,
    watchLink: null,
  },
  gronlogik: {
    showYearSelector: true,
    showScenarios: true,
    showTargetBar: false,
    split: true,
    loginLink: false,
    showBaseline: true,
    showTarget: true,
    useBaseYear: false,
    showNavTitle: true,
    showLangSelector: false,
    watchLink: null,
    homeLink: [
      {
        id: 'hp-en',
        lang: 'en',
        title: 'Emissions',
        urlPath: '/',
      },
      {
        id: 'hp-sv',
        lang: 'sv',
        title: 'Utsläpp',
        urlPath: '/',
      },
      {
        id: 'hp-fi',
        lang: 'fi',
        title: 'Päästöt',
        urlPath: '/',
      },
    ],
  },
  espoo: {
    showYearSelector: true,
    showScenarios: true,
    showTargetBar: true,
    split: true,
    loginLink: false,
    showBaseline: true,
    showTarget: true,
    useBaseYear: true,
    showNavTitle: true,
    showLangSelector: true,
    watchLink: {
      title: 'Ilmastovahti',
      url: 'https://ilmastovahti.espoo.fi',
    },
  },
  zuerich: {
    showYearSelector: true,
    showScenarios: true,
    showTargetBar: true,
    split: true,
    loginLink: false,
    showBaseline: false,
    showTarget: true,
    useBaseYear: true,
    showNavTitle: true,
    showLangSelector: true,
    watchLink: null,
  },
}


type PathsAppProps = AppProps & {
  siteContext: SiteContextType,
  instanceContext: InstanceContextType,
  themeProps: Theme,
  apolloClient?: ApolloClientType,
};

function PathsApp(props: PathsAppProps) {
  const {
    Component, pageProps, siteContext, instanceContext, themeProps,
  } = props;
  const { scenarios, parameters, } = siteContext;
  const router = useRouter();

  const apolloClient = initializeApollo(null, siteContext.apolloConfig);

  // NextJS messes up client router's defaultLocale in some instances.
  // Override it here.
  if (process.browser) {
    const defaultLocale = window.__NEXT_DATA__.defaultLocale;
    if (router.defaultLocale !== defaultLocale) {
      router.defaultLocale = defaultLocale;
    }
  }

  const instance = instanceContext;

  useEffect(() => {
    const fetchActiveScenario = async () => {
      const { data } = await apolloClient.query({
        query: gql`
          query GetActiveScenario {
            activeScenario {
              ...ScenarioFragment
            }
          }
          ${scenarioFragment}
        `,
      });
      if (data?.activeScenario) {
        activeScenarioVar(data.activeScenario);
      }
    }
    fetchActiveScenario().catch(err => console.error(err));
  }, [apolloClient]);

  if (!settingsVar()) {
    settingsVar({
      baseYear: instance.referenceYear || 1990,
      minYear: instance.minimumHistoricalYear || 2010,
      maxYear: instance.targetYear,
      latestMetricYear: instance.maximumHistoricalYear || 2018,
      baselineName: scenarios.find((scenario) => scenario.id === 'baseline')?.name,
      iconBase: `${basePath}/static/themes/default/images/favicon`,
      ogImage: `${basePath}/static/themes/default/images/og-image-default.png`,
      parameters: parameters,
    });
  }

  if (!yearRangeVar().length) {
    yearRangeVar([instance.referenceYear || 1990, instance.targetYear]);
  }

  /*
  if (!activeScenarioVar()) {
    console.log('setting active scenario');
    activeScenarioVar(scenarios.find((scenario) => scenario.isActive));
  }
  */

  const component = <Component {...pageProps} />;

  return (
    <SiteContext.Provider value={siteContext}>
      <ApolloProvider client={apolloClient}>
        <ThemeProvider theme={themeProps}>
          <ThemedGlobalStyles />
            <Layout>
              <Sentry.ErrorBoundary>
                { component }
              </Sentry.ErrorBoundary>
            </Layout>
        </ThemeProvider>
      </ApolloProvider>
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
  const { req, res } = ctx;
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
  }
  const apolloClient: ApolloClient<{}> = initializeApollo(null, {...apolloConfig, ...apolloConfigServer});

  // Load the instance configuration from backend
  let instance: InstanceContextType;
  let siteContext: SiteContextType;
  try {
    const { data } = await apolloClient.query<GetInstanceContextQuery, GetInstanceContextQueryVariables>({
      query: GET_INSTANCE_CONTEXT,
      context: {
        locale
      }
    });
    instance = data.instance!;
    siteContext = {
      scenarios: data.scenarios,
      parameters: data.parameters,
      menuPages: data.menuPages,
      title: instance.name!,
      apolloConfig,
    };
  } catch (error) {
    if (isApolloError(error)) {
      const isProtected = error.graphQLErrors.find((err) => err.extensions?.code == 'instance_protected');
      console.log(error.graphQLErrors);
      if (isProtected) {
      }
    }
    throw new Error(`Error loading instance data: ${error}`);
  }
  Object.assign(siteContext, defaultSiteContext[instance.id] || defaultSiteContext['sunnydale']);
  return {
    siteContext,
    instanceContext: instance,
  }
}

async function getI18nProps(ctx: PathsPageContext) {
  // SSR only
  const { serverSideTranslations } = require('next-i18next/serverSideTranslations');
  const nextI18nConfig = require('../next-i18next.config');
  const { publicRuntimeConfig } = getConfig();
  let locale = ctx.locale || publicRuntimeConfig.locale || ctx.locales?.[0];
  const i18n = getI18n();

  if (!locale) {
    throw new Error("Locale not set");
  }
  if (i18n) {
    await i18n.changeLanguage(locale);
  }
  const conf = {
    ...nextI18nConfig,
    i18n: {
      ...nextI18nConfig.i18n,
      defaultLocale: ctx.defaultLocale,
      locales: ctx.locales,
    }
  };
  const i18nConfig = await serverSideTranslations(
    locale, ['common'], conf
  );
  return i18nConfig;
}

type InstanceConfig = GetAvailableInstancesQuery['availableInstances'][0];


type PathsAppRequest = AppContext['ctx']['req'] & {
  instanceConfig: InstanceConfig,
  currentURL: {
    baseURL: string,
    path: string,
    hostname: string,
  },
  user?: {
    idToken: string,
  },
};

type PathsPageContext = Omit<AppContext['ctx'], 'req'> & {
  req: PathsAppRequest
}

type PathsAppContext = Omit<AppContext, 'ctx'> & {
  ctx: PathsPageContext,
}

PathsApp.getInitialProps = async (appContext: PathsAppContext) => {
  const { ctx } = appContext; 

  if (process.browser) {
    const appProps = await App.getInitialProps(appContext);
    const nextData = window.__NEXT_DATA__;
    const { _nextI18Next } = nextData.props.pageProps;
    const { siteContext, instanceContext, themeProps, } = nextData.props;
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
  const siteProps = await getSiteContext(ctx, ctx.locale);
  const appProps = await App.getInitialProps(appContext);
  const pageProps = {
    ...appProps.pageProps,
    ...i18nProps,
  };
  const theme = await loadTheme(siteProps?.instanceContext?.themeIdentifier || 'default')

  return {
    ...appProps,
    ...(siteProps || {}),
    themeProps: theme,
    pageProps,
  };
};

export default appWithTranslation(PathsApp);
