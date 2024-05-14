// Copied from: https://github.com/vardhanapoorv/epl-nextjs-app/blob/main/lib/apolloClient.js
import { i18n } from 'next-i18next';
import getConfig from 'next/config';
import {
  ApolloClient,
  ApolloLink,
  HttpLink,
  InMemoryCache,
  NormalizedCacheObject,
} from '@apollo/client';
import possibleTypes from 'common/__generated__/possible_types.json';
import { DirectiveNode, Kind } from 'graphql';

const { serverRuntimeConfig, publicRuntimeConfig } = getConfig();

const localeMiddleware = new ApolloLink((operation, forward) => {
  operation.setContext(({ headers = {}, locale }) => {
    if (locale || (i18n && i18n.language)) {
      return {
        headers: {
          ...headers,
          'accept-language': locale || i18n!.language,
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
  instanceHostname: string;
  instanceIdentifier: string;
  wildcardDomains?: string[];
  authorizationToken?: string | undefined;
  clientIp?: string | null;
  currentURL?: {
    baseURL: string;
    path: string;
  };
  clientCookies?: string;
};

function getHttpHeaders(opts: ApolloClientOpts) {
  const {
    instanceHostname,
    instanceIdentifier,
    wildcardDomains,
    authorizationToken,
    currentURL,
    clientIp,
    clientCookies,
  } = opts;
  const headers = {};

  if (instanceIdentifier) {
    headers['x-paths-instance-identifier'] = opts.instanceIdentifier;
  }
  if (instanceHostname) {
    headers['x-paths-instance-hostname'] = instanceHostname;
  }
  if (wildcardDomains) {
    headers['x-wildcard-domains'] = wildcardDomains;
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
    operation.query = {
      ...operation.query,
      definitions: operation.query.definitions.map((def) => {
        if (def.kind !== Kind.OPERATION_DEFINITION) return def;
        const directives: DirectiveNode[] = [...(def.directives || [])];
        if (i18n && i18n.language) {
          directives.push(
            createDirective('locale', [{ name: 'lang', val: i18n.language }])
          );
        }
        directives.push(
          createDirective('instance', [
            { name: 'identifier', val: instanceIdentifier },
            { name: 'hostname', val: instanceHostname },
          ])
        );
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
  const uri = ssrMode
    ? serverRuntimeConfig.graphqlUrl
    : publicRuntimeConfig.graphqlUrl;

  const httpLink = new HttpLink({
    uri,
    credentials: 'include',
    fetchOptions: {
      referrerPolicy: 'unsafe-url',
    },
  });

  return new ApolloClient({
    ssrMode,
    link: ApolloLink.from([
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
