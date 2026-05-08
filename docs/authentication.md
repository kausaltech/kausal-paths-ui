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

| Variable             | Purpose                                        | Default                           |
| -------------------- | ---------------------------------------------- | --------------------------------- |
| `AUTH_SECRET`        | Signs/encrypts session cookies                 | (required)                        |
| `AUTH_ISSUER`        | OIDC IdP base URL                              | Falls back to `PATHS_BACKEND_URL` |
| `AUTH_CLIENT_ID`     | OAuth client ID                                | (required)                        |
| `AUTH_CLIENT_SECRET` | OAuth client secret                            | (required)                        |
| `AUTH_ALLOWED_HOSTS` | Additional allowed hostnames (comma-separated) | (none)                            |

`WILDCARD_DOMAINS` (existing, comma-separated) is also used: each entry
becomes a `*.{domain}:*` pattern for better-auth's dynamic base URL
resolution. In dev mode it defaults to `localhost`.

`AUTH_ALLOWED_HOSTS` is for single-instance hostnames that don't follow
the wildcard pattern (e.g., customer-controlled domains). The helm chart
can populate this from ingress configuration.

### Cookie Inventory

| Cookie                      | Set by         | Contents                     | Purpose                         |
| --------------------------- | -------------- | ---------------------------- | ------------------------------- |
| `better-auth.session_token` | better-auth    | Signed session token         | Session identity                |
| `better-auth.session_data`  | better-auth    | JWE-encrypted session + user | Stateless session cache         |
| `better-auth.account_data`  | better-auth    | Encrypted OAuth tokens       | Stores access/refresh/id tokens |
| `paths_api_sessionid`       | Django backend | Django session ID            | Ephemeral model state           |

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

Does not forward tokens to downstream services itself, but _does_
proactively refresh the access token before the RSC render runs (see
"Token Refresh" below). Also checks for the _existence_ of the session
cookie via `getSessionCookie(req)` and redirects to `/auth/sign-in` if
absent on protected instances. The existence check is optimistic — the
cookie is not validated, just detected.

## Token Refresh

OAuth access tokens expire. When expired, the backend 401s and the UI
breaks. We refresh proactively rather than reactively, in two places:

| Entry point    | Runs in                | Helper                             |
| -------------- | ---------------------- | ---------------------------------- |
| `src/proxy.ts` | Middleware (Node)      | `auth.api.getAccessToken` directly |
| `/api/graphql` | Route Handler          | `getFreshAccessToken()`            |
| RSC render     | React Server Component | `getAccessToken()` (**read-only**) |

### Why two entry points

- **Route handlers** can write cookies freely, so `/api/graphql` can
  delegate to `getFreshAccessToken()` which calls `auth.api.getAccessToken`.
  Better-auth's `nextCookies` plugin persists rotated tokens via
  `cookies().set()` in the response.
- **RSC cannot set cookies.** If RSC triggered a refresh, it would mint
  a new token with the IdP but be unable to persist the rotated cookie —
  which, with refresh-token rotation enabled on the IdP, would consume
  the one-shot refresh token and leave the browser holding a now-dead
  one. So RSC uses the read-only `getAccessToken()` helper, and the
  proxy runs the refresh beforehand.
- The proxy runs on every page / RSC request. For `/api/graphql` the
  proxy short-circuits (`NON_PAGE_PATHS`) — that's why the route
  handler needs its own refresh call.

### Proxy flow

`refreshAccessTokenIfNeeded(req, reqHeaders)` in `src/proxy.ts`:

1. Short-circuits if there's no `better-auth.session_token` cookie.
2. Calls `auth.api.getAccessToken({ body: { providerId }, headers,
returnHeaders: true })`. Better-auth checks `accessTokenExpiresAt`
   with a 5-second skew and refreshes via the IdP if near expiry.
3. Reads `result.headers.getSetCookie()` — rotated account cookies.
4. Merges rotated values into the downstream request's `Cookie`
   header (`mergeRequestCookies`) so the RSC render sees the fresh
   cookie via `next/headers` `cookies()`.
5. Appends each rotated `Set-Cookie` line to the final response so
   the browser persists the new state.

Skipped on `/auth/*` paths to avoid racing with the sign-in/out flow.

### Helpers (`src/lib/auth-server.ts`)

- `getAuthSession()` — reads the current session. No refresh.
- `getAccessToken()` — reads the access token from the session.
  **Read-only; safe in RSC.** Trusts the proxy to have refreshed first.
- `getFreshAccessToken()` — calls `auth.api.getAccessToken`, which
  refreshes via IdP if expired and persists via `nextCookies`. **Only
  call from contexts that can write cookies** (Route Handlers, Server
  Actions). Calling from RSC is unsafe — see rationale above.

### Failure modes and the rotation race

If the refresh token is expired or revoked, `auth.api.getAccessToken`
throws `FAILED_TO_GET_ACCESS_TOKEN`. We swallow the error (logged to
Sentry at debug level) and proceed. The user's next authenticated
request will surface the 401 or hit the sign-in gate.

**Multi-pod rotation race (accepted):** Pods have no stickiness, and
account state lives only in the cookie (no DB row to lock on). If two
requests concurrently hit different pods with the same expired-but-
refreshable token, both call the IdP's refresh endpoint. If the IdP
rotates refresh tokens (Keycloak's "Revoke Refresh Token" setting,
most OAuth providers' default), one refresh wins and the other's
rotated cookie ends up invalid on persist. Whichever `Set-Cookie`
reaches the browser last wins; the losing pod's response carries a
dead refresh token.

We accept this race because:

- The common case is cold-start — a single HTML request after idle
  time, then subsequent queries all go through `/api/graphql` where
  the route handler centralises refresh.
- When the race does trigger (parallel RSC subrequests, or tab
  reawakens mid-navigation), the user eats a re-auth. Annoying,
  not broken.
- The alternatives — DB-backed accounts with row locks, distributed
  Redis locks, or disabling refresh-token rotation at the IdP — are
  heavier than the problem warrants today.

If the re-auth frequency becomes a real complaint, the cheapest
escalation is to disable refresh-token rotation in the IdP; the
second-cheapest is to move accounts to the DB and serialise refreshes
with `SELECT ... FOR UPDATE`.

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
sets `request.user` directly on the request object _without_ calling
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

**Potential concern:** If the backend's auth middleware _does_ call
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
