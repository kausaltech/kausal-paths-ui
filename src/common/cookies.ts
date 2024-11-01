import * as cookie from 'cookie';
import type { IncomingMessage } from 'http';
import type { NextApiResponse } from 'next';
import setCookie from 'set-cookie-parser';

const API_COOKIE_PREFIX = 'api_';

export function getApiCookies(req: IncomingMessage) {
  const reqCookieHeader = req.headers.cookie;
  if (!reqCookieHeader) {
    return [];
  }
  const backendCookies: string[] = [];
  const cookies = cookie.parse(reqCookieHeader);
  Object.entries(cookies).forEach(([name, value]) => {
    if (!name.startsWith(API_COOKIE_PREFIX)) return;
    const upstreamName = name.slice(API_COOKIE_PREFIX.length);
    backendCookies.push(`${upstreamName}=${value}`);
  });
  return backendCookies;
}

export function setClientCookies(backendResponse: Response, res: NextApiResponse) {
  // Pass cookies to the client, modify some of the attributes along the way
  const cookies = setCookie.parse(backendResponse.headers.getSetCookie());
  cookies.forEach((ck) => {
    res.appendHeader(
      'Set-Cookie',
      cookie.serialize(`${API_COOKIE_PREFIX}${ck.name}`, ck.value, {
        expires: ck.expires,
        maxAge: ck.maxAge,
        httpOnly: ck.httpOnly,
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
      })
    );
  });
}
