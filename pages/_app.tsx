import { gql, ApolloProvider } from '@apollo/client';
import { useEffect } from 'react';
import App from "next/app";
import { useRouter } from 'next/router';
import { ThemeProvider } from 'styled-components';
import getConfig from 'next/config';
import { appWithTranslation } from 'next-i18next';
import * as Sentry from '@sentry/react';

import { useApollo } from 'common/apollo';
import { setBasePath } from 'common/links';
import theme, { setTheme, applyTheme } from 'common/theme';
import { getI18n } from 'common/i18n';
import ThemedGlobalStyles from 'common/ThemedGlobalStyles';
import { yearRangeVar, settingsVar, activeScenarioVar } from 'common/cache';
import InstanceContext, { GET_INSTANCE_CONTEXT } from 'common/instance';
import SiteContext from 'context/site';
import Layout from 'components/Layout';

let basePath = getConfig().publicRuntimeConfig.basePath || '';

require('../styles/default/main.scss');

if (process.browser) {
  setBasePath();
}

const defaultSiteContext = {
  sunnydale: {
    theme: 'default',
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
  kpr: {
    theme: 'kpr',
    showYearSelector: true,
    showScenarios: true,
    showTargetBar: true,
    split: false,
    loginLink: false,
    showBaseline: true,
    showTarget: true,
    useBaseYear: false,
    showNavTitle: false,
    showLangSelector: false,
    watchLink: null,
  },
  tampere: {
    theme: 'tampere-ilmasto',
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
      url: 'https://ilmastovahti.tampere.fi',
    },
  },
  ilmastoruoka: {
    theme: 'default',
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
    theme: 'default',
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
    theme: 'default',
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
    theme: 'zurich',
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
    homeLink: [
      {
        id: 'hp-en',
        lang: 'en',
        title: 'Emissions',
        urlPath: '/',
      },
      {
        id: 'hp-de',
        lang: 'de',
        title: 'Emissions',
        urlPath: '/',
      },
      {
        id: 'hp-fi',
        lang: 'fi',
        title: 'Päästöt',
        urlPath: '/',
      },
    ],
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
}


function PathsApp(props) {
  const {
    Component, pageProps, siteContext, themeProps,
  } = props;
  //console.log("App Props", props);
  const { instance, scenarios, parameters } = siteContext;
  const router = useRouter();
  const apolloClient = useApollo(pageProps.data, siteContext);

  // NextJS messes up client router's defaultLocale in some instances.
  // Override it here.
  if (process.browser) {
    const defaultLocale = window.__NEXT_DATA__.defaultLocale;
    if (router.defaultLocale !== defaultLocale) {
      router.defaultLocale = defaultLocale;
    }
  }

  useEffect(() => {
    yearRangeVar([instance.referenceYear || 1990, instance.targetYear]);
    settingsVar({
      baseYear: instance.referenceYear || 1990,
      minYear: instance.minimumHistoricalYear || 2010,
      maxYear: instance.targetYear,
      latestMetricYear: instance.maximumHistoricalYear || 2018,
      totalEmissions: 540,
      emissionsTarget: 266,
      baselineName: scenarios.find((scenario) => scenario.id === 'baseline').name,
      iconBase: `${basePath}/static/themes/default/images/favicon`,
      ogImage: `${basePath}/static/themes/default/images/og-image-default.png`,
      parameters: parameters,
    });
    activeScenarioVar(scenarios.find((scenario) => scenario.isActive));
  }, []);

  if (process.browser) {
    setTheme(themeProps);
  }

  const component = <Component {...pageProps} />;

  return (
    <SiteContext.Provider value={siteContext}>
      <ApolloProvider client={apolloClient}>
        <ThemeProvider theme={theme}>
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

async function getSiteContext(req, locale) {
  /**
   * Load the static, global data related to the instance and theme.
   */

  // First determine the hostname for the request which we might need
  // for loading the instance that is related to it.
  let host;
  if (req) {
    const { headers } = req;
    host = headers['host'].split(':')[0];
  } else {
    host = window.location.hostname;
  }
  const { publicRuntimeConfig } = getConfig();
  // Instance is identified either by a hard-coded identifier or by the
  // request hostname.
  const siteContext = {
    instanceIdentifier: publicRuntimeConfig.instanceIdentifier,
    instanceHostname: host,
  };
  const apolloClient = useApollo(null, siteContext);

  // Load the instance configuration from backend
  const { data, error } = await apolloClient.query({
    query: GET_INSTANCE_CONTEXT,
    context: {
      locale
    }
  });
  if (error) {
    throw new Error(`Error loading instance data: ${error}`);
  }
  Object.assign(siteContext, data);
  Object.assign(siteContext, defaultSiteContext[data.instance.id] || defaultSiteContext['sunnydale']);
  siteContext.title = data.instance.name;
  return {
    siteContext,
    instanceContext: data.instance,
  }
}

async function getI18nProps(ctx) {
  const { serverSideTranslations } = require('next-i18next/serverSideTranslations');
  const nextI18nConfig = require('../next-i18next.config');
  const { publicRuntimeConfig } = getConfig();
  let locale = ctx.locale || publicRuntimeConfig.locale;
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


PathsApp.getInitialProps = async (appContext) => {
  const { ctx } = appContext; 
  const { req, err } = ctx;
  const appProps = await App.getInitialProps(appContext);

  if (process.browser) {
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
  const siteProps = await getSiteContext(req, ctx.locale);
  const pageProps = {
    ...appProps.pageProps,
    ...i18nProps,
  }
  await applyTheme(siteProps.instanceContext.themeIdentifier);
  return {
    ...appProps,
    ...siteProps,
    themeProps: theme,
    pageProps,
  };
};

export default appWithTranslation(PathsApp);
