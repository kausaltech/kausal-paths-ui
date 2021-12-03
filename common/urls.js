import getConfig from 'next/config';
import NextLink from 'next/link';
import { setBasePath as setNextRouterBasePath } from 'next/dist/shared/lib/router/router';
import { useRouter } from 'next/router';


const { publicRuntimeConfig } = getConfig();


export function setBasePath() {
  setNextRouterBasePath(publicRuntimeConfig.basePath);
}

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
