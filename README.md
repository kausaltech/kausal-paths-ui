This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

### Initial setup and subsequent updates

1. Install nvm if you don't have it yet.
2. Activate the right node version (you can do all steps from 2 to 5 to make sure that the update does not fail).

```bash
nvm use
```

3. Make sure the npm version is controlled with corepack:

```bash
corepack enable npm
```

4. If you need access to the Kausal private themes:

4.1. remove the cookie(s) with npm.kausal.tech from your browser's cookie history.

4.2. login to https://npm.kausal.tech
using your Google credentials, copy the line with `npm config set ...` from
the settings dialog, and execute it in your shell. Ensure the `@kausal` scope
is associated with that registry by running:

```bash
echo '@kausal:registry=https://npm.kausal.tech/' >> ~/.npmrc
```

5. Install dependencies:

```bash
npm i
```

Make sure that your installation does not give errors about missing files. If it does, there is probably something wrong in step 4.

6. To run local development against the staging backend, create an `.env` file with the following env variable set to the staging GraphQL API URL. Ask a teammate for this value.

```
NEXT_PUBLIC_API_URL=
```

TODO: Explain `NEXT_PUBLIC_WILDCARD_DOMAINS`.

### Running the local dev server

Start the development server with:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result. Note: The address mentioned may differ depending on the instance you are using. For example, it could be something like `http://sunnydale.localhost:3000`.

## Development

If you want to run the UI against your own backend, configure it in `.env`:

```
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/v1
```

## Deployment

GitHub actions are configured to handle continuous deployment when `deployment/*` branches are updated.
To avoid merge conflicts and ensure deployment branches stay up to date with `main`, you can push `main` directly to the deployment branch via:

```bash
git push origin main:deployment/testing
```

Swap `deployment/testing` out for any of the following depending on the environment you want to update:

- `deployment/production`: The production environment used by customers and end users
- `deployment/testing`: The test environment used by customers and end users
- `deployment/staging`: The staging environment primarily used by Kausal, this can be used as a playground and doesn't need to be stable.

## Sentry

When you call sentry-cli (which probably happens automatically when you deploy this project), you need to set an auth token. You can supply this in the environment variable `SENTRY_AUTH_TOKEN` or in a file called `.sentryclirc`, for example like this:

```
[auth]
token=your-auth-token
```
