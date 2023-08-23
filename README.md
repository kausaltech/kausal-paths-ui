This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Requirements

- Node 18
- yarn 3.2.4

## Getting Started

### Initial setup

1. Set the yarn version

   ```bash
   yarn set version 3.2.4
   ```

2. To get Kausal themes from the private registry when installing dependencies, create a `.yarnrc.yml` file with the following contents. Ask a teammate for the value of `npmAuthIdent`.

   ```yml
   npmScopes:
   kausal:
     npmAlwaysAuth: true
     npmAuthIdent: <SECRET>
     npmRegistryServer: 'https://npm.kausal.tech'
   ```

3. Configure yarn to install dependencies as regular `node_modules`

   ```
   yarn config set nodeLinker 'node-modules'
   ```

4. To run local development against the staging backend, create an `.env` file with the following env variable

   ```
   DEFAULT_GRAPHQL_API_URL=https://paths-api.staging.kausal.tech/v1/graphql/
   ```

### Running the local dev server

First, install the Node packages:

```bash
yarn install
```

Then you can start the development server:

```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Development

If you want to run the UI against your own backend, configure it in `.env.local`:

```
DEFAULT_GRAPHQL_API_URL=http://localhost:8000/v1/graphql/
```

## Sentry

When you call sentry-cli (which probably happens automatically when you deploy this project), you need to set an auth token. You can supply this in the environment variable `SENTRY_AUTH_TOKEN` or in a file called `.sentryclirc`, for example like this:

```
[auth]
token=your-auth-token
```
