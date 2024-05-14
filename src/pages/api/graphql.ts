import { captureException } from '@sentry/nextjs';
import { getApiCookies, setClientCookies } from 'common/cookies';

import type { NextApiRequest, NextApiResponse } from 'next/types';
import { gqlUrl } from 'utils/environment';

const PASS_HEADERS = [
  'x-paths-instance-identifier',
  'x-paths-instance-hostname',
  'x-wildcard-domains',
  'user-agent',
  'authorization',
  'accept-language',
  'dnt',
  'referer',
];

/**
 * Simple proxy which handles our GraphQL requests
 * to prevent CORS issues and attach auth headers.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const headers = req.headers;
  const requestData = req.body;

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'HTTP method not allowed' });
    return;
  }
  if (headers['content-type'] !== 'application/json') {
    res.status(415).json({ error: 'Invalid Content-Type header' });
  }

  // Determine headers to send to the backend
  const backendHeaders = {};
  for (const h of PASS_HEADERS) {
    const val = headers[h];
    if (!val) continue;
    backendHeaders[h] = headers[h];
  }
  backendHeaders['Content-Type'] = 'application/json';
  const backendCookies = getApiCookies(req);
  if (backendCookies.length) {
    backendHeaders['Cookie'] = backendCookies.join('; ');
  }
  if (req.socket.remoteAddress)
    backendHeaders['X-Forwarded-For'] = req.socket.remoteAddress;

  // Do the fetch from the backend
  const backendResponse = await fetch(gqlUrl, {
    method: 'POST',
    headers: backendHeaders,
    body: JSON.stringify(requestData),
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
    console.error('Backend responded with ', backendResponse.status);
    let data: object | undefined, errorMessage: string | undefined;
    try {
      if (backendResponse.headers['content-type'] === 'application/json') {
        data = await backendResponse.json();
      }
    } catch (error) {
      captureException(error);
    }
    if (!data) {
      errorMessage = await backendResponse.text();
      data = { errors: [{ message: errorMessage }] };
    }
    if (process.env.NODE_ENV !== 'production') {
      console.log(data);
    }
    return res.json(data);
  }

  try {
    const data = await backendResponse.json();
    res.json(data);
  } catch (error) {
    // An error occurred parsing the error response as JSON

    return Response.json(
      { errors: [{ message: `Response is invalid JSON: ${error?.message}` }] },
      { status: 500, headers: responseHeaders }
    );
  }
}
