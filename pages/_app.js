import 'styles/globals.scss';
import App from 'next/app';
import { ApolloProvider } from '@apollo/client';
import { ThemeProvider } from 'styled-components';

import { useApollo } from 'common/apollo';
import { yearRangeVar, settingsVar } from 'common/cache';

import { appWithTranslation } from 'next-i18next';

const appTheme = require('sass-extract-loader?{"plugins": ["sass-extract-js"]}!styles/themes/default.scss');

function PathsApp({ Component, pageProps }) {
  const apolloClient = useApollo(pageProps.initialApolloState);

  yearRangeVar([1990, 2030]);
  settingsVar({
    baseYear: 1990,
    minYear: 2010,
    maxYear: 2030,
    totalEmissions: 540,
  });

  return (
    <ApolloProvider client={apolloClient}>
      <ThemeProvider theme={appTheme}>
        <Component {...pageProps} />
      </ThemeProvider>
    </ApolloProvider>
  );
}

PathsApp.getInitialProps = async (appContext) => {
  const appProps = await App.getInitialProps(appContext);
  return { ...appProps };
};

export default appWithTranslation(PathsApp);
