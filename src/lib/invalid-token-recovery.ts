// Triggered when the backend reports an invalid access token. The cookies
// are dead — the only recovery is to drop them and reload. After the reload:
//   - public page → renders anonymously.
//   - protected page → proxy auth gate redirects to /auth/sign-in.
// Both the Apollo error link (client-side GraphQL failures) and the Next.js
// error boundaries (RSC/SSR failures that surface to the browser) call into
// this so the recovery is identical regardless of where the failure originated.
//
// Sign-out goes through the better-auth client API (same path used by
// PublicUserNav) rather than a raw fetch — the client wrapper sets the
// origin/credentials better-auth's endpoint expects, and crucially clears
// all three of `session_token`, `session_data`, and `account_data` (the
// access token lives in the latter; a raw fetch we tried first did not
// reliably wipe all of them and the page kept looping).

let inFlight = false;

export function recoverFromInvalidToken(): void {
  if (typeof window === 'undefined') return;
  // Multiple parallel ops or the boundary firing alongside a client query
  // can both call this; only kick off the recovery once.
  if (inFlight) return;
  inFlight = true;
  // Dynamic import so this module stays safe to load from server-side
  // bundles (apollo-config.ts is shared SSR/CSR). better-auth/react
  // pulls in browser-only code we don't want evaluated in Node.
  void (async () => {
    try {
      const { signOut } = await import('@/lib/auth-client');
      await signOut();
    } catch {
      // Best-effort: if sign-out fails for any reason, still reload — the
      // proxy auth gate will redirect to sign-in for protected pages, and
      // the user can manually sign out from the public-page nav.
    } finally {
      window.location.reload();
    }
  })();
}

export function isInvalidTokenError(error: unknown): boolean {
  if (!error) return false;
  const message =
    error instanceof Error
      ? error.message
      : typeof (error as { message?: unknown }).message === 'string'
        ? (error as { message: string }).message
        : '';
  return message.includes('invalid_token');
}
