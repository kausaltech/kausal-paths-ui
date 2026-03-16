import type { NextApiRequest, NextApiResponse } from 'next/types';

import proxyGraphQLRequest from '@common/graphql/proxy';

/**
 * Simple proxy which handles our GraphQL requests
 * to prevent CORS issues and attach auth headers.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await proxyGraphQLRequest(req, 'paths', res);
}
