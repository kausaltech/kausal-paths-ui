import * as Sentry from '@sentry/nextjs';
import getConfig from 'next/config';

const { publicRuntimeConfig } = getConfig();

const SENTRY_DSN =
  publicRuntimeConfig?.sentryDsn ||
  process.env.SENTRY_DSN ||
  process.env.NEXT_PUBLIC_SENTRY_DSN;
const DEPLOYMENT_TYPE =
  publicRuntimeConfig?.deploymentType ||
  process.env.DEPLOYMENT_TYPE ||
  'development';

const SENTRY_DEBUG = publicRuntimeConfig?.sentryDebug === '1';

Sentry.init({
  dsn: SENTRY_DSN,
  integrations: [
    new Sentry.Replay({
      maskAllText: false,
      maskAllInputs: false,
      blockAllMedia: false,
    }),
    new Sentry.BrowserTracing(),
    new Sentry.BrowserProfilingIntegration(),
  ],
  debug: SENTRY_DEBUG,
  sendDefaultPii: true,
  tracesSampleRate: 1.0,
  profilesSampleRate: 1.0,
  replaysSessionSampleRate: 0.0,
  replaysOnErrorSampleRate: 1.0,
  tracePropagationTargets: [
    'localhost',
    `${process.env.NEXT_PUBLIC_API_URL}/graphql/`,
  ],
  environment: DEPLOYMENT_TYPE,
});
