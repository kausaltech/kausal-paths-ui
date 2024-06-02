import pino, { Bindings, DestinationStream, Logger, LoggerOptions } from 'pino';
import { getOperationName } from '@apollo/client/utilities';
import { ApolloError, DocumentNode, OperationVariables } from '@apollo/client';
import { customAlphabet } from 'nanoid';

let rootLogger: Logger;

const LOG_MAX_ERRORS = 3;

export type ApolloErrorContext = {
  query: DocumentNode;
  variables?: OperationVariables;
  component?: string;
};

export function logApolloError(error: Error, context?: ApolloErrorContext, logger?: Logger) {
  const query = context?.query;
  const operationName = query ? getOperationName(query) : null;
  const variables = context?.variables ? JSON.stringify(context.variables) : null;

  const logCtx: Bindings = {};
  if (operationName) logCtx.graphql_operation = operationName;
  if (!logger) logger = getLogger('graphql', logCtx);
  let varCtx;
  if (variables) {
    varCtx = {
      variables,
    };
  } else {
    varCtx = {};
  }
  logger.error({ error, ...varCtx }, 'Error with graphql query');

  if (error instanceof ApolloError) {
    const { clientErrors, graphQLErrors, networkError } = error;
    if (clientErrors.length) {
      clientErrors.forEach((err, idx) => {
        if (idx >= LOG_MAX_ERRORS) return;
        logger.error(err, 'Client error');
      });
    }
    if (graphQLErrors.length) {
      graphQLErrors.forEach((err, idx) => {
        if (idx >= LOG_MAX_ERRORS) return;
        logger.error(err, 'GraphQL errors');
      });
    }
    if (networkError) {
      const message = networkError.message;
      const result = 'result' in networkError ? networkError.result : null;
      logger.error(networkError, `Network error: ${message}`);

      const errors: Error[] | null = result?.['errors'].length ? result['errors'] : null;
      if (errors) {
        errors.forEach((err, idx) => {
          if (idx >= LOG_MAX_ERRORS) return;
          logger.error(err, 'Network result errors');
        });
      } else if (result) {
        logger.error(result, 'Network result');
      }
    }
  }
}

function setupEdgeLogging(options: LoggerOptions) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const write = (obj) => {
    const { time, level, ...rest } = obj;
    const rec = {
      level,
      time: new Date(time).toISOString(),
      ...rest,
    };
    const logFunc = console[level] || console.log;
    try {
      logFunc(JSON.stringify(rec));
    } catch (err) {
      if (err instanceof Error) {
        // Without a `replacer` argument, stringify on Error results in `{}`
        console.log(JSON.stringify(err, ['name', 'message', 'stack']));
      } else {
        console.log(JSON.stringify({ message: 'Unknown error type' }));
      }
    }
  };
  options.browser = {
    formatters: {
      level: options.formatters!.level,
    },
    write,
  };
}

function initRootLogger() {
  const isProd = (process.env.NODE_ENV || 'development') == 'production';
  const isEdgeRuntime = process.env.NEXT_RUNTIME === 'edge';
  let stream: DestinationStream | undefined;
  const logLevel = process.env.LOG_LEVEL || (isProd ? 'info' : 'debug');
  const options: LoggerOptions = {
    level: logLevel,
    formatters: {},
    base: {},
  };
  if (
    process.env.PRODUCTION_LOG_MODE !== '1' &&
    process.env.NODE_ENV !== 'production' &&
    process.env.NEXT_RUNTIME === 'nodejs'
  ) {
    // Use pino-pretty for everything
    const pretty = require('pino-pretty'); // eslint-disable-line
    stream = pretty({ colorize: true });
    rootLogger = pino(options, stream);
    return rootLogger;
  }
  options.formatters!.level = (label, number) => ({ level: label });
  if (isEdgeRuntime) {
    setupEdgeLogging(options);
  } else {
    options.timestamp = () => `,"time":"${new Date(Date.now()).toISOString()}"`;
  }
  rootLogger = pino(options);
  return rootLogger;
}

export const getLogger = (name?: string, bindings?: Bindings) => {
  if (!rootLogger) {
    rootLogger = initRootLogger();
  }
  if (name) return rootLogger.child({ ...(bindings ?? {}), logger: name });
  return rootLogger;
};

const ID_ALPHABET = '346789ABCDEFGHJKLMNPQRTUVWXYabcdefghijkmnpqrtwxyz';
const nanoid = customAlphabet(ID_ALPHABET, 8);

export function generateCorrelationID() {
  return nanoid();
}
