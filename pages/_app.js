import 'styles/globals.scss';
import { useApollo } from 'common/apollo';
import { gql, useQuery, ApolloProvider } from '@apollo/client';
import { ThemeProvider } from 'styled-components';
import { Spinner } from 'reactstrap';
import { yearRangeVar, settingsVar, activeScenarioVar } from 'common/cache';

import { appWithTranslation } from 'next-i18next';

const appTheme = require('sass-extract-loader?{"plugins": ["sass-extract-js"]}!styles/themes/default.scss');

const GET_INSTANCE = gql`
{
  instance {
    id
    targetYear
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
    loading, error, data,
  } = useQuery(GET_INSTANCE, { client: apolloClient });
  let component;

  if (error) {
    component = <div>{`Error loading data: ${error}`}</div>;
  } else if (loading) {
    component = <Spinner style={{ width: '3rem', height: '3rem' }} />;
  } else {
    component = <Component {...pageProps} />;
    yearRangeVar([1990, data.instance.targetYear]);
    settingsVar({
      baseYear: 1990,
      minYear: 2010,
      maxYear: data.instance.targetYear,
      totalEmissions: 540,
    });
    activeScenarioVar(data.scenarios.find((scenario) => scenario.isActive));
  }

  return (
    <ApolloProvider client={apolloClient}>
      <ThemeProvider theme={appTheme}>
        { component }
      </ThemeProvider>
    </ApolloProvider>
  );
}

export default appWithTranslation(PathsApp);
