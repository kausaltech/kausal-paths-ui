import setCookie from 'set-cookie-parser';
import libCookie from 'cookie';
import type { IncomingMessage } from 'http';
import type { NextApiResponse } from 'next';

const API_COOKIE_PREFIX = 'api_';

export function getApiCookies(req: IncomingMessage) {
  const reqCookieHeader = req.headers.cookie;
  if (!reqCookieHeader) {
    return [];
  }
  const backendCookies: string[] = [];
  const cookies = libCookie.parse(reqCookieHeader);
  Object.entries(cookies).forEach(([name, value]) => {
    if (!name.startsWith(API_COOKIE_PREFIX)) return;
    const upstreamName = name.slice(API_COOKIE_PREFIX.length);
    backendCookies.push(`${upstreamName}=${value}`);
  });
  return backendCookies;
}

export function setClientCookies(
  backendResponse: Response,
  res: NextApiResponse
) {
  // Pass cookies to the client, modify some of the attributes along the way
  const cookies = setCookie.parse(backendResponse.headers.getSetCookie());
  cookies.forEach((cookie) => {
    res.appendHeader(
      'Set-Cookie',
      libCookie.serialize(`${API_COOKIE_PREFIX}${cookie.name}`, cookie.value, {
        expires: cookie.expires,
        maxAge: cookie.maxAge,
        httpOnly: cookie.httpOnly,
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
      })
    );
  });
}
