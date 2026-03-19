# AGENTS.md

## Cursor Cloud specific instructions

### Services overview

This is a **single-product frontend-only** repository (Kausal Paths UI — a Next.js 15 app). The only external dependency is the Kausal Paths Django/GraphQL backend; a public dev API at `https://api.paths.kausal.dev` is used by default so no local backend setup is needed.

### Running the dev server

See `CLAUDE.md` and `README.md` for standard commands (`pnpm dev`, `pnpm build`, quality checks, etc.).

Key caveats:

- The `kausal_common` git submodule **must** be initialized (`git submodule update --init`) before any build or dev command will work — configs like `eslint.config.mjs`, `next.config.ts`, and `prettier.config.mjs` import from it.
- The app uses multi-instance hostname routing. In local dev, `WILDCARD_DOMAINS` defaults to `localhost`. Access the app via `http://sunnydale.localhost:3000` (or another valid instance subdomain). A plain `http://localhost:3000` request will return a 404 because no instance matches.
- `@kausal-private/themes-private` is in `optionalDependencies` and may or may not be available. The app falls back to public themes and works fine without it.

### Quality checks

- `pnpm lint:baseline` — ESLint (baseline-suppressed; only new errors surface)
- `pnpm typecheck:baseline` — TypeScript (baseline-suppressed; only new errors surface)
- `pnpm prettier:fix` — format all files

### Node version

`.nvmrc` specifies Node 25. Use `nvm use` (after `nvm install 25` if needed). pnpm 10 is managed via corepack (`corepack enable`).
