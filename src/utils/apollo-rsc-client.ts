import { headers as getHeaders } from 'next/headers';
import { redirect } from 'next/navigation';

import { ApolloClient, InMemoryCache } from '@apollo/client';
import { registerApolloClient } from '@apollo/client-integration-nextjs';

import { getLogger } from '@common/logging/logger';

import { type ApolloClientOpts, getApolloClientConfig } from '@/common/apollo-config';
import {
  CURRENT_LANGUAGE_HEADER,
  DEFAULT_LANGUAGE_HEADER,
  INSTANCE_HOSTNAME_HEADER,
  INSTANCE_IDENTIFIER_HEADER,
} from '@/common/const';
import { getAccessToken } from '@/lib/auth-server';

const rscLogger = getLogger({ name: 'apollo-rsc' });

/**
 * Apollo client for React Server Components. Reads instance context from
 * headers set by the proxy. For client components, use ApolloWrapper instead.
 */
export const { getClient } = registerApolloClient(async () => {
  const headers = await getHeaders();
  const instanceIdentifier = headers.get(INSTANCE_IDENTIFIER_HEADER) ?? undefined;
  const instanceHostname = headers.get(INSTANCE_HOSTNAME_HEADER) ?? undefined;
  // Use the locale resolved by the proxy (which has already stripped the
  // URL prefix and matched against the instance's supported languages).
  // Defaults to the instance's default language only as a defensive
  // fallback — every page that actually rendered should have a
  // resolved current-language header.
  const locale =
    headers.get(CURRENT_LANGUAGE_HEADER) ?? headers.get(DEFAULT_LANGUAGE_HEADER) ?? undefined;

  const accessToken = await getAccessToken();
  const originalUrl = headers.get('x-url');

  const opts: ApolloClientOpts = {
    instanceHostname,
    instanceIdentifier,
    locale,
    authorizationToken: accessToken ?? undefined,
    onInvalidToken: () => {
      let returnTo = '/';
      if (originalUrl) {
        const url = new URL(originalUrl);
        returnTo = `${url.pathname}${url.search}`;
      }
      redirect(`/api/auth/recover-invalid-token?returnTo=${encodeURIComponent(returnTo)}`);
    },
  };

  const { link, cache } = getApolloClientConfig(opts);

  return new ApolloClient({
    defaultContext: {
      locale,
      logger: rscLogger,
    },
    devtools: { enabled: false },
    cache: new InMemoryCache(cache),
    link,
  });
});
