import type { VercelEdgeClient } from '@sentry/nextjs';
import { captureRequestError } from '@sentry/nextjs';
import type { NodeClient } from '@sentry/node';

import { getRuntimeConfig, printRuntimeConfig } from '@common/env/runtime';
import { getLogger, initRootLogger } from '@common/logging/logger';
import { getSpotlightViewUrl, initSentry } from '@common/sentry/server-init';

export const register = async () => {
  if (!process.env.PROJECT_ID) {
    process.env.PROJECT_ID = 'paths-ui';
  }
  await initRootLogger();
  const logger = getLogger('init');
  const sentryClient = await initSentry();
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    printRuntimeConfig('Kausal Paths UI');
    const spotlightUrl = getSpotlightViewUrl();
    if (spotlightUrl && sentryClient) {
      logger.info(
        { release: sentryClient.getOptions().release },
        `🔦 Sentry Spotlight enabled at: ${spotlightUrl}`
      );
    }
    const nodeOtel = await import('./instrumentation-node');
    await nodeOtel.initTelemetry(sentryClient as NodeClient);
  } else {
    const edgeOtel = await import('./instrumentation-edge');
    await edgeOtel.initTelemetry(sentryClient as VercelEdgeClient);
  }
};

export const onRequestError = captureRequestError;
