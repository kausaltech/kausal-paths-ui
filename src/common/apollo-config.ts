import { ApolloLink, HttpLink, type InMemoryCacheConfig } from '@apollo/client';
import { CombinedGraphQLErrors } from '@apollo/client/errors';
import { ErrorLink } from '@apollo/client/link/error';
import { type DirectiveNode, Kind, type VariableDefinitionNode } from 'graphql';
import type { Logger } from 'pino';

import type { DefaultApolloContext } from '@common/apollo';
import { type DirectiveArg, createOperationDirective } from '@common/apollo/directives';
import { createSentryLink, logOperationLink, retryLink } from '@common/apollo/links';
import { FORWARDED_HEADER } from '@common/constants/headers.mjs';
import { GRAPHQL_CLIENT_PROXY_PATH } from '@common/constants/routes.mjs';
import { getPathsGraphQLUrl, getRuntimeConfig } from '@common/env';
import type { CurrentURL } from '@common/utils';

import possibleTypes from '@/common/__generated__/possible_types.json';
import { recoverFromInvalidToken } from '@/lib/invalid-token-recovery';
import {
  INSTANCE_HOSTNAME_HEADER,
  INSTANCE_IDENTIFIER_HEADER,
  WILDCARD_DOMAINS_HEADER,
} from './const';

declare module '@apollo/client/core' {
  export interface DefaultContext extends Partial<DefaultApolloContext> {
    instanceHostname?: string;
    locale?: string;
    /**
     * Opt the operation into the backend's fault-tolerant mode: node failures
     * are quarantined and reported via `editor.status`/`editor.errors` instead
     * of aborting the whole computation. Set per-operation by the model editor
     * (see `useEditorApolloContext`); attaches `tolerateNodeFailures` to the
     * injected `@instance` directive.
     */
    tolerateNodeFailures?: boolean;
  }
}

const localeMiddleware = new ApolloLink((operation, forward) => {
  operation.setContext(({ headers = {}, locale }: ApolloLink.OperationContext) => {
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

export type PreviewMode = 'DRAFT' | 'PUBLISHED';

export type ApolloClientOpts = {
  instanceHostname?: string;
  instanceIdentifier?: string;
  wildcardDomains?: string[];
  authorizationToken?: string | undefined;
  clientIp?: string | null;
  locale?: string;
  currentURL?: CurrentURL;
  clientCookies?: string;
  logger?: Logger;
  /**
   * Called per operation to decide whether to attach `preview` to the
   * `@instance` directive. Returning a mode forces the backend's Phase-4
   * resolver split onto that slice; returning null leaves the default
   * (published-first) behavior. Invoked lazily so client-side nav is
   * picked up without recreating the Apollo client.
   */
  previewMode?: () => PreviewMode | null;
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
  const headers: Record<string, string> = {};

  if (instanceIdentifier) {
    headers[INSTANCE_IDENTIFIER_HEADER] = instanceIdentifier;
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
  if (typeof window === 'undefined') {
    if (clientIp) {
      headers[FORWARDED_HEADER] = `for="${clientIp}"`;
    }
    if (clientCookies) {
      headers['cookie'] = clientCookies;
    }
  }
  return headers;
}

function directiveExists(directives: DirectiveNode[], name: string) {
  return directives.some((d) => d.name.value === name);
}

const makeInstanceMiddleware = (opts: ApolloClientOpts) => {
  /**
   * Middleware that sets HTTP headers for identifying the Paths instance.
   *
   * If identifier is set directly, use that, or fall back to request hostname.
   */
  const { instanceHostname, instanceIdentifier, locale, previewMode } = opts;
  if (!instanceHostname && !instanceIdentifier) {
    throw new Error('Neither hostname or identifier set for the instance');
  }

  const middleware = new ApolloLink((operation, forward) => {
    const variables: Record<string, unknown> = {
      ...operation.variables,
    };
    // A per-operation `context.locale` (e.g. set by the model editor to force
    // default-language content) wins over the client-default locale.
    const opContext = operation.getContext();
    const effectiveLocale = opContext.locale ?? locale;
    const tolerateNodeFailures = opContext.tolerateNodeFailures === true;

    const definitions = operation.query.definitions.map((def) => {
      if (def.kind !== Kind.OPERATION_DEFINITION) return def;
      const variableDefinitions: VariableDefinitionNode[] = [...(def.variableDefinitions ?? [])];
      const directives: DirectiveNode[] = [...(def.directives ?? [])];

      if (directiveExists(directives, 'context')) {
        return def;
      }

      if (effectiveLocale && !directiveExists(directives, 'locale')) {
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
        variables['_locale'] = effectiveLocale;
      }
      const instanceArgs: DirectiveArg[] = [];
      if (instanceIdentifier && !directiveExists(directives, 'identifier')) {
        instanceArgs.push({
          name: 'identifier',
          variable: {
            name: '_identifier',
            type: 'ID',
          },
        });
        variables['_identifier'] = instanceIdentifier;
      }
      if (instanceHostname && !directiveExists(directives, 'hostname')) {
        instanceArgs.push({
          name: 'hostname',
          variable: {
            name: '_hostname',
            type: 'String',
          },
        });
        variables['_hostname'] = instanceHostname;
      }
      const preview = previewMode?.();
      if (preview) {
        instanceArgs.push({
          name: 'preview',
          variable: {
            name: '_preview',
            type: 'PreviewMode',
          },
        });
        variables['_preview'] = preview;
      }
      if (tolerateNodeFailures) {
        instanceArgs.push({
          name: 'tolerateNodeFailures',
          variable: {
            name: '_tolerateNodeFailures',
            type: 'Boolean',
          },
        });
        variables['_tolerateNodeFailures'] = true;
      }
      if (instanceArgs.length && !directiveExists(directives, 'instance')) {
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

const headersMiddleware = (opts: ApolloClientOpts) =>
  new ApolloLink((operation, forward) => {
    operation.setContext(({ headers = {} }) => ({
      headers: {
        ...headers,
        ...getHttpHeaders(opts),
      },
    }));
    return forward(operation);
  });

async function apolloFetch(url: RequestInfo | URL, init?: RequestInit) {
  // TODO: Sign the request headers here
  return await fetch(url, init);
}

// Catches client-side GraphQL invalid_token errors and delegates to the
// shared recovery (sign-out + reload). RSC/SSR failures don't reach here
// — they surface as render errors and are handled by the Next.js error
// boundaries, which call into the same recovery helper.
const authErrorLink = new ErrorLink(({ error }) => {
  if (!CombinedGraphQLErrors.is(error)) return;
  const isInvalidToken = error.errors.some(
    (e) => e.extensions?.code === 'invalid_token' || e.message.startsWith('invalid_token')
  );
  if (!isInvalidToken) return;
  recoverFromInvalidToken();
});

export function getApolloClientConfig(opts: ApolloClientOpts): {
  link: ApolloLink;
  cache: InMemoryCacheConfig;
} {
  const ssrMode = typeof window === 'undefined';
  const uri = ssrMode ? getPathsGraphQLUrl() : GRAPHQL_CLIENT_PROXY_PATH;

  const httpLink = new HttpLink({
    uri,
    credentials: 'include',
    fetchOptions: {
      referrerPolicy: 'unsafe-url',
    },
    fetch: apolloFetch,
  });

  return {
    link: ApolloLink.from([
      retryLink,
      authErrorLink,
      createSentryLink(uri),
      logOperationLink,
      localeMiddleware,
      headersMiddleware(opts),
      makeInstanceMiddleware(opts),
      httpLink,
    ]),
    cache: {
      possibleTypes: possibleTypes.possibleTypes,
      typePolicies: {
        CardListCardBlock: {
          keyFields: false,
        },
      },
    },
  };
}
