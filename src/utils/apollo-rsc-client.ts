import { headers as getHeaders } from 'next/headers';

import { ApolloClient, ApolloLink, HttpLink, InMemoryCache } from '@apollo/client';
import { registerApolloClient } from '@apollo/client-integration-nextjs';

import { createSentryLink, logOperationLink, retryLink } from '@common/apollo/links';
import { getPathsGraphQLUrl } from '@common/env';
import { getLogger } from '@common/logging/logger';

import possibleTypes from '@/common/__generated__/possible_types.json';
import { getHttpHeaders, type ApolloClientOpts } from '@/common/apollo';
import {
  DEFAULT_LANGUAGE_HEADER,
  INSTANCE_HOSTNAME_HEADER,
  INSTANCE_IDENTIFIER_HEADER,
} from '@/common/const';

const rscLogger = getLogger({ name: 'apollo-rsc' });

/**
 * Apollo client for React Server Components. Reads instance context from
 * headers set by the proxy. For client components, use ApolloWrapper instead.
 */
export const { getClient } = registerApolloClient(async () => {
  const headers = await getHeaders();
  const instanceIdentifier = headers.get(INSTANCE_IDENTIFIER_HEADER) ?? undefined;
  const instanceHostname = headers.get(INSTANCE_HOSTNAME_HEADER) ?? undefined;
  const locale = headers.get('x-next-intl-locale') ?? headers.get(DEFAULT_LANGUAGE_HEADER) ?? undefined;

  const uri = getPathsGraphQLUrl();

  const opts: ApolloClientOpts = {
    instanceHostname,
    instanceIdentifier,
    locale,
  };

  const headersMiddleware = new ApolloLink((operation, forward) => {
    operation.setContext(({ headers: existingHeaders = {} }) => ({
      headers: {
        ...existingHeaders,
        ...getHttpHeaders(opts),
      },
    }));
    return forward(operation);
  });

  return new ApolloClient({
    defaultContext: {
      locale,
      logger: rscLogger,
    },
    devtools: { enabled: false },
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
      headersMiddleware,
      new HttpLink({
        uri,
        credentials: 'include',
        fetchOptions: {
          referrerPolicy: 'unsafe-url',
        },
      }),
    ]),
  });
});
