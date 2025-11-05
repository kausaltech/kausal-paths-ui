import type { NextRequest } from 'next/server';

import {
  ApolloClient,
  ApolloLink,
  HttpLink,
  InMemoryCache,
  type NormalizedCacheObject,
  gql,
} from '@apollo/client';
import * as Sentry from '@sentry/nextjs';
import type { Logger } from 'pino';

import { createSentryLink, logOperationLink } from '@common/apollo/links';
import { getPathsGraphQLUrl } from '@common/env';
import { envToBool } from '@common/env/utils';
import { getClientIP } from '@common/utils';

import type {
  AvailableInstanceFragment,
  GetAvailableInstancesQuery,
  GetAvailableInstancesQueryVariables,
} from '@/common/__generated__/graphql';
import { type ApolloClientOpts, getHttpHeaders } from '@/common/apollo';

import LRUCache from './lru-cache';

const GET_AVAILABLE_INSTANCES = gql`
  query GetAvailableInstances($hostname: String!) {
    availableInstances(hostname: $hostname) {
      ...AvailableInstance
    }
  }
  fragment AvailableInstance on InstanceBasicConfiguration {
    identifier
    isProtected
    defaultLanguage
    supportedLanguages
    themeIdentifier
    hostname {
      basePath
    }
  }
`;

const instanceCache = new LRUCache<string, AvailableInstanceFragment[]>();
type ApolloClientType = ApolloClient<NormalizedCacheObject>;

function createApolloClient(req: NextRequest, logger: Logger) {
  const uri = getPathsGraphQLUrl();
  const apolloOpts: ApolloClientOpts = {
    currentURL: {
      baseURL: req.nextUrl.origin,
      path: req.nextUrl.pathname,
    },
    clientIp: getClientIP(req),
    // clientcookies??
  };
  const httpLink = new HttpLink({
    uri,
    credentials: 'include',
    fetchOptions: {
      referrerPolicy: 'unsafe-url',
    },
  });

  const client: ApolloClientType = new ApolloClient({
    ssrMode: false,
    link: ApolloLink.from([
      logOperationLink,
      createSentryLink(uri),
      new ApolloLink((operation, forward) => {
        operation.setContext(({ headers = {} }) => {
          const ctxHeaders = getHttpHeaders(apolloOpts);
          const newHeaders = {
            ...headers,
            ...ctxHeaders,
          };
          return {
            headers: newHeaders,
          };
        });
        return forward(operation);
      }),
      httpLink,
    ]),
    cache: new InMemoryCache(),
    defaultContext: {
      logger: logger,
    },
  });
  return client;
}

async function queryInstances(client: ApolloClientType, hostname: string, logger: Logger) {
  const resp = await client.query<GetAvailableInstancesQuery, GetAvailableInstancesQueryVariables>({
    query: GET_AVAILABLE_INSTANCES,
    variables: {
      hostname: hostname,
    },
    fetchPolicy: 'no-cache',
    context: {
      logger: logger,
    },
  });
  if (resp.error) {
    throw resp.error;
  }
  if (!resp.data || !resp.data.availableInstances) {
    throw new Error('Not found'); // fixme
  }
  return resp.data.availableInstances;
}

const disableInstanceCache = envToBool(process.env.DISABLE_INSTANCE_LRU_CACHE, false);

export async function getInstancesForRequest(req: NextRequest, hostname: string, logger: Logger) {
  const instances = instanceCache.get(hostname);
  if (instances && !disableInstanceCache) return instances;

  const client = createApolloClient(req, logger);
  let data: AvailableInstanceFragment[];
  try {
    data = await Sentry.withScope(async (scope) => {
      scope.setTag('hostname', hostname);
      return await queryInstances(client, hostname, logger);
    });
  } catch (error) {
    throw error;
  }
  instanceCache.set(hostname, data);
  return data;
}
