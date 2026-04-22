/**
 * Shim for bare 'next' import (NextPageContext type).
 */
export interface NextPageContext {
  err?: Error | null;
  asPath?: string;
  pathname: string;
  query: Record<string, string | string[] | undefined>;
  res?: unknown;
  req?: unknown;
}
