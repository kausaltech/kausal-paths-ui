import { useApollo } from 'common/apollo';
import { gql, useQuery, ApolloProvider } from '@apollo/client';
import { ThemeProvider } from 'styled-components';
import { Spinner } from 'reactstrap';
import ThemedGlobalStyles from 'common/ThemedGlobalStyles';
import { yearRangeVar, settingsVar, activeScenarioVar } from 'common/cache';

import { appWithTranslation } from 'next-i18next';

require('../styles/default/main.scss');
const defaultTheme = require('public/static/themes/tampere-ilmasto/theme.json');

const GET_INSTANCE = gql`
{
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

  const {
    loading, error, data, previousData,
  } = useQuery(GET_INSTANCE, { client: apolloClient });
  let component;

  if (error) {
    component = <div>{`Error loading data: ${error}`}</div>;
  } else if (loading) {
    component = <Spinner style={{ width: '3rem', height: '3rem' }} />;
  } else {
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
      });
      activeScenarioVar(data.scenarios.find((scenario) => scenario.isActive));
    }
  }

  return (
    <ApolloProvider client={apolloClient}>
      <ThemeProvider theme={defaultTheme}>
        <ThemedGlobalStyles />
        { component }
      </ThemeProvider>
    </ApolloProvider>
  );
}

export default appWithTranslation(PathsApp);
