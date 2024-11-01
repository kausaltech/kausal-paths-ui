import type { NextApiRequest, NextApiResponse } from 'next/types';

import type { FetchResult } from '@apollo/client';
import type { Body } from '@apollo/client/link/http/selectHttpOptionsAndBody';
import { propagation } from '@opentelemetry/api';
import { captureException, startSpan } from '@sentry/nextjs';

import {
  PATHS_INSTANCE_HOSTNAME_HEADER,
  PATHS_INSTANCE_IDENTIFIER_HEADER,
  WILDCARD_DOMAINS_HEADER,
} from '@common/constants/headers.mjs';
import { getPathsGraphQLUrl, isLocal } from '@common/env';
import { envToBool } from '@common/env/utils';
import { getLoggerAsync } from '@common/logging/logger';

import { getApiCookies, setClientCookies } from '@/common/cookies';

const PASS_HEADERS = [
  PATHS_INSTANCE_IDENTIFIER_HEADER,
  PATHS_INSTANCE_HOSTNAME_HEADER,
  WILDCARD_DOMAINS_HEADER,
  'authorization',
  'accept-language',
  'dnt',
  'referer',
];

/**
 * Simple proxy which handles our GraphQL requests
 * to prevent CORS issues and attach auth headers.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const headers = req.headers;
  const requestData = req.body as Body;
  const logger = await getLoggerAsync({
    name: 'graphql-proxy',
    request: req,
  });

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'HTTP method not allowed' });
    return;
  }
  if (headers['content-type'] !== 'application/json') {
    res.status(415).json({ error: 'Invalid Content-Type header' });
  }

  const operationName = requestData.operationName || 'unknown';

  logger.info(`Proxying GraphQL request ${operationName}`);

  // Determine headers to send to the backend.
  // Trace propagation headers are passed through automatically.
  const backendHeaders = {};
  for (const h of PASS_HEADERS) {
    const val = headers[h];
    if (!val) continue;
    backendHeaders[h] = headers[h];
  }
  for (const field of propagation.fields()) {
    let val = headers[field];
    if (Array.isArray(val)) {
      logger.warn(`Propagation field ${field} is array`, { field, val });
      continue;
    }
    if (!val) continue;
    // Remove leading and trailing commas
    val = val.replace(/^,+/, '').replace(/,+$/, '');
    if (!val) continue;
    backendHeaders[field] = val;
  }

  if (headers['user-agent']) {
    backendHeaders['X-Original-User-Agent'] = headers['user-agent'];
  }

  backendHeaders['Content-Type'] = 'application/json';
  const backendCookies = getApiCookies(req);
  if (backendCookies.length) {
    backendHeaders['Cookie'] = backendCookies.join('; ');
  }
  if (req.socket.remoteAddress) backendHeaders['X-Forwarded-For'] = req.socket.remoteAddress;

  if (isLocal) {
    logger.info(req.headers, 'Headers from client');
    logger.info(backendHeaders, 'Headers to backend');
  }

  // Do the fetch from the backend
  const backendResponse = await startSpan({ op: 'graphql.request', name: operationName }, () => {
    return fetch(getPathsGraphQLUrl(), {
      method: 'POST',
      headers: backendHeaders,
      body: JSON.stringify(requestData),
    });
  });

  // Set response headers
  const responseHeaders: { [name: string]: string } = {};
  const langHeader = backendResponse.headers.get('Content-Language');
  if (langHeader) responseHeaders['Content-Language'] = langHeader;

  Object.entries(responseHeaders).forEach(([hdr, val]) => {
    res.appendHeader(hdr, val);
  });

  setClientCookies(backendResponse, res);

  res.statusMessage = backendResponse.statusText;
  res.statusCode = backendResponse.status;

  // We don't want caching
  res.appendHeader('Cache-Control', 'no-store');

  if (!backendResponse.ok) {
    logger.error('Backend responded with ', backendResponse.status);
    let data: object | undefined, errorMessage: string | undefined;
    try {
      if (backendResponse.headers['content-type'] === 'application/json') {
        data = (await backendResponse.json()) as object;
      }
    } catch (error) {
      captureException(error);
    }
    if (!data) {
      errorMessage = await backendResponse.text();
      data = { errors: [{ message: errorMessage }] };
    }
    return res.json(data);
  }

  try {
    const data = (await backendResponse.json()) as FetchResult;
    res.json(data);
  } catch (error) {
    // An error occurred parsing the error response as JSON
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.statusCode = 500;
    return res.json({ errors: [{ message: `Response is invalid JSON: ${message}` }] });
  }
}
