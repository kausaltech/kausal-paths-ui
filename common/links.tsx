import getConfig from 'next/config';
import NextLink, { LinkProps } from 'next/link';
import { getI18n } from 'common/i18n';


let basePath: string|undefined;

function getLocalePrefix(forLocale?: string|false) {
  const i18n = getI18n();
  const { publicRuntimeConfig } = getConfig();
  const locale = forLocale || i18n.language;
  const defaultLanguage = publicRuntimeConfig.instance.defaultLanguage;
  if (locale == defaultLanguage) return '';
  return '/' + locale;
}

export function setBasePath(path = null) {
  if (path == null) {
    const { publicRuntimeConfig } = getConfig();
    basePath = publicRuntimeConfig.basePath;
  } else {
    basePath = path;
  }
}

export function formatUrl(url: string, forLocale?: string|false) {
  if (!url) return url;
  const localePrefix = getLocalePrefix(forLocale);
  if (url.startsWith('/')) {
    let pathPrefix = basePath || '';
    return `${pathPrefix}${localePrefix}${url}`;
  }
  return url;
};

export function formatStaticUrl(url: string) {
  if (!url) return url;
  if (url.startsWith('/')) {
    let pathPrefix = basePath || '';
    return `${pathPrefix}${url}`;
  }
}


type OtherLinkProps = Omit<LinkProps, 'href' | 'as'>;

export function Link(props: OtherLinkProps & {href: string}) {
  const { href, ...rest } = props;
  let as: string | undefined;

  if (href.startsWith('/')) {
    as = formatUrl(href, rest.locale);
  } else {
    as = undefined;
  }
  rest.locale = false;
  return <NextLink legacyBehavior href={href} as={as} {...rest} />;
}

type FormattedLinkProps= {
  href: LinkProps['href'],
  as: string,
};

function getLinkProps(hrefProps: FormattedLinkProps, otherProps: OtherLinkProps) {
  const { locale, ...rest } = otherProps;
  const { href, as } = hrefProps;

  const linkProps: LinkProps = {
    href,
    as: formatUrl(as, locale),
    passHref: otherProps.passHref ?? true,
    locale: false,
    ...rest,
  };
  return linkProps;
}

type NodeLinkProps = OtherLinkProps & {
  node: {
    id: string,
  }
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
  }
  return <NextLink legacyBehavior {...getLinkProps(hrefProps, rest)} />
}

type ActionLinkProps = OtherLinkProps & {
  action: {
    id: string,
  },
}

export function ActionLink(props: ActionLinkProps) {
  const { action, ...rest } = props;
  const hrefProps = {
    href: {
      pathname: '/actions/[slug].js',
      query: {
        slug: action.id,
      },
    },
    as: `/actions/${action.id}`,
  }
  return <NextLink legacyBehavior {...getLinkProps(hrefProps, rest)} />
}

type ActionListLinkProps = OtherLinkProps & {
  subPage?: 'list' | 'mac',
}
export function ActionListLink(props: ActionListLinkProps) {
  const { subPage, ...rest } = props;
  const pathname = subPage === 'mac' ? '/actions/mac' : '/actions';
  const hrefProps = {
    href: {
      pathname,
    },
    as: pathname,
  };
  const linkProps = getLinkProps(hrefProps, rest);
  return <NextLink legacyBehavior passHref={true} {...linkProps} />
}
