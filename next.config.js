const SUPPORTED_LANGUAGES = ['en', 'fi', 'sv'];
const i18n = {
  defaultLocale: 'en',
  locales: SUPPORTED_LANGUAGES,
  localeDetection: false,
};

const path = require('path')
const { withSentryConfig } = require('@sentry/nextjs');
const { secrets } = require('docker-secret');

const DEFAULT_GRAPHQL_API_URL = process.env.DEFAULT_GRAPHQL_API_URL || 'https://api.paths.kausal.tech/v1/graphql/';
const INSTANCE_IDENTIFIER = process.env.INSTANCE_IDENTIFIER;

const sentryAuthToken = secrets.SENTRY_AUTH_TOKEN || process.env.SENTRY_AUTH_TOKEN;

/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  serverRuntimeConfig: {
    graphqlUrl: process.env.SERVER_GRAPHQL_API_URL || DEFAULT_GRAPHQL_API_URL,
  },
  publicRuntimeConfig: {
    graphqlUrl: process.env.BROWSER_GRAPHQL_API_URL || DEFAULT_GRAPHQL_API_URL,
    basePath: process.env.BASE_PATH,
    instanceIdentifier: INSTANCE_IDENTIFIER,
    sentryDsn: process.env.SENTRY_DSN,
  },
  sassOptions: {
    includePaths: [path.join(__dirname, 'styles')],
  },
  sentry: {
    // If SENTRY_AUTH_TOKEN is not set, disable uploading source maps to Sentry
    disableServerWebpackPlugin: !sentryAuthToken,
    disableClientWebpackPlugin: !sentryAuthToken,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.alias['next-i18next/serverSideTranslations'] = false;
    }
    return config;
  },
  webpack5: true,
  swcMinify: false,
  // basePath: process.env.BASE_PATH,
  i18n,
}

const sentryWebpackPluginOptions = {
  silent: true, // Suppresses all logs
  authToken: sentryAuthToken,
};

// Make sure adding Sentry options is the last code to run before exporting, to
// ensure that your source maps include changes from all other Webpack plugins
module.exports = withSentryConfig(nextConfig, sentryWebpackPluginOptions);
