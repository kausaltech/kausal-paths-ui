# Trailhead Auth MVP

First deliverable for the Trailhead self-service flow. Target: demo-ready
by 2026-04-22 (data science team presentation).

## Context: Climate-4-CAST and the CADS Tool

Trailhead is the self-service entry point for the **CADS Tool** (Climate
Action Decision Support), developed under the EU **Climate-4-CAST (C4C)**
project. CADS helps cities assess the emission and economic impacts of
climate actions, build transparent emission scenarios, and integrate
climate considerations into decision-making.

Core capabilities:

1. **Modelling and comparing** the impacts of climate actions — emission
   reductions, costs, and monetisable benefits
2. **Visualising** city-level emission development under different
   scenarios, showing progress toward climate targets and remaining gaps

Six pilot cities co-develop the tool: Aarhus, Bytom, Norderstedt,
Östersund, Riga, and Tampere. The tool bridges climate specialists and
decision-makers through accessible visualisation and economic impact
assessment.

The framework identifier for CADS instances is `cads`.

## What We're Building

A UX where users can:

1. **Self-register** an account (via GraphQL mutation + OIDC login)
2. **Log in** via OIDC (Kausal backend is the IdP)
3. **Create a new model instance** (calls `createFrameworkConfig` mutation)
4. **Invite other users** by email address to edit that instance

All Trailhead instances share a single brand theme. Instances are **not**
viewable by unauthenticated users.

## Architecture Decisions

### Authentication: better-auth with generic OAuth

We use [better-auth](../../../devel/oss/better-auth) instead of next-auth.

- **Generic OAuth plugin** connects to the Kausal OIDC IdP
  (see `../../../devel/oss/better-auth/docs/content/docs/plugins/generic-oauth.mdx`)
- **Stateless sessions** via JWE cookie cache — no Redis or database needed
  for the UI pods
  (see `../../../devel/oss/better-auth/docs/content/docs/concepts/session-management.mdx`)
- **Next.js integration** via `toNextJsHandler` for the App Router route handler
  (see `../../../devel/oss/better-auth/docs/content/docs/integrations/next.mdx`)

The Kausal backend serves as the OIDC Identity Provider, same as in
Kausal Watch. Reference implementation:
`../../kausal-watch-ui/src/config/auth.ts` (uses next-auth — we're replacing
the client library but the IdP interaction is the same).

**IdP details:**

- Discovery URL: `{AUTH_ISSUER}/.well-known/openid-configuration`
- `AUTH_ISSUER` env var defaults to `PATHS_BACKEND_URL`
  (see `kausal_common/src/env/runtime.ts`)
- Needs `AUTH_CLIENT_ID` and `AUTH_CLIENT_SECRET` env vars

### User Registration

The IdP does not have a self-registration UI. Registration is handled
via a GraphQL mutation on the backend (needs to be implemented). The
flow is:

1. User fills registration form in Trailhead
2. Frontend calls registration mutation (creates account on backend)
3. Frontend initiates OIDC login flow (user is now a known account)
4. User arrives back authenticated

This is faster to implement than adding `django-registration` to the
backend and templating the IdP login page — and gives us full control
over the registration UX.

### Route Protection

The Next.js 16 proxy (`src/proxy.ts`) already handles instance routing.
Auth gating goes here: check for the session cookie and redirect to
sign-in if absent. The proxy runs on every request, so this is the
natural enforcement point.

For authenticated requests, the id_token from the session must be passed
as a Bearer token in the Authorization header to the GraphQL backend
(Apollo Client already supports this path — see `ApolloWrapper`).

### App Router

This branch uses the **Next.js 16 App Router** (not Pages Router). Key
structural notes:

- Routes live under `src/app/root/[domain]/[lang]/`
- `src/proxy.ts` (not middleware.ts) handles request interception —
  Next.js 16 renamed middleware to "proxy"
- API routes use Route Handlers (`src/app/api/*/route.ts`)
- The better-auth handler goes at `src/app/api/auth/[...all]/route.ts`

### GraphQL Schema

Relevant existing mutations (in `schema.graphql`):

```graphql
createFrameworkConfig(
  baselineYear: Int!
  frameworkId: ID!
  instanceIdentifier: ID!
  name: String!
  organizationName: String = null
  uuid: UUID = null
): CreateFrameworkConfigMutation

updateFrameworkConfig(id: ID!, ...): UpdateFrameworkConfigMutation
deleteFrameworkConfig(id: ID!): DeleteFrameworkConfigMutation
```

**Not yet in schema** (need backend work):

- User self-registration mutation
- User invitation mutation (accept email, grant instance access)

Backend repo: `../../kausal-paths`

## Implementation Layers

### Layer 1: Auth Plumbing (unblocks everything)

- Install better-auth
- Configure generic OAuth plugin pointing at Kausal IdP
- Set up stateless JWE session (cookie cache)
- Create Route Handler at `src/app/api/auth/[...all]/route.ts`
- Wire session id_token into Apollo Client Authorization header
- Add auth gate in `src/proxy.ts`
- Create sign-in page (redirects to IdP)

### Layer 2: Core Demo Flow

- Registration page + backend mutation
- Instance creation form (calls `createFrameworkConfig` with
  `frameworkId: "cads"`)
- Instance list / dashboard for authenticated users
- Unified brand theme (may mean removing per-instance theme switching
  for Trailhead instances)

### Layer 3: Collaboration (needs backend mutations)

- User invitation UI (email input + mutation call)
- Backend mutation for invitation (create user, grant instance access,
  send email)

## Open Questions

- What scopes/claims does the IdP return? (need at minimum: sub, email,
  name)
- For invitations: does the backend send the email, or do we?
