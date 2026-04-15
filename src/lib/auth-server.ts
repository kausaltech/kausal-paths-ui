import { headers } from 'next/headers';

import { auth } from './auth';

/**
 * Get the current user's session including the access token.
 * Must be called in a server context (RSC, Route Handler, Server Action).
 */
export async function getAuthSession() {
  return auth.api.getSession({
    headers: await headers(),
  });
}

/**
 * Get the current user's OAuth access token for authenticating with the backend API.
 * Returns null if no session or no token is available.
 */
export async function getAccessToken(): Promise<string | null> {
  const session = await getAuthSession();
  return (session as { accessToken?: string } | null)?.accessToken ?? null;
}
