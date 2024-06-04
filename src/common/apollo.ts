import {
  ApolloClient,
  ApolloLink,
  HttpLink,
  InMemoryCache,
  type NormalizedCacheObject,
} from '@apollo/client';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';
import { type DirectiveNode, Kind } from 'graphql';

import possibleTypes from '@/common/__generated__/possible_types.json';
import {
  GQL_PROXY_PATH,
  INSTANCE_HOSTNAME_HEADER,
  INSTANCE_IDENTIFIER_HEADER,
  WILDCARD_DOMAINS_HEADER,
} from './const';
import { getRuntimeConfig, gqlUrl } from './environment';
import { getLogger } from './log';

const logger = getLogger('graphql');

if (globalThis.__DEV__) {
  // Adds messages only in a dev environment
  loadDevMessages();
  loadErrorMessages();
}

export const logQueryStart = new ApolloLink((operation, forward) => {
  const log = operation.getContext()?.logger || logger;
  operation.setContext({ start: Date.now() });
  log.info({ operation: operation.operationName }, 'Starting GraphQL operation');
  return forward(operation);
});

export const logQueryEnd = new ApolloLink((operation, forward) => {
  const log = operation.getContext()?.logger || logger;
  return forward(operation).map((data) => {
    const start = operation.getContext().start;
    if (!start) {
      return data;
    }
    const time = Math.round(Date.now() - start);
    log.info(
      { operation: operation.operationName, duration: time / 1000 },
      `GraphQL operation took ${time}ms`
    );
    return data;
  });
});

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

function createDirective(name: string, args: { name: string; val: string }[]) {
  const out: DirectiveNode = {
    kind: Kind.DIRECTIVE,
    name: {
      kind: Kind.NAME,
      value: name,
    },
    arguments: args.map((arg) => ({
      kind: Kind.ARGUMENT,
      name: { kind: Kind.NAME, value: arg.name },
      value: {
        kind: Kind.STRING,
        value: arg.val,
        block: false,
      },
    })),
  };
  return out;
}

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
  const { instanceHostname, instanceIdentifier } = opts;
  if (!instanceHostname && !instanceIdentifier) {
    throw new Error('Neither hostname or identifier set for the instance');
  }

  const middleware = new ApolloLink((operation, forward) => {
    const context = operation.getContext();
    const locale = context?.locale;
    operation.query = {
      ...operation.query,
      definitions: operation.query.definitions.map((def) => {
        if (def.kind !== Kind.OPERATION_DEFINITION) return def;
        const directives: DirectiveNode[] = [...(def.directives || [])];
        if (locale) {
          directives.push(createDirective('locale', [{ name: 'lang', val: locale }]));
        }
        const instanceArgs: { name: string; val: string }[] = [];
        if (instanceIdentifier) {
          instanceArgs.push({ name: 'identifier', val: instanceIdentifier });
        }
        if (instanceHostname) {
          instanceArgs.push({ name: 'hostname', val: instanceHostname });
        }
        if (instanceArgs.length) {
          directives.push(createDirective('instance', instanceArgs));
        }
        return {
          ...def,
          directives,
        };
      }),
    };

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

function createApolloClient(opts: ApolloClientOpts) {
  const ssrMode = typeof window === 'undefined';
  const uri = ssrMode ? gqlUrl : GQL_PROXY_PATH;

  const httpLink = new HttpLink({
    uri,
    credentials: 'include',
    fetchOptions: {
      referrerPolicy: 'unsafe-url',
    },
  });

  return new ApolloClient({
    ssrMode,
    uri,
    link: ApolloLink.from([
      logQueryStart,
      localeMiddleware,
      makeInstanceMiddleware(opts),
      logQueryEnd,
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
