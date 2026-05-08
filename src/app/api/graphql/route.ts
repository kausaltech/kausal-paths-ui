import type { NextRequest } from 'next/server';

import proxyGraphQLRequest from '@common/graphql/proxy';

import { getFreshAccessToken } from '@/lib/auth-server';

/**
 * GraphQL proxy — prevents CORS issues and attaches auth headers.
 *
 * Uses `getFreshAccessToken` so that an expired access token is refreshed
 * via the IdP before the backend request goes out. The proxy (src/proxy.ts)
 * does NOT run for /api/* routes, so this is the only pre-backend refresh
 * point for client-side GraphQL queries.
 */
export async function POST(req: NextRequest) {
  const accessToken = await getFreshAccessToken();
  return proxyGraphQLRequest(req, 'paths', {
    accessToken: accessToken ?? undefined,
  });
}
