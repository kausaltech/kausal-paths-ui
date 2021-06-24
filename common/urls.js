import getConfig from 'next/config';

const { publicRuntimeConfig } = getConfig();


export function formatUrl(url) {
  const { basePath } = publicRuntimeConfig;
  if (!url) return url;

  if (url.startsWith('/') && basePath) {
    return `${basePath}${url}`;
  }
  return url;
};
