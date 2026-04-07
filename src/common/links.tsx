import NextLink, { type LinkProps } from 'next/link';

import { getAssetPrefix } from '@common/env';

import { type SiteContextType, useSite, useSiteOrNull } from '@/context/site';

function getLocalePrefix(site: SiteContextType, forLocale?: string | false) {
  const locale = forLocale || site.i18n.locale;
  const defaultLanguage = site.i18n.defaultLocale;
  if (locale == defaultLanguage) return '';
  return '/' + locale;
}

export function formatUrl(site: SiteContextType | null, url: string, forLocale?: string | false) {
  if (!url || !site) return url;
  const localePrefix = getLocalePrefix(site, forLocale);
  if (url.startsWith('/')) {
    const pathPrefix = site.basePath;
    return `${pathPrefix}${localePrefix}${url}`;
  }
  return url;
}

export function formatStaticUrl(url: string) {
  if (!url) return url;
  if (url.startsWith('/')) {
    const pathPrefix = getAssetPrefix() || '';
    return `${pathPrefix}${url}`;
  }
  return url;
}

export function chompBasePath(site: SiteContextType, path: string) {
  if (!site.basePath) return path;
}

type OtherLinkProps = Omit<LinkProps, 'href'> & {
  children?: React.ReactNode;
  className?: string;
  target?: string;
  rel?: string;
  locale?: string | false;
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
};

export function Link(props: OtherLinkProps & { href: string }) {
  const { href, locale, ...rest } = props;
  const site = useSiteOrNull();
  const resolvedHref = href.startsWith('/') ? formatUrl(site, href, locale) : href;
  return <NextLink href={resolvedHref} {...rest} />;
}

type FormattedLinkProps = {
  as: string;
};

function getResolvedHref(
  site: SiteContextType | null,
  hrefProps: FormattedLinkProps,
  locale?: string | false
) {
  return formatUrl(site, hrefProps.as, locale);
}

type NodeLinkProps = OtherLinkProps & {
  node: {
    id: string;
  };
};

export function NodeLink(props: NodeLinkProps) {
  const { node, locale, ...rest } = props;
  const site = useSite();
  const href = getResolvedHref(site, { as: `/node/${node.id}` }, locale);
  return <NextLink href={href} prefetch={false} {...rest} />;
}

export type ActionLinkProps = OtherLinkProps & {
  action: {
    id: string;
  };
};

export function ActionLink(props: ActionLinkProps) {
  const { action, locale, ...rest } = props;
  const site = useSiteOrNull();
  const href = getResolvedHref(site, { as: `/actions/${action.id}` }, locale);
  return <NextLink href={href} prefetch={false} {...rest} />;
}

type ActionListLinkProps = OtherLinkProps & {
  subPage?: 'list' | 'mac';
};
export function ActionListLink(props: ActionListLinkProps) {
  const { subPage, locale, ...rest } = props;
  const pathname = subPage === 'mac' ? '/actions/mac' : '/actions';
  const site = useSiteOrNull();
  const href = getResolvedHref(site, { as: pathname }, locale);
  return <NextLink href={href} prefetch={false} {...rest} />;
}
