import { useApollo } from 'common/apollo';
import { gql, useQuery, ApolloProvider } from '@apollo/client';
import { useRouter } from 'next/router';
import { ThemeProvider } from 'styled-components';
import ThemedGlobalStyles from 'common/ThemedGlobalStyles';
import { yearRangeVar, settingsVar, activeScenarioVar } from 'common/cache';
import getConfig from 'next/config';
import { appWithTranslation } from 'next-i18next';
import SiteContext from 'context/site';
import ContentLoader from 'components/common/ContentLoader';

const { publicRuntimeConfig } = getConfig();
const basePath = publicRuntimeConfig.basePath ? publicRuntimeConfig.basePath : '';

const siteContext = {
  theme: 'default',
  showYearSelector: true,
  showScenarios: true,
  showTargetBar: true,
  split: true,
  loginLink: true,
  defaultLanguage: 'en',
};

require('../styles/default/main.scss');

const defaultTheme = require(`public/static/themes/${siteContext.theme}/theme.json`);

const GET_INSTANCE = gql`
query GetInstance {
    instance {
      id
      name
      targetYear
      referenceYear
      minimumHistoricalYear
      maximumHistoricalYear
    }
    scenarios {
      id
      isActive
      isDefault
      name
    }
}
`;

function PathsApp({ Component, pageProps }) {
  const apolloClient = useApollo(pageProps.initialApolloState);
  const router = useRouter();
  const {
    loading, error, data, previousData,
  } = useQuery(GET_INSTANCE, { client: apolloClient });
  let component;

  if (error) {
    component = <div>{`Error loading data: ${error}`}</div>;
  } else if (loading) {
    component = <ContentLoader />;
  } else {
    // Change active locale based on the instance front settings
    // causes some sort of loop, find an alternative solution
    // router.push(router.pathname, router.pathname, { locale: siteContext.defaultLanguage });
    component = <Component {...pageProps} />;
    if (!previousData) {
      yearRangeVar([data.instance.referenceYear || 1990, data.instance.targetYear]);
      settingsVar({
        baseYear: data.instance.referenceYear || 1990,
        minYear: data.instance.minimumHistoricalYear || 2010,
        maxYear: data.instance.targetYear,
        latestMetricYear: data.instance.maximumHistoricalYear || 2018,
        totalEmissions: 540,
        emissionsTarget: 266,
        baselineName: data.scenarios.find((scenario) => scenario.id === 'baseline').name,
        iconBase: `${basePath}/static/themes/default/images/favicon`,
        siteTitle: 'MMMM',
        ogImage: `${basePath}/static/themes/default/images/og-image-default.png`,
      });
      activeScenarioVar(data.scenarios.find((scenario) => scenario.isActive));
    }
  }

  return (
    <SiteContext.Provider value={siteContext}>
      <ApolloProvider client={apolloClient}>
        <ThemeProvider theme={defaultTheme}>
          <ThemedGlobalStyles />
          { component }
        </ThemeProvider>
      </ApolloProvider>
    </SiteContext.Provider>
  );
}

export default appWithTranslation(PathsApp);
