import * as Sentry from '@sentry/nextjs';
import pino from 'pino';

import { isDev } from '@/common/environment';

function loggerMixin(mergeObject: object, level: number, logger: pino.Logger) {
  if (!Sentry.getClient()) {
    return {};
  }
  const scope = Sentry.getIsolationScope();
  const session = scope.getPropagationContext();
  return { requestId: session.traceId };
}

function createLogger() {
  if (isDev && process.env['KUBERNETES_LOGGING'] !== '1') {
    return pino({
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
        },
      },
      mixin: loggerMixin,
      level: 'debug',
    });
  }
  return pino({
    level: 'debug',
    formatters: {
      level(label, number) {
        return { level: label };
      },
    },
    timestamp: pino.stdTimeFunctions.isoTime,
  });
}

const logger = createLogger();

export default logger;
