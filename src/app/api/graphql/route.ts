import type { NextRequest } from 'next/server';

import proxyGraphQLRequest from '@common/graphql/proxy';

import { getAccessToken } from '@/lib/auth-server';

/**
 * GraphQL proxy — prevents CORS issues and attaches auth headers.
 */
export async function POST(req: NextRequest) {
  const accessToken = await getAccessToken();
  return proxyGraphQLRequest(req, 'paths', {
    accessToken: accessToken ?? undefined,
  });
}
