import { printRuntimeConfig } from './common/environment';
import { initSentry } from './common/sentry';

//import { nodeProfilingIntegration } from '@sentry/profiling-node';
//import { getLogger } from './common/log';

//const logger = getLogger('init');

//logger.info({ config: getRuntimeConfig() }, 'Initializing app');

export const register = async () => {
  if (process.env.NEXT_RUNTIME === 'edge' || process.env.NEXT_RUNTIME === 'nodejs') {
    initSentry();
  }
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    printRuntimeConfig();
    await import('./instrumentation-node');
  }
};
