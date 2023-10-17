This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

### Initial setup

1. Install nvm if you don't have it yet.
2. Activate the right node version

   ```bash
   nvm use
   ```

3. Make sure the npm version is controlled with corepack:

```bash
corepack enable npm
```

3. If you need access to the Kausal private themes, login to https://npm.kausal.tech
   using your Google credentials, copy the line with `npm config set ...` from
   the settings dialog, and execute it in your shell. Ensure the `@kausal` scope
   is associated with that registry by running:

```bash
echo '@kausal:registry=https://npm.kausal.tech/' >> ~/.npmrc
```

4. Install dependencies:

```bash
npm i
```

5. To run local development against the staging backend, create an `.env` file with the following env variable set to the staging GraphQL API URL. Ask a teammate for this value.

   ```
   DEFAULT_GRAPHQL_API_URL=
   ```

### Running the local dev server

Start the development server with:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Development

If you want to run the UI against your own backend, configure it in `.env`:

```
DEFAULT_GRAPHQL_API_URL=http://localhost:8000/v1/graphql/
```

## Sentry

When you call sentry-cli (which probably happens automatically when you deploy this project), you need to set an auth token. You can supply this in the environment variable `SENTRY_AUTH_TOKEN` or in a file called `.sentryclirc`, for example like this:

```
[auth]
token=your-auth-token
```
