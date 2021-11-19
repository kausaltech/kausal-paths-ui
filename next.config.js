const SUPPORTED_LANGUAGES = ['en', 'fi', 'sv'];
const i18n = {
  defaultLocale: 'en',
  locales: SUPPORTED_LANGUAGES,
  localeDetection: false,
};

const path = require('path')
const { withSentryConfig } = require('@sentry/nextjs');

const DEFAULT_GRAPHQL_API_URL = process.env.DEFAULT_GRAPHQL_API_URL || 'https://api.paths.kausal.tech/v1/graphql/';
const INSTANCE_IDENTIFIER = process.env.INSTANCE_IDENTIFIER;

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
  },
  sassOptions: {
    includePaths: [path.join(__dirname, 'styles')],
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
  // Additional config options for the Sentry Webpack plugin. Keep in mind that
  // the following options are set automatically, and overriding them is not
  // recommended:
  //   release, url, org, project, authToken, configFile, stripPrefix,
  //   urlPrefix, include, ignore

  silent: true, // Suppresses all logs
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options.
};

// Make sure adding Sentry options is the last code to run before exporting, to
// ensure that your source maps include changes from all other Webpack plugins
module.exports = withSentryConfig(nextConfig, sentryWebpackPluginOptions);
