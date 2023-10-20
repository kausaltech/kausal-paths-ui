import {
  ApolloLink,
  HttpLink,
  type ApolloClient,
  type NormalizedCacheObject,
} from '@apollo/client';

import { DirectiveNode, Kind } from 'graphql';

const localeMiddleware = new ApolloLink((operation, forward) => {
  /*
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
  */
  return forward(operation);
});

export type ApolloClientOpts = {
  apiUri: string;
  instanceHostname: string;
  instanceIdentifier: string;
  authorizationToken?: string | undefined;
  forwardedFor?: string | string[] | null;
  remoteAddress?: string | null;
  currentURL?: {
    baseURL: string;
    path: string;
  };
};

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

const makeInstanceMiddleware = (opts: ApolloClientOpts) => {
  /**
   * Middleware that sets HTTP headers for identifying the Paths instance.
   *
   * If identifier is set directly, use that, or fall back to request hostname.
   */
  const {
    instanceHostname,
    instanceIdentifier,
    authorizationToken,
    currentURL,
    forwardedFor,
    remoteAddress,
  } = opts;
  if (!instanceHostname && !instanceIdentifier) {
    throw new Error('Neither hostname or identifier set for the instance');
  }

  const middleware = new ApolloLink((operation, forward) => {
    operation.query = {
      ...operation.query,
      definitions: operation.query.definitions.map((def) => {
        if (def.kind !== Kind.OPERATION_DEFINITION) return def;
        const directives: DirectiveNode[] = [...(def.directives || [])];
        /*
        if (i18n && i18n.language) {
          directives.push(
            createDirective('locale', [{ name: 'lang', val: i18n.language }])
          );
        }
        */
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
      if (instanceIdentifier) {
        headers['x-paths-instance-identifier'] = instanceIdentifier;
      } else if (instanceHostname) {
        headers['x-paths-instance-hostname'] = instanceHostname;
      }
      if (authorizationToken) {
        headers['authorization'] = `Bearer ${authorizationToken}`;
      }
      if (currentURL) {
        const { baseURL, path } = currentURL;
        headers['referer'] = baseURL + path;
        const ff = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
        const addr = ff || remoteAddress;
        if (addr) {
          headers['x-forwarded-for'] = remoteAddress;
        }
      }
      console.log(headers);
      return {
        headers,
      };
    });

    return forward(operation);
  });

  return middleware;
};

export type ApolloClientType = ApolloClient<NormalizedCacheObject>;

export function createApolloLink(opts: ApolloClientOpts) {
  const uri = opts.apiUri;
  console.log('uri is', uri);
  const httpLink = new HttpLink({
    uri,
    credentials: 'include',
  });

  return ApolloLink.from([
    //localeMiddleware,
    makeInstanceMiddleware(opts),
    httpLink,
  ]);
}

/*
function createApolloClient(opts: ApolloClientOpts) {
  const ssrMode = typeof window === 'undefined';

  return new ApolloClient({
    ssrMode,
    link: createApolloLink(opts),
    cache: new InMemoryCache({
      possibleTypes: possibleTypes.possibleTypes,
    }),
  });
}
*/
