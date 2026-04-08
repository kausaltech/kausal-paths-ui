'use client';

import { ApolloLink, HttpLink } from '@apollo/client';
import {
  ApolloClient,
  ApolloNextAppProvider,
  InMemoryCache,
  SSRMultipartLink,
} from '@apollo/client-integration-nextjs';
import { useApolloClient } from '@apollo/client/react';
import { useLocale } from 'next-intl';

import { createSentryLink, logOperationLink, retryLink } from '@common/apollo/links';
import { GRAPHQL_CLIENT_PROXY_PATH } from '@common/constants/routes.mjs';
import { getPathsGraphQLUrl } from '@common/env';

import possibleTypes from '@/common/__generated__/possible_types.json';
import { type ApolloClientOpts, getHttpHeaders } from '@/common/apollo';

const isServer = typeof window === 'undefined';

function makeClient(config: {
  initialLocale: string;
  instanceIdentifier: string;
  instanceHostname: string;
}) {
  const { initialLocale, instanceIdentifier, instanceHostname } = config;
  const uri = isServer ? getPathsGraphQLUrl() : GRAPHQL_CLIENT_PROXY_PATH;

  const opts: ApolloClientOpts = {
    instanceHostname,
    instanceIdentifier,
    locale: initialLocale,
  };

  const headersMiddleware = new ApolloLink((operation, forward) => {
    operation.setContext(({ headers = {} }) => ({
      headers: {
        ...headers,
        ...getHttpHeaders(opts),
      },
    }));
    return forward(operation);
  });

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

  return new ApolloClient({
    defaultContext: {
      locale: initialLocale,
    },
    cache: new InMemoryCache({
      possibleTypes: possibleTypes.possibleTypes,
      typePolicies: {
        CardListCardBlock: {
          keyFields: false,
        },
      },
    }),
    link: ApolloLink.from([
      retryLink,
      createSentryLink(uri),
      logOperationLink,
      localeMiddleware,
      headersMiddleware,
      ...(isServer ? [new SSRMultipartLink({ stripDefer: true })] : []),
      new HttpLink({
        uri,
        credentials: 'include',
        fetchOptions: {
          referrerPolicy: 'unsafe-url',
        },
      }),
    ]),
  });
}

/**
 * Syncs the Apollo client's locale context on navigation so the @locale
 * directive picks up the current language.
 */
function UpdateLocale({ children }: React.PropsWithChildren) {
  const locale = useLocale();
  const apolloClient = useApolloClient();
  apolloClient.defaultContext.locale = locale;
  return children;
}

type Props = {
  initialLocale: string;
  instanceIdentifier: string;
  instanceHostname: string;
} & React.PropsWithChildren;

export function ApolloWrapper({
  initialLocale,
  instanceIdentifier,
  instanceHostname,
  children,
}: Props) {
  const clientConfig = { initialLocale, instanceIdentifier, instanceHostname };

  return (
    <ApolloNextAppProvider makeClient={() => makeClient(clientConfig)}>
      <UpdateLocale>{children}</UpdateLocale>
    </ApolloNextAppProvider>
  );
}
