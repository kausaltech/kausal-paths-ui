export function ensureSlash(path: string | null) {
  if (!path) return '/';
  if (path.startsWith('/')) return path;
  return `/${path}`;
}

export function splitPath(path: string | null) {
  const parts = ensureSlash(path).split('/');
  parts.shift();
  return parts;
}

export function joinPath(parts: string[]) {
  return ['', ...parts.filter((part) => part.length)].join('/');
}

export function stripPathPrefix(path: string, prefix: string) {
  const pathParts = splitPath(path);
  const prefixParts = splitPath(prefix);
  if (!prefixParts.length) return path;
  if (pathParts[0] === prefixParts[0]) {
    pathParts.shift();
  } else {
    return path;
  }
  return joinPath(pathParts);
}
