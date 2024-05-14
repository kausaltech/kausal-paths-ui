import Sentry from '@sentry/nextjs';
import { ProfilingIntegration } from '@sentry/profiling-node';

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn: SENTRY_DSN,
  tracesSampleRate: 1.0,
  tracePropagationTargets: [
    'localhost',
    `${process.env.NEXT_PUBLIC_API_URL}/graphql/`,
  ],
  profilesSampleRate: 1.0,
  maxBreadcrumbs: 50,
  environment: process.env.DEPLOYMENT_TYPE || 'development',
  debug: process.env.SENTRY_DEBUG === '1',
  integrations: [new ProfilingIntegration()],
  sendDefaultPii: true,
  beforeSend: (event, hint) => {
    const error = hint.originalException;
    if (error && error.statusCode && error.statusCode === 404) {
      // eslint-disable-next-line no-console
      console.warn('Ignoring page-not-found error on the server');
      return null;
    }
    console.log('sending event to sentry');
    return event;
  },
});
