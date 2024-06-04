import { PUBLIC_ENV_KEY } from 'next-runtime-env/build/script/constants';

type DeploymentType = 'production' | 'staging' | 'development' | 'testing' | 'wip';

const ENV_MAP = {
  DEPLOYMENT_TYPE: 'deploymentType',
  API_URL: 'apiUrl',
  WILDCARD_DOMAINS: 'wildcardDomains',
  AUTH_ISSUER: 'authIssuer',
  ASSET_PREFIX: 'assetPrefix',
  SENTRY_DSN: 'sentryDsn',
  BUILD_ID: 'buildId',
};

type RuntimeConfig = {
  isServer: boolean;
  deploymentType: DeploymentType;
  isDev: boolean;
  apiUrl: string;
  gqlUrl: string;
  wildcardDomains: string[];
  assetPrefix: string;
  authIssuer?: string;
  logGraphqlQueries: boolean;
  runtimeEnv: 'nodejs' | 'edge';
  sentryDsn?: string;
};

export const isServer = typeof window === 'undefined';

function getEnv(key: keyof typeof ENV_MAP) {
  if (!(key in ENV_MAP)) {
    throw new Error(`Invalid environment variable: ${key}`);
  }
  const prefixedKey = `NEXT_PUBLIC_${key}`;
  if (isServer) {
    return process.env[key] ?? process.env[prefixedKey];
  }
  const env = window[PUBLIC_ENV_KEY] as object | undefined;
  if (!env) {
    return undefined;
  }
  return env[key];
}

export const deploymentType: DeploymentType = (getEnv('DEPLOYMENT_TYPE') ||
  'development') as DeploymentType;

export const isDev = process.env.NODE_ENV === 'development';
export const isProd = !isDev;

export const apiUrl = getEnv('API_URL') || 'https://api.paths.kausal.tech/v1';

export const WILDCARD_DOMAINS = getEnv('WILDCARD_DOMAINS');
export const wildcardDomains = WILDCARD_DOMAINS
  ? WILDCARD_DOMAINS.split(',').map((s) => s.toLowerCase())
  : isDev
    ? ['localhost']
    : [];

export const gqlUrl = `${apiUrl}/graphql/`;
export const sentryDsn = getEnv('SENTRY_DSN');
export const buildId = getEnv('BUILD_ID');
export const authIssuer = getEnv('AUTH_ISSUER');
export const logGraphqlQueries = isServer && process.env.LOG_GRAPHQL_QUERIES === 'true';

export const assetPrefix = getEnv('ASSET_PREFIX') || '';
if (assetPrefix.endsWith('/')) {
  throw new Error("ASSET_PREFIX must not end with '/'");
}

export function exportRuntimeConfig() {
  return Object.fromEntries(
    Object.keys(ENV_MAP).map((key: keyof typeof ENV_MAP) => {
      return [key, getEnv(key)];
    })
  );
}

export function getRuntimeConfig() {
  const config: RuntimeConfig = {
    isServer,
    deploymentType,
    isDev,
    apiUrl,
    gqlUrl,
    wildcardDomains,
    authIssuer,
    logGraphqlQueries,
    runtimeEnv: process.env.NEXT_RUNTIME as RuntimeConfig['runtimeEnv'],
    sentryDsn,
    assetPrefix,
  };
  return config;
}

export function printRuntimeConfig() {
  const p = (s: string) => (s + ':').padEnd(22);
  console.log(`Kausal Paths UI (build ${process.env.BUILD_ID}) starting\n`);
  console.log(p('Node environment'), process.env.NODE_ENV);
  console.log(p('Deployment type'), deploymentType);
  console.log(p('GraphQL backend URL'), gqlUrl);
  console.log(p('Wildcard domains'), wildcardDomains.join(', '));
  console.log(p('OIDC auth issuer'), authIssuer);
  console.log(p('Sentry DSN'), sentryDsn);
  console.log(p('Asset prefix'), assetPrefix);
}
