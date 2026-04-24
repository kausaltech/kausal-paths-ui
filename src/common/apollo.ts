import { ApolloClient, InMemoryCache } from '@apollo/client';

import type { DefaultApolloContext } from '@common/apollo';

import { type ApolloClientOpts, getApolloClientConfig } from './apollo-config';

declare module '@apollo/client/core' {
  export interface DefaultContext extends Partial<DefaultApolloContext> {
    instanceHostname?: string;
    locale?: string;
  }
}

let existingApolloClient: ApolloClient | undefined;

function createApolloClient(opts: ApolloClientOpts) {
  const { link, cache } = getApolloClientConfig(opts);
  return new ApolloClient({ link, cache: new InMemoryCache(cache) });
}

export function initializeApollo(opts: ApolloClientOpts) {
  const client = existingApolloClient ?? createApolloClient(opts);

  // For SSG and SSR always create a new Apollo Client
  if (typeof window === 'undefined') return client;
  return client;
}
