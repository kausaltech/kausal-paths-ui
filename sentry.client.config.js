import * as Sentry from '@sentry/nextjs';
import { sentryDsn, deploymentType } from '@/common/environment';

Sentry.init({
  dsn: sentryDsn,
  integrations: [
    Sentry.replayIntegration({
      maskAllText: false,
      maskAllInputs: false,
      blockAllMedia: false,
    }),
    Sentry.browserTracingIntegration(),
    Sentry.browserProfilingIntegration(),
  ],
  debug: false,
  sendDefaultPii: true,
  tracesSampleRate: 1.0,
  profilesSampleRate: 1.0,
  replaysSessionSampleRate: 0.0,
  replaysOnErrorSampleRate: 1.0,
  tracePropagationTargets: ['localhost', `${process.env.NEXT_PUBLIC_API_URL}/graphql/`],
  environment: deploymentType,
});
