import { Request } from 'express';
import {
  BaseServer,
  BaseServerRequest,
  BaseServerResponse,
  deploymentType,
  RequestContext,
} from './common.js';
import { gql } from '@apollo/client/index.js';

import type {
  GetAvailableInstancesQuery,
  GetAvailableInstancesQueryVariables,
} from 'common/__generated__/graphql.js';
import { ServerAuth } from './auth.js';

const GET_AVAILABLE_INSTANCES = gql`
  query GetAvailableInstances($hostname: String!) {
    availableInstances(hostname: $hostname) {
      ...AvailableInstance
    }
  }
  fragment AvailableInstance on InstanceBasicConfiguration {
    identifier
    isProtected
    defaultLanguage
    themeIdentifier
    supportedLanguages
    hostname {
      basePath
    }
  }
`;

type InstanceConfig = GetAvailableInstancesQuery['availableInstances'][0] & {
  serverAuth: ServerAuth | null;
};

type PathsRequest = BaseServerRequest & {
  instanceConfig: InstanceConfig;
};

class PathsServer extends BaseServer {
  instancesByHostname: Map<string, InstanceConfig>;

  constructor() {
    super();
    this.name = `paths-ui-${deploymentType}`;
    this.instancesByHostname = new Map();
  }

  async getInstance(req: Request, res: BaseServerResponse) {
    const { hostname } = req;
    const instance = this.instancesByHostname.get(hostname);
    if (instance) return instance;

    try {
      const { data } = await this.apolloClient.query<
        GetAvailableInstancesQuery,
        GetAvailableInstancesQueryVariables
      >({
        query: GET_AVAILABLE_INSTANCES,
        variables: {
          hostname: hostname,
        },
        fetchPolicy: 'no-cache',
      });
      // FIXME: Support for multiple instances per hostname
      const numInstances = data.availableInstances.length;
      if (!numInstances) {
        console.log(
          `No instances found with the given hostname "${encodeURIComponent(
            hostname
          )}".`
        );
        return null;
      }
      if (numInstances != 1) {
        throw new Error(
          `Invalid number of available instances: ${numInstances}`
        );
      }
      const instance = {
        ...data.availableInstances[0],
        serverAuth: null,
      };
      this.instancesByHostname.set(hostname, instance);
      return instance;
    } catch (error) {
      console.error(error);
      this.Sentry.withScope((scope) => {
        scope.setTag('hostname', hostname);
        this.Sentry.captureException(error);
      });

      let message: string;
      if (this.dev) {
        message = error.toString() + '\n' + error.stack;
      } else {
        message = 'Unknown hostname';
      }
      res.status(404).send(message);
      return null;
    }
  }

  async getRequestContext(req: PathsRequest, res: BaseServerResponse) {
    const instance = await this.getInstance(req, res);
    if (!instance) return null;

    const basePath = instance.hostname?.basePath || '';
    const ctx: RequestContext = {
      basePath,
      defaultLanguage: instance.defaultLanguage,
      supportedLanguages: instance.supportedLanguages,
      isProtected: instance.isProtected,
      other: {
        instanceConfig: instance,
      },
      identifier: instance.identifier,
    };
    return ctx;
  }

  getRequestAuth(req: PathsRequest, res: BaseServerResponse) {
    let auth = req.instanceConfig.serverAuth;
    if (!auth && this.authIssuer) {
      auth = new ServerAuth(
        this,
        req,
        req.instanceConfig.identifier,
        this.authIssuer!
      );
      req.instanceConfig.serverAuth = auth;
    }
    return auth;
  }
}

const pathsServer = new PathsServer();

pathsServer.init().then(() => {
  console.log('> Init done');
});
