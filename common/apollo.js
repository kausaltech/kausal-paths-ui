// Copied from: https://github.com/vardhanapoorv/epl-nextjs-app/blob/main/lib/apolloClient.js
import { useMemo } from 'react';
import getConfig from 'next/config';
import { ApolloClient, ApolloLink, HttpLink } from '@apollo/client';
import { cache } from 'common/cache';

const { serverRuntimeConfig, publicRuntimeConfig } = getConfig();

const i18n = null;

const localeMiddleware = new ApolloLink((operation, forward) => {
  // Inject @locale directive into the query root object
  const { query } = operation;
  const { definitions } = query;
  const language = publicRuntimeConfig.defaultLanguage;

  /*
  if (i18n && i18n.language) {
    language = i18n.language;
  }
  */
  if (!language || definitions[0].operation === 'mutation') return forward(operation);

  const localeDirective = {
    kind: 'Directive',
    name: {
      kind: 'Name',
      value: 'locale',
    },
    arguments: [{
      kind: 'Argument',
      name: { kind: 'Name', value: 'lang' },
      value: { kind: 'StringValue', value: language, block: false },
    }],
  };

  operation.query = {
    ...query,
    definitions: [{
      ...definitions[0],
      directives: [
        ...definitions[0].directives,
        localeDirective,
      ],
    }, ...definitions.slice(1)],
  };

  return forward(operation);
});

let apolloClient;

function createApolloClient() {
  const ssrMode = typeof window === 'undefined';
  const uri = ssrMode ? serverRuntimeConfig.graphqlUrl : publicRuntimeConfig.graphqlUrl;

  const httpLink = new HttpLink({
    uri,
    credentials: 'include',
  });

  // console.log("endpoint...", uri)
  return new ApolloClient({
    ssrMode,
    link: ApolloLink.from([localeMiddleware, httpLink]),
    cache,
  });
}

export function initializeApollo(initialState = null) {
  const _apolloClient = apolloClient ?? createApolloClient();

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

export function useApollo(initialState) {
  const store = useMemo(() => initializeApollo(initialState), [initialState]);
  return store;
}
