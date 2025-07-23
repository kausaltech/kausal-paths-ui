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

type OtherLinkProps = Omit<LinkProps, 'href' | 'as'> & {
  children?: React.ReactNode;
};

export function Link(props: OtherLinkProps & { href: string }) {
  const { href, ...rest } = props;
  let as: string | undefined;

  const site = useSiteOrNull();

  if (href.startsWith('/')) {
    as = formatUrl(site, href, rest.locale);
  } else {
    as = undefined;
  }
  const localeDisabledProps = { ...rest, locale: false } satisfies OtherLinkProps;
  return <NextLink legacyBehavior href={href} as={as} {...localeDisabledProps} />;
}

type FormattedLinkProps = {
  href: LinkProps['href'];
  as: string;
};

function getLinkProps(
  site: SiteContextType | null,
  hrefProps: FormattedLinkProps,
  otherProps: OtherLinkProps
) {
  const { locale, ...rest } = otherProps;
  const { href, as } = hrefProps;

  const linkProps: LinkProps = {
    href,
    as: formatUrl(site, as, locale),
    passHref: otherProps.passHref ?? true,
    locale: false,
    prefetch: false,
    ...rest,
  };
  return linkProps;
}

type NodeLinkProps = OtherLinkProps & {
  node: {
    id: string;
  };
};

export function NodeLink(props: NodeLinkProps) {
  const { node, ...rest } = props;
  const hrefProps: FormattedLinkProps = {
    href: {
      pathname: '/node/[slug]',
      query: {
        slug: node.id,
      },
    },
    as: `/node/${node.id}`,
  };
  const site = useSite();
  return <NextLink legacyBehavior {...getLinkProps(site, hrefProps, rest)} />;
}

type ActionLinkProps = OtherLinkProps & {
  action: {
    id: string;
  };
};

export function ActionLink(props: ActionLinkProps) {
  const { action, ...rest } = props;
  const hrefProps = {
    href: {
      pathname: '/actions/[slug]',
      query: {
        slug: action.id,
      },
    },
    as: `/actions/${action.id}`,
  };
  const site = useSiteOrNull();
  return <NextLink legacyBehavior {...getLinkProps(site, hrefProps, rest)} />;
}

type ActionListLinkProps = OtherLinkProps & {
  subPage?: 'list' | 'mac';
};
export function ActionListLink(props: ActionListLinkProps) {
  const { subPage, ...rest } = props;
  const pathname = subPage === 'mac' ? '/actions/mac' : '/actions';
  const hrefProps = {
    href: {
      pathname,
    },
    as: pathname,
  };
  const site = useSiteOrNull();
  const linkProps = getLinkProps(site, hrefProps, rest);
  return <NextLink legacyBehavior passHref={true} {...linkProps} />;
}
