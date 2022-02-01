This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

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
