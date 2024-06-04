import type { NextRequest } from 'next/server';

import {
  ApolloClient,
  ApolloLink,
  gql,
  HttpLink,
  InMemoryCache,
  type NormalizedCacheObject,
} from '@apollo/client';
import * as Sentry from '@sentry/nextjs';
import { SentryLink } from 'apollo-link-sentry';
import type { Logger } from 'pino';

import type {
  AvailableInstanceFragment,
  GetAvailableInstancesQuery,
  GetAvailableInstancesQueryVariables,
} from '@/common/__generated__/graphql';
import { type ApolloClientOpts, getHttpHeaders, logQueryEnd, logQueryStart } from '@/common/apollo';
import { getRuntimeConfig } from '@/common/environment';
import { logApolloError } from '@/common/log';
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

function createApolloClient(req: NextRequest) {
  const config = getRuntimeConfig();

  const fwdforHdr = req.headers.get('x-forwarded-for');
  const apolloOpts: ApolloClientOpts = {
    currentURL: {
      baseURL: req.nextUrl.origin,
      path: req.nextUrl.pathname,
    },
    clientIp: fwdforHdr ? fwdforHdr.split(',')[0] : undefined,
    // clientcookies??
  };
  const httpLink = new HttpLink({
    uri: config.gqlUrl,
    credentials: 'include',
    fetchOptions: {
      referrerPolicy: 'unsafe-url',
    },
    headers: getHttpHeaders(apolloOpts),
  });

  const client: ApolloClientType = new ApolloClient({
    ssrMode: false,
    uri: config.gqlUrl,
    link: ApolloLink.from([
      logQueryStart,
      new SentryLink({
        uri: config.gqlUrl,
        setTransaction: false,
        attachBreadcrumbs: {
          includeVariables: true,
          includeError: true,
        },
      }),
      new ApolloLink((operation, forward) => {
        operation.setContext(({ headers = {} }) => {
          const ctxHeaders = getHttpHeaders(apolloOpts);
          return {
            headers: {
              ...headers,
              ...ctxHeaders,
            },
          };
        });
        return forward(operation);
      }),
      logQueryEnd,
      httpLink,
    ]),
    cache: new InMemoryCache(),
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

export async function getInstancesForRequest(req: NextRequest, hostname: string, logger: Logger) {
  const instances = instanceCache.get(hostname);
  if (instances) return instances;

  const client = createApolloClient(req);
  let data: AvailableInstanceFragment[];
  try {
    data = await Sentry.withScope(async (scope) => {
      scope.setTag('hostname', hostname);
      return await queryInstances(client, hostname, logger);
    });
  } catch (error) {
    logApolloError(error, { query: GET_AVAILABLE_INSTANCES }, logger);
    throw error;
  }
  instanceCache.set(hostname, data);
  return data;
}
