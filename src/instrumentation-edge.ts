import type { ExportResult } from '@opentelemetry/core';
import type { ReadableSpan, SpanExporter } from '@opentelemetry/sdk-trace-base';
import type { VercelEdgeClient } from '@sentry/vercel-edge';

import { envToBool } from '@common/env/utils';
import { DebugSpanProcessor } from '@common/sentry/debug';

class _NullSpanExporter implements SpanExporter {
  export(_spans: ReadableSpan[], _resultCallback: (result: ExportResult) => void): void {
    return;
  }

  shutdown(): Promise<void> {
    return Promise.resolve();
  }
}

// eslint-disable-next-line @typescript-eslint/require-await
export async function initTelemetry(sentryClient: VercelEdgeClient) {
  const traceProvider = sentryClient.traceProvider!;
  const otelDebug = envToBool(process.env.OTEL_DEBUG, false);
  if (otelDebug) {
    traceProvider.addSpanProcessor(new DebugSpanProcessor());
  }
  /*
  const processorOpts = { timeout: sentryClient.getOptions().maxSpanWaitDuration };
  const spanProcessor = otelDebug ? new DebugSpanProcessor(processorOpts) : new SentrySpanProcessor(processorOpts);
  const propagator = otelDebug ? new DebugPropagator() : new SentryPropagator();
  const traceSampler = otelDebug ? new DebugSampler(sentryClient) : new SentrySampler(sentryClient);
  const contextManager = otelDebug ? getDebugContextManager(SentryContextManager) : new SentryContextManager();
  const config: Configuration = {
    serviceName: getProjectId(),
    attributes: {
      [ATTR_SERVICE_VERSION]: getBuildId(),
    },
    contextManager,
    spanProcessors: [spanProcessor],
    propagators: [propagator],
    traceSampler,
    traceExporter: new NullSpanExporter(),
  };
  registerOTel(config);
  */
}
