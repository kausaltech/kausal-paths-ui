/**
 * Shim for next/router → TanStack Router equivalents.
 *
 * Provides the subset of the Next.js router API that components actually use:
 * - router.query (parsed path/search params)
 * - router.asPath (current pathname)
 * - router.pathname (route pattern — approximated as pathname)
 * - router.locale / router.locales
 * - router.push / router.replace
 * - router.isReady (always true in SPA)
 */
import { useMemo } from 'react';

import { useLocation, useNavigate, useParams, useSearch } from '@tanstack/react-router';

type UrlObject = { pathname: string; query?: Record<string, string | string[]> };
type Url = string | UrlObject;
type NavigateOptions = { shallow?: boolean };

/** Resolve a Next.js URL (string or { pathname, query }) to a plain path string. */
function resolveUrl(url: Url): string {
  if (typeof url === 'string') return url;

  const { pathname, query } = url;
  if (!query) return pathname;

  let resolved = pathname;
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    const v = Array.isArray(value) ? value[0] : value;
    if (v == null) continue;
    const pattern = `[${key}]`;
    if (resolved.includes(pattern)) {
      resolved = resolved.replace(pattern, encodeURIComponent(v));
    } else {
      searchParams.set(key, v);
    }
  }
  const qs = searchParams.toString();
  return qs ? `${resolved}?${qs}` : resolved;
}

interface NextRouter {
  query: Record<string, string | string[] | undefined>;
  asPath: string;
  pathname: string;
  locale?: string;
  locales?: string[];
  defaultLocale?: string;
  isReady: boolean;
  push: (url: Url, as?: string, options?: NavigateOptions) => void;
  replace: (url: Url, as?: string, options?: NavigateOptions) => void;
  back: () => void;
}

export function useRouter(): NextRouter {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams({ strict: false });
  let search: Record<string, unknown> = {};
  try {
    search = useSearch({ strict: false });
  } catch {
    // no search params
  }

  const asPath = location.pathname + (location.searchStr || '');

  const query = useMemo(
    () => ({
      ...(params as Record<string, string>),
      ...(search as Record<string, string>),
    }),
    [params, search]
  );

  return useMemo(
    () => ({
      query,
      asPath,
      pathname: location.pathname,
      locale: undefined,
      locales: undefined,
      defaultLocale: undefined,
      isReady: true,
      push: (url: Url, as?: string, options?: NavigateOptions) => {
        const resolved = as || resolveUrl(url);
        if (options?.shallow) {
          window.history.pushState(null, '', resolved);
        } else {
          navigate({ to: resolved });
        }
      },
      replace: (url: Url, as?: string, options?: NavigateOptions) => {
        const resolved = as || resolveUrl(url);
        if (options?.shallow) {
          window.history.replaceState(null, '', resolved);
        } else {
          navigate({ to: resolved, replace: true });
        }
      },
      back: () => {
        window.history.back();
      },
    }),
    [asPath, location.pathname, query, navigate]
  );
}
