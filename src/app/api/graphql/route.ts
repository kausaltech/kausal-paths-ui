import type { NextRequest } from 'next/server';

import proxyGraphQLRequest from '@common/graphql/proxy';

/**
 * GraphQL proxy — prevents CORS issues and attaches auth headers.
 */
export async function POST(req: NextRequest) {
  return proxyGraphQLRequest(req, 'paths');
}
