# Authentication & Session Architecture

## Overview

The Paths UI has two independent identity/state mechanisms that coexist
on every request to the backend:

1. **User authentication** — OAuth 2.0 access token, identifies who the
   user is
2. **Ephemeral model state** — Django session cookie, stores scenario
   tweaks and parameter overrides

These serve orthogonal purposes and should remain decoupled.

## User Authentication (better-auth)

### Setup

The frontend uses [better-auth](../../../devel/oss/better-auth) in fully
stateless mode (no database). The Kausal backend serves as the OIDC
Identity Provider.

**Server config** (`src/lib/auth.ts`):
- Generic OAuth plugin with OIDC discovery against the Kausal IdP
- Stateless JWE cookie cache (7-day expiry, auto-refresh at 80%)
- Account data stored in encrypted cookie (`storeAccountCookie: true`)
- `customSession` plugin exposes the OAuth access token in the session
  response by reading it from the account cookie

**Client** (`src/lib/auth-client.ts`):
- `createAuthClient` with generic OAuth + custom session type inference
- Provides `signIn`, `signOut`, `useSession` hooks

**API route** (`src/app/api/auth/[...all]/route.ts`):
- Mounts better-auth's handler via `toNextJsHandler`

### Environment Variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `AUTH_SECRET` | Signs/encrypts session cookies | (required) |
| `AUTH_ISSUER` | OIDC IdP base URL | Falls back to `PATHS_BACKEND_URL` |
| `AUTH_CLIENT_ID` | OAuth client ID | (required) |
| `AUTH_CLIENT_SECRET` | OAuth client secret | (required) |
| `AUTH_ALLOWED_HOSTS` | Additional allowed hostnames (comma-separated) | (none) |

`WILDCARD_DOMAINS` (existing, comma-separated) is also used: each entry
becomes a `*.{domain}:*` pattern for better-auth's dynamic base URL
resolution. In dev mode it defaults to `localhost`.

`AUTH_ALLOWED_HOSTS` is for single-instance hostnames that don't follow
the wildcard pattern (e.g., customer-controlled domains). The helm chart
can populate this from ingress configuration.

### Cookie Inventory

| Cookie | Set by | Contents | Purpose |
|--------|--------|----------|---------|
| `better-auth.session_token` | better-auth | Signed session token | Session identity |
| `better-auth.session_data` | better-auth | JWE-encrypted session + user | Stateless session cache |
| `better-auth.account_data` | better-auth | Encrypted OAuth tokens | Stores access/refresh/id tokens |
| `paths_api_sessionid` | Django backend | Django session ID | Ephemeral model state |

### Token Flow by Layer

**Browser → GraphQL proxy → Backend:**

```
Browser                    Next.js (/api/graphql)              Backend
  |                              |                               |
  |-- fetch (cookies attached) ->|                               |
  |                              |-- getAccessToken()            |
  |                              |   (decrypts account cookie)   |
  |                              |                               |
  |                              |-- Authorization: Bearer token ->
  |                              |-- Cookie: sessionid=xxx ------->
  |                              |                               |
  |                              |<-- Set-Cookie: sessionid=yyy --|
  |<-- Set-Cookie: paths_api_sessionid=yyy (re-prefixed) --------|
```

The GraphQL proxy (`src/app/api/graphql/route.ts`) injects the
Authorization header by reading the access token from the encrypted
account cookie via `getAccessToken()`. Backend cookies are forwarded
in both directions with a `paths_api_` prefix (see
`kausal_common/src/utils/cookies.ts`).

**RSC (React Server Components) → Backend:**

```
Incoming request           RSC render                           Backend
  |                           |                                   |
  |-- (cookies in headers) -->|                                   |
  |                           |-- getAccessToken()                |
  |                           |   (same decryption path)          |
  |                           |                                   |
  |                           |-- Authorization: Bearer token ----->
  |                           |                                   |
  |                           |<-- response (Set-Cookie ignored) --|
```

RSC requests go directly to the backend (not through the proxy).
The access token is injected via `ApolloClientOpts.authorizationToken`.
**Backend Set-Cookie headers are not forwarded** in this path — RSC
renders cannot set cookies on the response. This is acceptable because
RSC renders are read-only (no mutations that would change session state).

**proxy.ts (request interception):**

Does not extract or forward tokens. Only checks for the *existence* of
the session cookie via `getSessionCookie(req)` and redirects to
`/auth/sign-in` if absent. This is an optimistic check — the cookie
is not validated, just detected.

## Ephemeral Model State (Django Sessions)

### What It Stores

When a user (authenticated or anonymous) tweaks a scenario — disabling
an action, adjusting a parameter, selecting a different scenario — the
backend stores these overrides as JSON in the Django session. This is
ephemeral, per-browser state that affects what the user sees but doesn't
modify the underlying model for other users.

### Interaction with Bearer Token Auth

Django's `login()` function explicitly writes the user ID into the
session (`request.session[SESSION_KEY]`). Token-based authentication
middleware (DRF `TokenAuthentication`, custom OIDC middleware, etc.)
sets `request.user` directly on the request object *without* calling
`login()` and without writing to the session.

This means:

- An anonymous Django session + Bearer token should coexist: the
  session remains anonymous (no `SESSION_KEY`), and `request.user` is
  set from the token
- Scenario tweaks stored in the session are not associated with any
  user identity — they're tied to the session cookie, not the auth
  token
- Logging out (losing the Bearer token) doesn't destroy the Django
  session — tweaks survive if the browser still has the session cookie

**Potential concern:** If the backend's auth middleware *does* call
`login()` (e.g., on first authenticated request), Django will cycle
the session key for security. This would discard any ephemeral tweaks
from the previous anonymous session. Verify that the Paths backend's
token auth does NOT call `django.contrib.auth.login()`.

### Tweak Persistence Across Logins

Currently undefined. Tweaks live in the Django session, which is
browser-scoped and independent of user identity. If a user logs out
and back in, their tweaks may or may not survive depending on whether
the session cookie is still present.

For Trailhead (where all users are authenticated), the question is
whether ephemeral tweaks should be:
- **Session-scoped** (current behavior) — tweaks disappear when the
  session expires
- **User-scoped** — tweaks are stored per-user and restored on login
- **URL-encoded** — tweaks are captured in the URL for sharing

No decision needed for the MVP demo.

## Future: Client-Side Tweak State

To make the boundary between auth sessions and ephemeral state sharper,
the backend could return a serialized tweak state (e.g., base64-encoded
JSON of parameter overrides) as part of the mutation response. The UI
would then be responsible for:

1. Persisting the tweak blob (localStorage, URL parameter, or cookie
   — UI's choice)
2. Passing it back to the backend on every subsequent query (as a
   GraphQL variable or header)

This would eliminate the need for the Django session to store model
state entirely. Benefits:

- No session/auth interaction to worry about on the backend
- Tweaks become trivially shareable (URL-encoded) and persistable
  (localStorage)
- Backend becomes stateless for read-only requests — better caching
- The Django session cookie is only needed for CSRF (if used) or
  can be dropped entirely for API-only usage

This is a post-MVP consideration. The current session-based approach
works and the scope is tight.
