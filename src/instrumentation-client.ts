import * as Sentry from '@sentry/nextjs';

import { initSentryBrowser } from '@common/sentry/client-init';

function initSentry() {
  initSentryBrowser();
}
initSentry();

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
