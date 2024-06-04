import * as Sentry from '@sentry/nextjs';
import type { Integration } from '@sentry/types';

import { deploymentType, gqlUrl } from './environment';

export async function initSentry() {
  const integrations: Integration[] = [];
  /*
    if (process.env.NEXT_RUNTIME === 'nodejs') {
      integrations.push(nodeProfilingIntegration());
    }
    */
  Sentry.init({
    dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: deploymentType,
    // Adjust this value in production, or use tracesSampler for greater control
    tracesSampleRate: 1.0,
    tracePropagationTargets: ['localhost', gqlUrl],
    debug: process.env.SENTRY_DEBUG === '1',
    ignoreErrors: ['NEXT_NOT_FOUND'],
    integrations,
    sendDefaultPii: true,
    beforeSend: (event: Sentry.ErrorEvent, hint: Sentry.EventHint) => {
      const error: { statusCode?: number } = hint.originalException as any;
      console.log('send to sentry');
      return null;
      if (error && error.statusCode && error.statusCode === 404) {
        // eslint-disable-next-line no-console
        console.warn('Ignoring page-not-found error on the server');
        return null;
      }
      return event;
    },
    skipOpenTelemetrySetup: true,
  });
  return Sentry;
}
