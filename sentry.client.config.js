import * as Sentry from '@sentry/nextjs';
//import getConfig from 'next/config';

//const { publicRuntimeConfig } = getConfig();
const publicRuntimeConfig = {};

const SENTRY_DSN =
  publicRuntimeConfig?.sentryDsn ||
  process.env.SENTRY_DSN ||
  process.env.NEXT_PUBLIC_SENTRY_DSN;
const DEPLOYMENT_TYPE =
  publicRuntimeConfig?.deploymentType ||
  process.env.DEPLOYMENT_TYPE ||
  'development';

Sentry.init({
  dsn: SENTRY_DSN,
  tracesSampleRate: 1.0,
  environment: DEPLOYMENT_TYPE,
});
