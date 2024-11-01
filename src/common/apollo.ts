import {
  ApolloClient,
  ApolloLink,
  HttpLink,
  InMemoryCache,
  type NormalizedCacheObject,
} from '@apollo/client';
import { type DirectiveNode, Kind, type VariableDefinitionNode } from 'graphql';
import type { Logger } from 'pino';

import type { DefaultApolloContext } from '@common/apollo';
import { type DirectiveArg, createOperationDirective } from '@common/apollo/directives';
import { createSentryLink, logOperationLink } from '@common/apollo/links';
import { GRAPHQL_CLIENT_PROXY_PATH } from '@common/constants/routes.mjs';
import { getPathsGraphQLUrl, getRuntimeConfig } from '@common/env';

import possibleTypes from '@/common/__generated__/possible_types.json';

import {
  INSTANCE_HOSTNAME_HEADER,
  INSTANCE_IDENTIFIER_HEADER,
  WILDCARD_DOMAINS_HEADER,
} from './const';

declare module '@apollo/client/core' {
  export interface DefaultContext extends DefaultApolloContext {
    instanceHostname?: string;
  }
}

const localeMiddleware = new ApolloLink((operation, forward) => {
  operation.setContext(({ headers = {}, locale }) => {
    if (locale) {
      return {
        headers: {
          ...headers,
          'accept-language': locale,
        },
      };
    }
  });
  return forward(operation);
});

export type ApolloClientOpts = {
  instanceHostname?: string;
  instanceIdentifier?: string;
  wildcardDomains?: string[];
  authorizationToken?: string | undefined;
  clientIp?: string | null;
  locale?: string;
  currentURL?: {
    baseURL: string;
    path: string;
  };
  clientCookies?: string;
  logger?: Logger;
};

export function getHttpHeaders(opts: ApolloClientOpts) {
  const {
    instanceHostname,
    instanceIdentifier,
    wildcardDomains = getRuntimeConfig().wildcardDomains,
    authorizationToken,
    currentURL,
    clientIp,
    clientCookies,
  } = opts;
  const headers = {};

  if (instanceIdentifier) {
    headers[INSTANCE_IDENTIFIER_HEADER] = opts.instanceIdentifier;
  }
  if (instanceHostname) {
    headers[INSTANCE_HOSTNAME_HEADER] = instanceHostname;
  }
  if (wildcardDomains) {
    headers[WILDCARD_DOMAINS_HEADER] = wildcardDomains.join(',');
  }
  if (authorizationToken) {
    headers['authorization'] = `Bearer ${authorizationToken}`;
  }
  if (currentURL) {
    const { baseURL, path } = currentURL;
    headers['referer'] = baseURL + path;
  }
  if (!process.browser) {
    if (clientIp) {
      headers['x-forwarded-for'] = clientIp;
    }
    if (clientCookies) {
      headers['cookie'] = clientCookies;
    }
  }
  return headers;
}

const makeInstanceMiddleware = (opts: ApolloClientOpts) => {
  /**
   * Middleware that sets HTTP headers for identifying the Paths instance.
   *
   * If identifier is set directly, use that, or fall back to request hostname.
   */
  const { instanceHostname, instanceIdentifier, locale } = opts;
  if (!instanceHostname && !instanceIdentifier) {
    throw new Error('Neither hostname or identifier set for the instance');
  }

  const middleware = new ApolloLink((operation, forward) => {
    const variables: Record<string, unknown> = {
      ...operation.variables,
    };

    const definitions = operation.query.definitions.map((def) => {
      if (def.kind !== Kind.OPERATION_DEFINITION) return def;
      const variableDefinitions: VariableDefinitionNode[] = [...(def.variableDefinitions || [])];
      const directives: DirectiveNode[] = [...(def.directives || [])];
      if (locale) {
        const directive = createOperationDirective({
          name: 'locale',
          args: [
            {
              name: 'lang',
              variable: {
                name: '_locale',
                type: 'String',
              },
            },
          ],
        });
        directives.push(directive.directive);
        variableDefinitions.push(...directive.variableDefinitions);
        variables['_locale'] = locale;
      }
      const instanceArgs: DirectiveArg[] = [];
      if (instanceIdentifier) {
        instanceArgs.push({
          name: 'identifier',
          variable: {
            name: '_identifier',
            type: 'ID',
          },
        });
        variables['_identifier'] = instanceIdentifier;
      }
      if (instanceHostname) {
        instanceArgs.push({
          name: 'hostname',
          variable: {
            name: '_hostname',
            type: 'String',
          },
        });
        variables['_hostname'] = instanceHostname;
      }
      if (instanceArgs.length) {
        const directive = createOperationDirective({
          name: 'instance',
          args: instanceArgs,
        });
        directives.push(directive.directive);
        variableDefinitions.push(...directive.variableDefinitions);
      }
      return {
        ...def,
        directives,
        variableDefinitions,
      };
    });

    operation.query = {
      ...operation.query,
      definitions,
    };
    operation.variables = variables;
    operation.setContext(({ headers = {} }) => {
      return {
        headers: {
          ...headers,
          ...getHttpHeaders(opts),
        },
      };
    });

    return forward(operation);
  });

  return middleware;
};

export type ApolloClientType = ApolloClient<NormalizedCacheObject>;

let apolloClient: ApolloClientType | undefined;

type FetchOptions = RequestInit & {
  //_parentSpan?: Span;
};

async function fetchWithParentSpan(url: string, options: FetchOptions) {
  return await fetch(url, options);
}

function createApolloClient(opts: ApolloClientOpts) {
  const ssrMode = typeof window === 'undefined';
  const uri = ssrMode ? getPathsGraphQLUrl() : GRAPHQL_CLIENT_PROXY_PATH;

  const httpLink = new HttpLink({
    uri,
    credentials: 'include',
    fetchOptions: {
      referrerPolicy: 'unsafe-url',
    },
    fetch: typeof window !== 'undefined' ? fetchWithParentSpan : fetch,
  });

  return new ApolloClient({
    ssrMode,
    uri,
    link: ApolloLink.from([
      logOperationLink,
      createSentryLink(uri),
      localeMiddleware,
      makeInstanceMiddleware(opts),
      httpLink,
    ]),
    cache: new InMemoryCache({
      possibleTypes: possibleTypes.possibleTypes,
      typePolicies: {
        CardListCardBlock: {
          keyFields: false,
        },
      },
    }),
  });
}

export function initializeApollo(
  initialState: NormalizedCacheObject | null,
  opts: ApolloClientOpts
) {
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
