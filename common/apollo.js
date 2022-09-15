// Copied from: https://github.com/vardhanapoorv/epl-nextjs-app/blob/main/lib/apolloClient.js
import { i18n } from 'next-i18next'
import { useMemo } from 'react';
import getConfig from 'next/config';
import { ApolloClient, ApolloLink, HttpLink, InMemoryCache } from '@apollo/client';
import possibleTypes from 'common/__generated__/possible_types.json';


const { serverRuntimeConfig, publicRuntimeConfig } = getConfig();

const localeMiddleware = new ApolloLink((operation, forward) => {
  operation.setContext(({ headers = {}, locale }) => {
    if (locale || (i18n && i18n.language)) {
      return {
        headers: {
          ...headers,
          "accept-language": locale || i18n.language,
        }
      }
    }
  });

  return forward(operation);
});

const makeInstanceMiddleware = (opts) => {
  /**
   * Middleware that sets HTTP headers for identifying the Paths instance.
   *
   * If identifier is set directly, use that, or fall back to request hostname.
   */
  const { instanceHostname, instanceIdentifier } = opts;
  if (!instanceHostname && !instanceIdentifier) {
    throw new Error("Neither hostname or identifier set for the instance")
  }

  const middleware = new ApolloLink((operation, forward) => {
    operation.setContext(({ headers = {} }) => {
      if (instanceIdentifier)
        headers['x-paths-instance-identifier'] = instanceIdentifier;
      else if (instanceHostname)
        headers['x-paths-instance-hostname'] = instanceHostname;
      return {
        headers
      }
    });

    return forward(operation);
  });

  return middleware;
}


let apolloClient;

function createApolloClient(opts) {
  const ssrMode = typeof window === 'undefined';
  const uri = ssrMode ? serverRuntimeConfig.graphqlUrl : publicRuntimeConfig.graphqlUrl;

  const httpLink = new HttpLink({
    uri,
    credentials: 'include',
  });

  return new ApolloClient({
    ssrMode,
    link: ApolloLink.from([
      localeMiddleware, makeInstanceMiddleware(opts), httpLink
    ]),
    cache: new InMemoryCache({
      possibleTypes: possibleTypes.possibleTypes,
    }),
  });
}

export function initializeApollo(initialState, opts) {
  const _apolloClient = apolloClient ?? createApolloClient(opts);

  // If your page has Next.js data fetching methods that use Apollo Client, the initial state
  // gets hydrated here
  if (initialState) {
    // Get existing cache, loaded during client side data fetching
    const existingCache = _apolloClient.extract();
    // Restore the cache using the data passed from getStaticProps/getServerSideProps
    // combined with the existing cached data
    _apolloClient.cache.restore({ ...existingCache, ...initialState });
  }
  // For SSG and SSR always create a new Apollo Client
  if (typeof window === 'undefined') return _apolloClient;
  // Create the Apollo Client once in the client
  if (!apolloClient) apolloClient = _apolloClient;
  return _apolloClient;
}

export function useApollo(initialState, siteContext) {
  return initializeApollo(initialState, siteContext);
  const { instanceIdentifier, instanceHostname } = siteContext;
  const store = useMemo(
    () => initializeApollo(initialState, {
      instanceIdentifier,
      instanceHostname
    }),
    [initialState, instanceIdentifier, instanceHostname]
  );
  return store;
}
