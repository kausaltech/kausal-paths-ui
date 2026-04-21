import { headers } from 'next/headers';

import { getLogger } from '@common/logging/logger';

import { auth } from './auth';
import { KAUSAL_PROVIDER_ID } from './auth-const';

const authLogger = getLogger({ name: 'auth' });

/**
 * Get the current user's session including the access token.
 * Must be called in a server context (RSC, Route Handler, Server Action).
 *
 * This is a READ-ONLY accessor — it does not attempt to refresh an expired
 * token. Use `getFreshAccessToken()` in Route Handlers / Server Actions where
 * cookie writes are allowed. In RSC, cookie writes are not allowed, so the
 * proxy (`src/proxy.ts`) refreshes the access token proactively before RSC
 * renders run.
 */
export async function getAuthSession() {
  return auth.api.getSession({
    headers: await headers(),
  });
}

/**
 * Get the current user's OAuth access token for authenticating with the
 * backend API. Read-only — does not refresh. Returns null if no session.
 *
 * Safe to call from RSC. In RSC the proxy is expected to have refreshed the
 * cookie already if the token was near expiry.
 */
export async function getAccessToken(): Promise<string | null> {
  const session = await getAuthSession();
  return (session as { accessToken?: string } | null)?.accessToken ?? null;
}

/**
 * Get a fresh OAuth access token, transparently refreshing via the IdP if
 * the stored token is expired. Persists rotated tokens back to the account
 * cookie via better-auth's `nextCookies` after-hook.
 *
 * Only safe to call from contexts that can write cookies (Route Handlers,
 * Server Actions, middleware/proxy). Calling from RSC will not persist
 * rotated tokens and may consume a one-shot refresh token with nothing to
 * show for it — don't do it.
 *
 * Returns null if the user is not signed in or if the refresh failed
 * (e.g. refresh token expired/revoked). Callers should treat null as
 * "proceed unauthenticated or redirect to sign-in".
 */
export async function getFreshAccessToken(): Promise<string | null> {
  try {
    const result = await auth.api.getAccessToken({
      body: { providerId: KAUSAL_PROVIDER_ID },
      headers: await headers(),
    });
    return result.accessToken ?? null;
  } catch (error) {
    // UNAUTHORIZED: no session (user not signed in).
    // FAILED_TO_GET_ACCESS_TOKEN: refresh failed (refresh token expired/
    // revoked, or IdP unreachable). Either way, tell the caller we have
    // no token.
    authLogger.debug({ err: error }, 'getFreshAccessToken returned null');
    return null;
  }
}
