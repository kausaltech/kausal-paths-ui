import 'styles/globals.scss'
import App from 'next/app'
import { ApolloProvider } from "@apollo/client";
import { ThemeProvider } from 'styled-components';
import { gql, useQuery } from "@apollo/client";
import { Spinner } from 'reactstrap';

import { useApollo } from 'common/apollo';
import AreaContext from 'common/area';
// import { appWithTranslation } from '../i18n';


const QUERY = gql`
  query {
    __typename
  }
`;


const appTheme = require('sass-extract-loader?{"plugins": ["sass-extract-js"]}!styles/themes/default.scss');
function PathsApp({ Component, pageProps }) {
  const apolloClient = useApollo(pageProps.initialApolloState);
  const {
    loading, error, data
  } = useQuery(QUERY, {client: apolloClient});
  let component;

  if (error) {
    component = <div>{`Error loading data: ${error}`}</div>;
  } else if (loading) {
    component = <Spinner style={{ width: '3rem', height: '3rem' }} />
  } else {
    component = <Component {...pageProps} />
  }

  return (
    <ApolloProvider client={apolloClient}>
      <ThemeProvider theme={appTheme}>
        <AreaContext.Provider value={data}>
          {component}
        </AreaContext.Provider>
      </ThemeProvider>
    </ApolloProvider>
  );
}

PathsApp.getInitialProps = async (appContext) => {
  const appProps = await App.getInitialProps(appContext)
  return { ...appProps }
}

// export default appWithTranslation(PathsApp)
export default PathsApp
