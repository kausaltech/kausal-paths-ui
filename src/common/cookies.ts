import * as cookie from 'cookie';
import type { IncomingMessage } from 'http';
import type { NextApiResponse } from 'next';
import setCookie from 'set-cookie-parser';

import { getProductId } from '@common/env/static';

const API_COOKIE_PREFIX = 'api_';

type APIType = 'watch' | 'paths';

function getCookiePrefix(apiType?: APIType) {
  if (!apiType) apiType = getProductId() satisfies APIType;
  return `${apiType}_${API_COOKIE_PREFIX}`;
}

export function getApiCookies(req: IncomingMessage, apiType?: APIType) {
  const reqCookieHeader = req.headers.cookie;
  if (!reqCookieHeader) {
    return [];
  }
  const backendCookies: string[] = [];
  const cookies = cookie.parse(reqCookieHeader);
  const prefix = getCookiePrefix(apiType);
  Object.entries(cookies).forEach(([name, value]) => {
    if (!name.startsWith(prefix)) return;
    const upstreamName = name.slice(prefix.length);
    backendCookies.push(`${upstreamName}=${value}`);
  });
  return backendCookies;
}

export function setClientCookies(
  backendResponse: Response,
  res: NextApiResponse,
  apiType?: APIType
) {
  // Pass cookies to the client, modify some of the attributes along the way
  const cookies = setCookie.parse(backendResponse.headers.getSetCookie());
  const prefix = getCookiePrefix(apiType);
  cookies.forEach((ck) => {
    res.appendHeader(
      'Set-Cookie',
      cookie.serialize(`${prefix}${ck.name}`, ck.value, {
        expires: ck.expires,
        maxAge: ck.maxAge,
        httpOnly: ck.httpOnly,
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
      })
    );
  });
}
