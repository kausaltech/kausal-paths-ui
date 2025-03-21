import { acceptLanguage } from 'next/dist/server/accept-header';
import { NextURL } from 'next/dist/server/web/next-url';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import * as Sentry from '@sentry/nextjs';

import {
  MIDDLEWARE_RAN_HEADER,
  REQUEST_CORRELATION_ID_HEADER,
} from '@common/constants/headers.mjs';
import { HEALTH_CHECK_PUBLIC_PATH } from '@common/constants/routes.mjs';
import { getDeploymentType, getSpotlightUrl, getWildcardDomains, isLocal } from '@common/env';
import {
  LOGGER_CORRELATION_ID,
  LOGGER_SPAN_ID,
  LOGGER_TRACE_ID,
  generateCorrelationID,
  getLoggerAsync,
} from '@common/logging/logger';

import { ensureSlash, joinPath, splitPath } from '@/utils/paths';

import i18nConfig from '../next-i18next.config';
import type { AvailableInstanceFragment } from './common/__generated__/graphql';
import {
  BASE_PATH_HEADER,
  DEFAULT_LANGUAGE_HEADER,
  INSTANCE_HOSTNAME_HEADER,
  INSTANCE_IDENTIFIER_HEADER,
  SUPPORTED_LANGUAGES_HEADER,
  THEME_IDENTIFIER_HEADER,
} from './common/const';
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
    path = joinPath(parts);
  }
  return { basePath, instance: match, path, parts };
}

function determineLocale(instance: Instance, path: string, detectedLocale: string) {
  if (detectedLocale !== 'default') {
    // NextJS chomps the locale, so we need to add it back in.
    path = `/${detectedLocale}${path}`;
  }
  const otherLanguages = instance.supportedLanguages.filter(
    (lang) => lang != instance.defaultLanguage
  );
  let parts = splitPath(path);
  let locale = otherLanguages.find((lang) => lang.toLowerCase() === parts[0].toLowerCase());
  if (!locale) {
    locale = instance.defaultLanguage;
  } else {
    parts.shift();
  }
  // Ensure path always has the language code as first part
  parts = [locale, ...parts];
  return { locale, path: joinPath(parts) };
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

function getAcceptPreferredLocale(supportedLocales: string[], headers: Headers) {
  const acceptLanguageHeader = headers.get('accept-language');
  try {
    return acceptLanguage(acceptLanguageHeader ?? undefined, supportedLocales);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {}
}

function errorResponse(req: NextRequest, headers: Headers, kind: 'not-found' | 'server-error') {
  const locale =
    headers.get(DEFAULT_LANGUAGE_HEADER) ||
    getAcceptPreferredLocale(i18nConfig.i18n.locales, headers) ||
    'en';
  const url = new NextURL(req.nextUrl.href, {
    nextConfig: {
      i18n: {
        defaultLocale: locale,
        locales: i18nConfig.i18n.locales,
      },
    },
    forceLocale: true,
  });
  const reqInit: { request: { headers: Headers }; status?: number } = {
    request: {
      headers,
    },
  };
  if (kind === 'not-found') {
    reqInit.status = 404;
    url.pathname = '/404';
  } else {
    reqInit.status = 500;
    url.pathname = '/500';
  }
  return NextResponse.rewrite(url, reqInit);
}

const NON_PAGE_PATHS = ['api', 'static', '_next', 'favicon.ico'];

function isHotReloadPath(parts: string[]) {
  return isLocal && parts.join('/').startsWith('_next/static/webpack');
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

async function middleware(req: NextRequest) {
  const { nextUrl } = req;
  const host = req.headers.get('host') || req.headers.get('x-forwarded-host') || req.nextUrl.host;
  const hostname = host.split(':')[0];
  const reqId = req.headers.get('X-Correlation-ID') || generateCorrelationID();
  let path = nextUrl.pathname;
  const detectedLocale = nextUrl.locale;
  const pathParts = splitPath(path);

  const span = Sentry.getActiveSpan();
  const spanBindings = {};
  if (span) {
    spanBindings[LOGGER_TRACE_ID] = span.spanContext().traceId;
    spanBindings[LOGGER_SPAN_ID] = span.spanContext().spanId;
    spanBindings['sampled'] = span.isRecording();
  }
  const logger = await getLoggerAsync({
    name: 'middleware',
    bindings: {
      ...spanBindings,
      [LOGGER_CORRELATION_ID]: reqId,
      host,
      path,
    },
    request: req,
  });

  if (req.nextUrl.pathname === HEALTH_CHECK_PUBLIC_PATH) {
    return NextResponse.json({ status: 'OK' });
  }
  if (
    req.nextUrl.pathname === '/__nextjs_original-stack-frame' ||
    req.nextUrl.pathname.startsWith('/_next/static/')
  ) {
    return NextResponse.next();
  }

  // If spotlight is enabled, we enrich the span with the request headers
  // for nicer debug experience.
  if (span && getSpotlightUrl()) {
    req.headers.forEach((headerValue, headerName) => {
      const key = `http.request.header.${headerName}`;
      span.setAttribute(key, headerValue);
    });
  }

  if (req.nextUrl.pathname === '/_ping') {
    return NextResponse.json({ status: 'pong' });
  }
  logger.info({ method: req.method }, `${req.method} ${req.nextUrl.pathname}`);
  if (false && isLocal) {
    const debugHeaders: Record<string, string> = {};
    req.headers.forEach((value, key) => {
      debugHeaders[key] = value;
    });
    logger.info(debugHeaders, 'incoming headers');
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
  setInstanceHeaders(reqHeaders, instances, match?.instance || null);
  const { instance, basePath } = match;
  reqHeaders.set(BASE_PATH_HEADER, basePath);
  reqHeaders.set(REQUEST_CORRELATION_ID_HEADER, reqId);
  if (!shouldAddInstanceHeaders(match.parts)) {
    return NextResponse.next(reqInit);
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

  const { path: localizedPath } = determineLocale(instance, match.path, detectedLocale);
  path = localizedPath;

  const href = `${nextUrl.protocol}//${nextUrl.host}${path}`;
  const url = new NextURL(href);
  const shouldRewrite = nextUrl.pathname !== url.pathname;
  if (shouldRewrite) {
    logger.info(
      {
        beforeHref: nextUrl.toString(),
        beforeLocale: nextUrl.locale,
        afterHref: url.toString(),
        afterLocale: url.locale,
      },
      'rewriting URL'
    );
  }
  if (!shouldRewrite || isHotReloadPath(match.parts)) {
    const resp = NextResponse.next(reqInit);
    resp.headers.set('Document-Policy', 'js-profiling');
    return resp;
  }
  const rewrittenResp = NextResponse.rewrite(url, reqInit);
  return rewrittenResp;
}

export default Sentry.wrapMiddlewareWithSentry(middleware);
