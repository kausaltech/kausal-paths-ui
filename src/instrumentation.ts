import type { VercelEdgeClient } from '@sentry/nextjs';
import type { NodeClient } from '@sentry/node';

import { getRuntimeConfig, printRuntimeConfig } from '@common/env/runtime';
import { initRootLogger } from '@common/logging/logger';
import { getSpotlightViewUrl, initSentry } from '@common/sentry/server-init';

export const register = async () => {
  await initRootLogger();
  const sentryClient = await initSentry();
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const runtimeConfig = getRuntimeConfig();
    if (runtimeConfig.isLocal) {
      printRuntimeConfig('Kausal Paths UI');
      const spotlightUrl = getSpotlightViewUrl();
      if (spotlightUrl) {
        console.log(`🔦 Sentry Spotlight enabled at: ${spotlightUrl}`);
      }
    }
    const nodeOtel = await import('./instrumentation-node');
    await nodeOtel.initTelemetry(sentryClient as NodeClient);
  } else {
    const edgeOtel = await import('./instrumentation-edge');
    await edgeOtel.initTelemetry(sentryClient as VercelEdgeClient);
  }
};
