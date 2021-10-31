import getConfig from 'next/config';
import NextLink from 'next/link';
import * as routerSymbols from 'next/dist/shared/lib/router/router';

/* Monkeypatch a version of addBasePath() that takes the basePath
 * dynamically from the runtime config. Otherwise all the NextJS links
 * do not contain the path prefix. */
function addBasePath(path) {
  const { basePath } = publicRuntimeConfig;

  if (!path.startsWith('/') || !basePath) {
    return path
  }
  return `${basePath}${path}`;
}
routerSymbols.addBasePath = addBasePath;

const { publicRuntimeConfig } = getConfig();


export function formatUrl(url) {
  const { basePath } = publicRuntimeConfig;
  if (!url) return url;

  if (url.startsWith('/') && basePath) {
    return `${basePath}${url}`;
  }
  return url;
};

export function Link(props) {
  return <NextLink {...props} />;
}

export function NodeLink(props) {
  const { node, ...rest } = props;
  const linkProps = {
    href: `/node/${node.id}`,
    ...rest,
  }
  return <NextLink {...linkProps} />
}

export function ActionLink(props) {
  const { node, action, ...rest } = props;
  const linkProps = {
    href: `/actions/${node?.id || action?.id}`,
    ...rest,
  }
  return <NextLink {...linkProps} />
}
