import { acceptLanguage } from 'next/dist/server/accept-header';
import { NextURL } from 'next/dist/server/web/next-url';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

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
import { generateCorrelationID, getLogger } from './common/log';
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

function determineLocale(instance: Instance, path: string) {
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
  if (headers?.['accept-language'] && !Array.isArray(headers['accept-language'])) {
    try {
      return acceptLanguage(headers['accept-language'], supportedLocales);
    } catch (err) {}
  }
}

function notFoundResponse(req: NextRequest, headers: Headers) {
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
  url.pathname = '/_error';
  const reqInit: { request: { headers: Headers }; status?: number } = {
    request: {
      headers,
    },
  };
  reqInit.status = 404;
  return NextResponse.rewrite(url, reqInit);
}

export async function middleware(req: NextRequest) {
  const { nextUrl } = req;
  const host = req.headers.get('host') || req.headers.get('x-forwarded-host') || req.nextUrl.host;
  const hostname = host.split(':')[0];
  const reqId = req.headers.get('X-Correlation-ID') || generateCorrelationID();
  let path = nextUrl.pathname;
  const logger = getLogger('middleware', { host, path, 'request-id': reqId });

  if (req.nextUrl.pathname === '/_health') {
    return NextResponse.json({ status: 'OK' });
  }
  logger.info({ method: req.method }, 'middleware request');
  if (req.headers.get(INSTANCE_IDENTIFIER_HEADER)) {
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

  const instances = await getInstancesForRequest(req, hostname, logger);
  const match = determineMatchingInstance(instances, path);
  setInstanceHeaders(reqHeaders, instances, match?.instance || null);
  const { instance, basePath } = match;
  reqHeaders.set(BASE_PATH_HEADER, match.basePath);
  if (['api', 'static', '_next', 'favicon.ico'].includes(match.parts[0])) {
    return NextResponse.next(reqInit);
  }

  if (!instance) {
    const bps = instances.map((i) => ensureSlash(i.hostname.basePath)).join(', ');
    logger.warn(`no matching instance found; supported basepaths: ${bps}`);
    return notFoundResponse(req, reqHeaders);
  }

  path = match.path;

  const { locale, path: localizedPath } = determineLocale(instance, match.path);
  path = localizedPath;

  const href = `${nextUrl.protocol}//${nextUrl.host}${path}`;
  const url = new NextURL(href, {
    nextConfig: {
      basePath: basePath,
      i18n: {
        locales: instance.supportedLanguages,
        defaultLocale: 'default',
      },
    },
    forceLocale: true,
  });
  //url.locale = locale;
  console.log('before:');
  console.log(nextUrl);
  console.log(nextUrl.locale);
  console.log('after:');
  console.log(url);
  console.log(url.locale);
  //const url = request.nextUrl.clone();
  //url.locale = locale;
  if (nextUrl.locale === url.locale) {
    return NextResponse.next(reqInit);
  }
  console.log('redirecting');
  return NextResponse.rewrite(url, reqInit);
}
