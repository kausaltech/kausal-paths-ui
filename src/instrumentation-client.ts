import { initSentryBrowser } from '@common/sentry/client-init';

function initSentry() {
  const { initSpotlight } = initSentryBrowser();
  initSpotlight();
}
initSentry();
