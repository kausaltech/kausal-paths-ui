const path = require('path')
const { withSentryConfig } = require('@sentry/nextjs');
const { secrets } = require('docker-secret');
const { i18n, SUPPORTED_LANGUAGES } = require('./next-i18next.config');

const DEFAULT_GRAPHQL_API_URL = process.env.DEFAULT_GRAPHQL_API_URL || 'https://api.paths.kausal.tech/v1/graphql/';
const INSTANCE_IDENTIFIER = process.env.INSTANCE_IDENTIFIER;

const sentryAuthToken = secrets.SENTRY_AUTH_TOKEN || process.env.SENTRY_AUTH_TOKEN;

function initializeThemes() {
  const destPath = path.join(__dirname, 'public', 'static', 'themes');
  const { generateThemeSymlinks: generateThemeSymlinksPublic } = require('@kausal/themes');
  generateThemeSymlinksPublic(destPath, { verbose: true });
  try {
    const { generateThemeSymlinks: generateThemeSymlinksPrivate } = require('@kausal/themes-private');
    generateThemeSymlinksPrivate(destPath, { verbose: true });
  } catch (error) {
    console.error(error);
  }
}

initializeThemes();


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
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  productionBrowserSourceMaps: true,
  compiler: {
    // Enables the styled-components SWC transform
    styledComponents: true
  },
  swcMinify: true,
  experimental: {
    modularizeImports: {
      lodash: {
        transform: 'lodash/{{member}}',
      },
    },
  },
  webpack: (cfg, { isServer }) => {
    if (!isServer) {
      cfg.resolve.alias['next-i18next/serverSideTranslations'] = false;
      cfg.resolve.alias['./next-i18next.config'] = false;
      cfg.resolve.symlinks = true;
    }
    return cfg;
  },
  swcMinify: true,
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
