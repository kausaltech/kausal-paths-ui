import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import * as Sentry from '@sentry/nextjs';
import { getSessionCookie } from 'better-auth/cookies';
import createIntlMiddleware from 'next-intl/middleware';
import type { Bindings } from 'pino';

import {
  MIDDLEWARE_RAN_HEADER,
  REQUEST_CORRELATION_ID_HEADER,
} from '@common/constants/headers.mjs';
import { HEALTH_CHECK_PUBLIC_PATH } from '@common/constants/routes.mjs';
import { getDeploymentType, getSpotlightUrl, getWildcardDomains, isLocalDev } from '@common/env';
import { envToBool } from '@common/env/utils';
import { getTraceLogBindings } from '@common/logging/init';
import { LOGGER_CORRELATION_ID, generateCorrelationID, getLogger } from '@common/logging/logger';

import { ensureSlash, splitPath } from '@/utils/paths';
import type { AvailableInstanceFragment } from './common/__generated__/graphql';
import {
  BASE_PATH_HEADER,
  CURRENT_LANGUAGE_HEADER,
  DEFAULT_LANGUAGE_HEADER,
  INSTANCE_HOSTNAME_HEADER,
  INSTANCE_IDENTIFIER_HEADER,
  SUPPORTED_LANGUAGES_HEADER,
  THEME_IDENTIFIER_HEADER,
} from './common/const';
import { auth } from './lib/auth';
import { KAUSAL_PROVIDER_ID } from './lib/auth-const';
import { getInstancesForRequest } from './middleware/context';

type Instance = AvailableInstanceFragment;

function determineMatchingInstance(instances: Instance[], path: string) {
  const parts = splitPath(path);
  // First try to find matches based on a non-empty basePath
  let match = instances.find((instance) => {
    const basePathParts = splitPath(instance.hostname.basePath);
    if (!basePathParts.length) return false;
    return basePathParts[0] === parts[0];
  });
  if (!match) {
    match = instances.find((instance) => (instance.hostname.basePath || '/') === '/');
    if (!match)
      return {
        basePath: '',
        instance: null,
        path,
        parts,
      };
  }
  let basePath = ensureSlash(match.hostname.basePath);
  if (basePath === '/') {
    // Return empty string as basePath if there isn't a path prefix
    basePath = basePath.slice(1);
  } else {
    // Chomp the basepath part from the path
    parts.shift();
    path = ['', ...parts].join('/');
  }
  return { basePath, instance: match, path, parts };
}

/**
 * Determine the locale from the URL path.
 * In App Router mode, we don't rely on Next.js built-in locale detection.
 * Instead, we check the first path segment against the instance's supported languages.
 */
function determineLocale(instance: Instance, path: string) {
  const otherLanguages = instance.supportedLanguages.filter(
    (lang) => lang !== instance.defaultLanguage
  );
  const parts = splitPath(path);
  const locale = otherLanguages.find((lang) => lang.toLowerCase() === parts[0]?.toLowerCase());
  if (locale) {
    // Remove the locale segment — next-intl middleware will handle it
    parts.shift();
    return { locale, path: ['', ...parts].join('/') };
  }
  return { locale: instance.defaultLanguage, path };
}

function setInstanceHeaders(
  requestHeaders: Headers,
  instances: Instance[],
  match: Instance | null
) {
  if (match) {
    requestHeaders.set(INSTANCE_IDENTIFIER_HEADER, match.identifier);
  } else {
    if (!instances.length) return;
    match = instances[0]!;
  }
  requestHeaders.set(DEFAULT_LANGUAGE_HEADER, match.defaultLanguage);
  requestHeaders.set(SUPPORTED_LANGUAGES_HEADER, match.supportedLanguages.join(','));
  requestHeaders.set(THEME_IDENTIFIER_HEADER, match.themeIdentifier);
}

function _protectedResponse(req: NextRequest, headers: Headers, hostname: string, locale: string) {
  const rewrittenUrl = new URL(`/root/${hostname}/${locale}/protected`, req.url);
  return NextResponse.rewrite(rewrittenUrl, { request: { headers } });
}

function errorResponse(req: NextRequest, headers: Headers, kind: 'not-found' | 'server-error') {
  const reqInit: { request: { headers: Headers }; status?: number } = {
    request: { headers },
  };
  if (kind === 'not-found') {
    reqInit.status = 404;
  } else {
    reqInit.status = 500;
  }
  // Return a simple response since we don't have proper error pages yet in the rewrite target
  return new Response(kind === 'not-found' ? 'Not found' : 'Internal server error', reqInit);
}

const NON_PAGE_PATHS = ['api', 'static', '_next', 'favicon.ico'];

function isHotReloadPath(parts: string[]) {
  return isLocalDev && parts.join('/').startsWith('_next/static/webpack');
}

function shouldAddInstanceHeaders(parts: string[]) {
  if (isHotReloadPath(parts)) {
    return true;
  }
  if (NON_PAGE_PATHS.includes(parts[0])) {
    return false;
  }
  return true;
}

function handleNonPagePaths(path: string) {
  const pathParts = splitPath(path);

  if (path === HEALTH_CHECK_PUBLIC_PATH) {
    return NextResponse.json({ status: 'OK' });
  }
  if (path === '/_ping') {
    return NextResponse.json({ status: 'pong' });
  }
  if (path.startsWith('/__nextjs') || NON_PAGE_PATHS.includes(pathParts[0])) {
    return NextResponse.next();
  }
  if (NON_PAGE_PATHS.includes(path)) {
    return NextResponse.next();
  }
  if (isLocalDev && path === '/.well-known/appspecific/com.chrome.devtools.json') {
    return NextResponse.json({
      root: process.env.PWD,
      uuid: '7f3824db-0718-4ca7-a2a2-de666f274826',
    });
  }
  return null;
}

/**
 * Proactively refreshes the user's OAuth access token if it's near expiry,
 * so RSC renders downstream see a fresh cookie. Propagates rotated cookies
 * to BOTH the downstream request headers (so the RSC render reads them) and
 * the outbound response (so the browser persists them).
 *
 * The /api/* routes are short-circuited before this runs (handleNonPagePaths),
 * and /api/graphql refreshes independently in its own route handler, since
 * the proxy doesn't touch it. Route handlers can write cookies directly via
 * better-auth's `nextCookies` plugin.
 *
 * Silent on failure: an expired refresh token, a missing account cookie, or
 * a transient IdP error all produce `null`. The user either proceeds with
 * the stale token (backend 401) or hits an auth gate on the next hop — we
 * don't try to be clever here.
 */
async function refreshAccessTokenIfNeeded(
  req: NextRequest,
  reqHeaders: Headers
): Promise<string[] | null> {
  if (!getSessionCookie(req)) {
    // Not signed in — nothing to refresh.
    return null;
  }
  let setCookies: string[];
  try {
    const result = (await auth.api.getAccessToken({
      body: { providerId: KAUSAL_PROVIDER_ID },
      headers: req.headers,
      returnHeaders: true,
    })) as { headers: Headers; response: unknown };
    setCookies = result.headers.getSetCookie();
  } catch (error) {
    // UNAUTHORIZED, FAILED_TO_GET_ACCESS_TOKEN, ACCOUNT_NOT_FOUND, etc.
    // Logged by better-auth already; swallow here so proxy flow continues.
    Sentry.captureException(error, { level: 'debug' });
    return null;
  }
  if (setCookies.length === 0) {
    // Token wasn't expired — no rotation, no cookies to forward.
    return null;
  }
  mergeRequestCookies(reqHeaders, setCookies);
  return setCookies;
}

/**
 * Merge rotated cookies (from Set-Cookie lines) into the downstream request's
 * Cookie header so RSC sees the fresh values via `next/headers` `cookies()`.
 */
function mergeRequestCookies(reqHeaders: Headers, setCookies: string[]) {
  const existingMap = new Map<string, string>();
  const existing = reqHeaders.get('cookie');
  if (existing) {
    for (const pair of existing.split(';')) {
      const idx = pair.indexOf('=');
      if (idx === -1) continue;
      const name = pair.slice(0, idx).trim();
      existingMap.set(name, pair.slice(idx + 1));
    }
  }
  for (const line of setCookies) {
    const firstPart = line.split(';')[0] ?? '';
    const idx = firstPart.indexOf('=');
    if (idx === -1) continue;
    const name = firstPart.slice(0, idx).trim();
    existingMap.set(name, firstPart.slice(idx + 1));
  }
  reqHeaders.set(
    'cookie',
    Array.from(existingMap.entries())
      .map(([k, v]) => `${k}=${v}`)
      .join('; ')
  );
}

const OTEL_DEBUG = envToBool(process.env.OTEL_DEBUG, false);

function getLoggerForRequest(req: NextRequest, host: string, path: string) {
  const reqId = req.headers.get('X-Correlation-ID') || generateCorrelationID();
  const span = Sentry.getActiveSpan();
  const spanBindings: Bindings = {};
  if (span) {
    Object.assign(spanBindings, getTraceLogBindings());
    if (OTEL_DEBUG) {
      spanBindings['sampled'] = span.isRecording();
    }
  }
  const logger = getLogger({
    name: 'middleware',
    bindings: {
      ...spanBindings,
      [LOGGER_CORRELATION_ID]: reqId,
      host,
      path,
    },
    request: req,
  });

  // If spotlight is enabled, we enrich the span with the request headers
  // for nicer debug experience.
  if (span && getSpotlightUrl()) {
    req.headers.forEach((headerValue, headerName) => {
      const key = `http.request.header.${headerName}`;
      span.setAttribute(key, headerValue);
    });
  }

  logger.info({ method: req.method }, `${req.method} ${req.nextUrl.pathname}`);
  if (isLocalDev) {
    const debugHeaders: Record<string, string> = {};
    req.headers.forEach((value, key) => {
      debugHeaders[key] = value;
    });
    logger.trace(debugHeaders, 'incoming headers');
  }
  return { logger, reqId };
}

async function proxy(req: NextRequest) {
  const { nextUrl } = req;
  const host = req.headers.get('host') || req.headers.get('x-forwarded-host') || req.nextUrl.host;
  const hostname = host.split(':')[0];
  const path = nextUrl.pathname;
  const pathParts = splitPath(path);

  const { logger, reqId } = getLoggerForRequest(req, host, path);

  const nonPageResp = handleNonPagePaths(path);
  if (nonPageResp) {
    return nonPageResp;
  }

  if (req.headers.get(MIDDLEWARE_RAN_HEADER)) {
    // Request has already been processed
    return NextResponse.next();
  }

  const reqHeaders = new Headers(req.headers);
  const reqInit = {
    request: {
      headers: reqHeaders,
    },
  };
  reqHeaders.set(INSTANCE_HOSTNAME_HEADER, hostname);
  reqHeaders.set(MIDDLEWARE_RAN_HEADER, '1');

  let instances: Instance[] = [];
  try {
    instances = await getInstancesForRequest(req, hostname, logger);
  } catch (error) {
    Sentry.captureException(error);
    // We let the request proceed if it's for api etc. routes
    if (NON_PAGE_PATHS.includes(pathParts[0])) {
      const resp = NextResponse.next(reqInit);
      return resp;
    }
    return errorResponse(req, reqHeaders, 'server-error');
  }
  const match = determineMatchingInstance(instances, path);
  setInstanceHeaders(reqHeaders, instances, match?.instance ?? null);
  const { instance, basePath } = match;
  reqHeaders.set(BASE_PATH_HEADER, basePath);
  reqHeaders.set(REQUEST_CORRELATION_ID_HEADER, reqId);
  if (!shouldAddInstanceHeaders(match.parts)) {
    return NextResponse.next(reqInit);
  }
  if (instance?.isProtected && !match.path.startsWith('/auth/')) {
    const sessionCookie = getSessionCookie(req);
    if (!sessionCookie) {
      return NextResponse.redirect(new URL('/auth/sign-in', req.url));
    }
  }
  if (!instances.length) {
    const wildcardDomains = getWildcardDomains();
    logger.warn(
      { 'wildcard-domains': wildcardDomains.join(',') },
      `no matching instances for hostname ${hostname}`
    );
    let resp: string;
    if (getDeploymentType() !== 'production') {
      resp = `Unknown hostname: ${hostname}. Wildcard domains: "${wildcardDomains.join(', ')}"`;
    } else {
      resp = 'Page not found.';
    }
    return new Response(resp, { status: 404 });
  }
  if (!instance) {
    const bps = instances.map((i) => ensureSlash(i.hostname.basePath)).join(', ');
    logger.warn(`no matching instance found; supported basepaths: ${bps}`);
    return errorResponse(req, reqHeaders, 'not-found');
  }

  // Proactively refresh the access token before the RSC render runs. RSC
  // can't set cookies, so this has to happen in the proxy. Skipped on
  // /auth/* paths to avoid racing with the sign-in/out flow.
  let refreshedSetCookies: string[] | null = null;
  if (!match.path.startsWith('/auth/')) {
    refreshedSetCookies = await refreshAccessTokenIfNeeded(req, reqHeaders);
    if (refreshedSetCookies) {
      logger.info({ count: refreshedSetCookies.length }, 'rotated auth cookies');
    }
  }

  // Determine locale from the URL path (after basePath is stripped)
  const { locale, path: pathWithoutLocale } = determineLocale(instance, match.path);

  // Use next-intl middleware for locale handling, created dynamically per instance
  const handleI18nRouting = createIntlMiddleware({
    locales: instance.supportedLanguages,
    defaultLocale: instance.defaultLanguage,
    localePrefix: 'as-needed',
    localeDetection: false,
  });

  const i18nResponse = handleI18nRouting(req);

  // Rewrite the URL to the App Router route structure: /root/{hostname}/{locale}/{rest}
  const strippedPath = pathWithoutLocale === '/' ? '' : pathWithoutLocale;
  const rewrittenUrl = new URL(`/root/${hostname}/${locale}${strippedPath}`, req.url);

  // Preserve the original URL for metadata generation
  reqHeaders.set('x-url', nextUrl.href);
  reqHeaders.set('x-middleware-rewrite', rewrittenUrl.pathname);
  reqHeaders.set(CURRENT_LANGUAGE_HEADER, locale);
  logger.info(
    {
      originalPath: path,
      locale,
      rewrittenPath: rewrittenUrl.pathname,
      instance: instance.identifier,
    },
    'rewriting URL for App Router'
  );

  const rewrittenResp = NextResponse.rewrite(rewrittenUrl, { request: { headers: reqHeaders } });

  // Copy over any cookies set by next-intl middleware
  i18nResponse.cookies.getAll().forEach((cookie) => {
    rewrittenResp.cookies.set(cookie);
  });

  // Forward rotated auth cookies (if any) to the browser.
  if (refreshedSetCookies) {
    for (const line of refreshedSetCookies) {
      rewrittenResp.headers.append('set-cookie', line);
    }
  }

  rewrittenResp.headers.set('Document-Policy', 'js-profiling');
  return rewrittenResp;
}

export default proxy;
