import {
  BaseServer,
  BaseServerRequest,
  BaseServerResponse,
  deploymentType,
  RequestContext,
  InstanceNotFoundError,
} from './common.js';
import { gql } from '@apollo/client/index.js';

import type {
  GetAvailableInstancesQuery,
  GetAvailableInstancesQueryVariables,
} from 'common/__generated__/graphql.js';
import { ServerAuth } from './auth.js';

// FIXME: This duplicates code from src/utils/environment.ts, but I couldn't figure out how to import it without
// errors
const isLocal = process.env.NODE_ENV === 'development';
const wildcardDomains = process.env.NEXT_PUBLIC_WILDCARD_DOMAINS
  ? process.env.NEXT_PUBLIC_WILDCARD_DOMAINS.split(',').map((s) =>
      s.toLowerCase()
    )
  : isLocal
  ? ['localhost']
  : [];

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

  getApolloHeaders(req: BaseServerRequest) {
    const headers = super.getApolloHeaders(req);
    headers['x-paths-instance-hostname'] = req.currentURL.hostname;
    headers['x-wildcard-domains'] = wildcardDomains;
    return headers;
  }

  async getInstance(req: BaseServerRequest) {
    const { hostname } = req;
    const instance = this.instancesByHostname.get(hostname);
    if (instance) return instance;
    this.Sentry.setTag('hostname', hostname);
    const queryResp = await this.Sentry.startSpan(
      { name: 'get available instances' },
      async () => {
        return await this.apolloClient.query<
          GetAvailableInstancesQuery,
          GetAvailableInstancesQueryVariables
        >({
          query: GET_AVAILABLE_INSTANCES,
          variables: {
            hostname: hostname,
          },
          context: {
            headers: this.getApolloHeaders(req),
          },
          fetchPolicy: 'no-cache',
        });
      }
    );
    const { data } = queryResp;
    // FIXME: Support for multiple instances per hostname
    const numInstances = data.availableInstances.length;
    if (!numInstances) {
      throw new InstanceNotFoundError(
        `No instances found with the given hostname "${encodeURIComponent(
          hostname
        )}".`
      );
    }
    if (numInstances != 1) {
      throw new Error(`Invalid number of available instances: ${numInstances}`);
    }
    const ret = {
      ...data.availableInstances[0],
      serverAuth: null,
    };
    this.instancesByHostname.set(hostname, ret);
    return ret;
  }

  async getRequestContext(req: PathsRequest, res: BaseServerResponse) {
    const instance = await this.getInstance(req);
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
