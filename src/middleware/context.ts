import type { NextRequest } from 'next/server';

import { ApolloClient, ApolloLink, HttpLink, InMemoryCache, gql } from '@apollo/client';
import * as Sentry from '@sentry/nextjs';
import type { Logger } from 'pino';

import { createSentryLink, logOperationLink, retryLink } from '@common/apollo/links';
import { getPathsGraphQLUrl } from '@common/env';
import { envToBool } from '@common/env/utils';
import { getClientIP } from '@common/utils';
import { SWRCache } from '@common/utils/swr-cache';

import type {
  AvailableInstanceFragment,
  AvailableInstancesQuery,
  AvailableInstancesQueryVariables,
} from '@/common/__generated__/graphql';
import { type ApolloClientOpts, getHttpHeaders } from '@/common/apollo-config';

const GET_AVAILABLE_INSTANCES = gql`
  query AvailableInstances($hostname: String!) {
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

type ApolloClientType = ApolloClient;

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
      retryLink,
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
  const resp = await client.query<AvailableInstancesQuery, AvailableInstancesQueryVariables>({
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
    throw resp.error as Error;
  }
  if (!resp.data || !resp.data.availableInstances) {
    throw new Error('Not found'); // fixme
  }
  return resp.data.availableInstances;
}

const disableInstanceCache = envToBool(process.env.DISABLE_INSTANCE_LRU_CACHE, false);

interface InstanceFetchCtx {
  req: NextRequest;
  logger: Logger;
}

async function fetchInstances(hostname: string, { req, logger }: InstanceFetchCtx) {
  const client = createApolloClient(req, logger);
  return await Sentry.withScope(async (scope) => {
    scope.setTag('hostname', hostname);
    return await queryInstances(client, hostname, logger);
  });
}

const instanceCache = new SWRCache<string, AvailableInstanceFragment[], InstanceFetchCtx>({
  fetcher: fetchInstances,
  ttl: 2_000,
});

export async function getInstancesForRequest(req: NextRequest, hostname: string, logger: Logger) {
  const ctx = { req, logger };
  if (disableInstanceCache) {
    return fetchInstances(hostname, ctx);
  }
  return instanceCache.get(hostname, ctx);
}
