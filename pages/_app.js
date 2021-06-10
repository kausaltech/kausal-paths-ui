import { useState } from 'react';
import 'styles/globals.scss';
import App from 'next/app';
import { ApolloProvider } from '@apollo/client';
import { ThemeProvider } from 'styled-components';
import { SettingsContextProvider } from 'common/settings-context';

import { useApollo } from 'common/apollo';

import { appWithTranslation } from 'next-i18next';

const appTheme = require('sass-extract-loader?{"plugins": ["sass-extract-js"]}!styles/themes/default.scss');

function PathsApp({ Component, pageProps }) {
  const apolloClient = useApollo(pageProps.initialApolloState);
  const [yearRange, setYearRange] = useState([1990, 2030]);

  return (
    <ApolloProvider client={apolloClient}>
      <ThemeProvider theme={appTheme}>
        <SettingsContextProvider value={{ yearRange, setYearRange }}>
          <Component {...pageProps} />
        </SettingsContextProvider>
      </ThemeProvider>
    </ApolloProvider>
  );
}

PathsApp.getInitialProps = async (appContext) => {
  const appProps = await App.getInitialProps(appContext);
  return { ...appProps };
};

export default appWithTranslation(PathsApp);
