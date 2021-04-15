// Copied from: https://github.com/vardhanapoorv/epl-nextjs-app/blob/main/lib/apolloClient.js
import { useMemo } from "react";
import getConfig from 'next/config'
import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client";


const { serverRuntimeConfig, publicRuntimeConfig } = getConfig()

let apolloClient;

function createApolloClient() {
  let ssrMode = typeof window === "undefined";
  let uri = ssrMode ? serverRuntimeConfig.graphqlUrl : publicRuntimeConfig.graphqlUrl;

  // console.log("endpoint...", uri)
  return new ApolloClient({
    ssrMode: ssrMode,
    link: new HttpLink({
      uri: uri,
      credentials: 'include',
    }),
    cache: new InMemoryCache({
      typePolicies: {
        EventIntParameter: {
          keyFields: false,
        },
        EventFloatParameter: {
          keyFields: false,
        },
        EventChoiceParameter: {
          keyFields: false,
        },
        Choice: {
          keyFields: false,
        },
      },
    }),
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
  if (typeof window === "undefined") return _apolloClient;
  // Create the Apollo Client once in the client
  if (!apolloClient) apolloClient = _apolloClient;
  return _apolloClient;
}

export function useApollo(initialState) {
  const store = useMemo(() => initializeApollo(initialState), [initialState]);
  return store;
}
