# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

Kausal Paths UI is the public-facing Next.js front-end for Kausal Paths, a climate action planning tool that predicts future emissions for cities and regions. It visualizes node-based emission calculations, scenarios, and action impacts via a GraphQL API served by the [Django backend](https://github.com/kausaltech/kausal-paths).

## Development Commands

### Setup

```bash
nvm use           # Node 24 (see .nvmrc)
pnpm install      # Install dependencies
```

### Day-to-Day

```bash
pnpm dev                    # Next.js dev server
pnpm build                  # Production build
pnpm graphql-codegen        # Regenerate GraphQL types from backend schema
```

### Quality Checks

```bash
pnpm lint:baseline          # ESLint (against suppressed baseline)
pnpm typecheck:baseline     # TypeScript (against suppressed baseline)
pnpm prettier:fix           # Format all files
```

Both linting and typechecking use baseline files (`eslint-baseline.json`, `tsc-baseline.json`) so only new errors are surfaced. Update baselines with `:update` variants.

TypeScript should be run with `tsc -b` (composite project build), not `tsc --noEmit`. The repo uses composite tsconfig references across the main app, `kausal_common/`, and `e2e-tests/`.

### E2E Tests

E2E tests live in `e2e-tests/` as a separate pnpm workspace with Playwright. They have their own `package.json` and `tsconfig.json`.

## Architecture

### Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript (strict, with baseline suppression for legacy errors)
- **GraphQL**: Apollo Client 3 with `@graphql-codegen` for type generation
- **Styling**: Emotion (styled components) + MUI 7 + Bootstrap 5 / Reactstrap + Sass
- **i18n**: next-intl (locales: en, fi, sv, de, de-CH, cs, da, lv, pl, es-US, el)
- **Charting**: ECharts, Plotly, custom graph components (Cytoscape, @xyflow/react)
- **Monitoring**: Sentry + OpenTelemetry
- **Package manager**: pnpm 10

### Project Structure

```
src/
  app/                 # Next.js App Router
    api/               # Route Handlers (graphql, health, sentry, auth)
    root/[domain]/[lang]/  # Instance-scoped routes (domain + locale from proxy)
      (with-layout)/   # Routes with shared navigation layout
      model/           # Model visualization
      model-editor/    # Trailhead graph editor
  proxy.ts             # Request interceptor (Next.js 16 "proxy", replaces middleware)
  components/
    general/           # Core visualization & UI components
    charts/            # Chart components
    scenario/          # Scenario selection & comparison
    providers/         # React context providers (Apollo, Instance, Theme)
    pages/             # Page-level layout components
    common/            # Shared UI primitives
    flow/              # Node graph flow visualization (React Flow / Trailhead)
  queries/             # GraphQL query/fragment definitions
  context/             # React contexts (site config, numbers)
  common/              # Shared utilities, constants, generated types
    __generated__/     # GraphQL codegen output (do not edit)
  data/                # Data processing utilities
  i18n/                # Internationalization message loading
  utils/               # General utilities
  middleware/          # Proxy helpers (instance resolution)
kausal_common/         # Shared code (git submodule) with common configs
e2e-tests/             # Playwright E2E tests (separate workspace)
```

### Key Patterns

**Multi-Instance Architecture**: The app serves many city/region instances from one codebase. Instance identity is resolved via hostname in `src/proxy.ts` (Next.js 16 renamed middleware to "proxy"). The proxy sets request headers (`x-paths-instance-identifier`, etc.) that downstream layouts and Apollo Client consume. Routes are rewritten to `/root/{hostname}/{locale}/...` for the App Router. The `SiteContext` (`src/context/site.tsx`) holds instance-specific configuration including scenarios, parameters, years, and localisation.

**GraphQL**: All data comes from the Paths backend GraphQL API. Queries live in `src/queries/`. Types are generated into `src/common/__generated__/graphql.ts` — run `pnpm graphql-codegen` after schema changes. The backend URL defaults to `https://api.paths.kausal.dev/v1/graphql/` and can be overridden with `PATHS_BACKEND_URL`.

**Shared Code**: `kausal_common/` is a git submodule containing shared ESLint, Prettier, TypeScript, and Next.js configurations, plus common React components and utilities. Config files at the repo root (`eslint.config.mjs`, `prettier.config.mjs`, `next.config.ts`) delegate to it.

**Theming**: Uses `@kausal/themes` (public) and optionally `@kausal-private/themes-private` for customer-specific themes. Themes are initialised at build time in `next.config.ts`.

### Important Environment Variables

- `PATHS_BACKEND_URL` — Backend base URL (e.g. `http://localhost:8000`)
- `ANALYZE_BUNDLE=1` — Enable webpack bundle analyzer

## Code Conventions

- Pre-commit hook runs lint-staged: Prettier + ESLint baseline + TypeScript baseline on staged files
- Path aliases: `@/*` → `src/*`, `@common/*` → `kausal_common/src/*`
- App Router routes under `src/app/root/[domain]/[lang]/`; route groups like `(with-layout)` for shared UI
- GraphQL queries use codegen — never hand-write types for API responses
- Prefer Emotion styled components for new styling; Sass/Bootstrap exist for legacy reasons
- Icons: use `react-bootstrap-icons` (not `@mui/icons-material`) for consistency with the rest of the app
- React 19 with the React Compiler babel plugin enabled
