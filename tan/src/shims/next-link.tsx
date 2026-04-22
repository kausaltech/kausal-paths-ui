/**
 * Shim for next/link → TanStack Router Link.
 *
 * next/link accepts `href` as string or { pathname, query } object,
 * plus an `as` prop for the displayed URL. We normalize both into
 * a simple string href for TanStack Router.
 */
import { type AnchorHTMLAttributes, type ReactNode, forwardRef } from 'react';

import { Link as RouterLink } from '@tanstack/react-router';

interface NextLinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  href: string | { pathname: string; query?: Record<string, string | string[]> };
  as?: string;
  locale?: string | false;
  prefetch?: boolean;
  replace?: boolean;
  scroll?: boolean;
  shallow?: boolean;
  children?: ReactNode;
}

function resolveHref(href: NextLinkProps['href'], as?: string): string {
  if (as) return as;
  if (typeof href === 'string') return href;

  const { pathname, query } = href;
  if (!query) return pathname;

  // Expand [slug] patterns or append as search params
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

const NextLink = forwardRef<HTMLAnchorElement, NextLinkProps>(function NextLink(
  { href, as, locale, prefetch, replace, scroll, shallow, children, ...rest },
  ref
) {
  const resolved = resolveHref(href, as);

  // External links — render plain <a>
  if (resolved.startsWith('http://') || resolved.startsWith('https://')) {
    return (
      <a ref={ref} href={resolved} {...rest}>
        {children}
      </a>
    );
  }

  return (
    <RouterLink ref={ref} to={resolved} {...rest}>
      {children}
    </RouterLink>
  );
});

export default NextLink;
export type { NextLinkProps as LinkProps };
