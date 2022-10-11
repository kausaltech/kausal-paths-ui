import originalUrl from 'original-url';


export function getCurrentURL(req) {
  const obj = originalUrl(req);
  let port;

  if (obj.protocol === 'http:' && obj.port === 80) {
    port = '';
  } else if (obj.protocol === 'https:' && obj.port === 443) {
    port = '';
  } else {
    port = `:${obj.port}`;
  }
  const path = obj.pathname.replace(/\/$/, ''); // strip trailing slash
  const baseURL = `${obj.protocol}//${obj.hostname}${port}`;
  const hostname = obj.hostname;
  return { baseURL, path, hostname };
}
