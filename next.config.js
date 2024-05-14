import path from 'path';
import * as url from 'url';
import { createRequire } from 'module';
import webpack from 'webpack';
import { withSentryConfig } from '@sentry/nextjs';
import { secrets } from 'docker-secret';
import i18nConfig from './next-i18next.config.js';

const { i18n, SUPPORTED_LANGUAGES } = i18nConfig;

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));
const require = createRequire(import.meta.url);

const NEXT_PUBLIC_API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'https://api.paths.kausal.tech/v1';
const INSTANCE_IDENTIFIER = process.env.INSTANCE_IDENTIFIER;

const sentryAuthToken =
  secrets.SENTRY_AUTH_TOKEN || process.env.SENTRY_AUTH_TOKEN;

console.log(`
  ⚙ Kausal Paths UI
    ↝ Initialising app
      ↝ NODE_ENV: ${process.env.NODE_ENV}
      ↝ NEXT_PUBLIC_API_URL: ${process.env.NEXT_PUBLIC_API_URL}
      ↝ NEXT_PUBLIC_WILDCARD_DOMAINS: ${process.env.NEXT_PUBLIC_WILDCARD_DOMAINS}
  `);

function initializeThemes() {
  const destPath = path.join(__dirname, 'public', 'static', 'themes');
  const {
    generateThemeSymlinks: generateThemeSymlinksPublic,
  } = require('@kausal/themes/setup.cjs');
  generateThemeSymlinksPublic(destPath, { verbose: false });
  try {
    const {
      generateThemeSymlinks: generateThemeSymlinksPrivate,
    } = require('@kausal/themes-private/setup.cjs');
    generateThemeSymlinksPrivate(destPath, { verbose: false });
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
    graphqlUrl: `${NEXT_PUBLIC_API_URL}/graphql/`,
  },
  publicRuntimeConfig: {
    graphqlUrl: '/api/graphql',
    basePath: process.env.BASE_PATH,
    instanceIdentifier: INSTANCE_IDENTIFIER,
    sentryDsn: process.env.SENTRY_DSN,
    sentryDebug: process.env.SENTRY_DEBUG || '0',
    deploymentType: process.env.DEPLOYMENT_TYPE || 'development',
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
    styledComponents: true,
  },
  swcMinify: true,
  modularizeImports: {
    lodash: {
      transform: 'lodash/{{member}}',
    },
  },
  webpack: (cfg, context) => {
    const { isServer } = context;
    if (!isServer) {
      cfg.resolve.alias['next-i18next/serverSideTranslations'] = false;
      cfg.resolve.alias['./next-i18next.config'] = false;
      cfg.resolve.alias['v8'] = false;
      cfg.resolve.symlinks = true;
    }
    cfg.plugins.push(
      new webpack.DefinePlugin({
        __SENTRY_DEBUG__: process.env.SENTRY_DEBUG === '1',
      })
    );
    cfg.experiments = { ...cfg.experiments, topLevelAwait: true };
    return cfg;
  },
  swcMinify: true,
  reactStrictMode: true,
  experimental: {
    esmExternals: 'loose',
    runtime: 'nodejs',
    outputFileTracingIncludes: {
      '/': ['./node_modules/@kausal/themes*/**'],
    },
  },
  generateBuildId: async () => {
    if (process.env.NEXTJS_BUILD_ID) return process.env.NEXTJS_BUILD_ID;
    // If a fixed Build ID was not provided, fall back to the default implementation.
    return null;
  },
  // basePath: process.env.BASE_PATH,
  i18n,
};

const sentryWebpackPluginOptions = {
  silent: false,
  authToken: sentryAuthToken,
};

const sentryOptions = {
  transpileClientSDK: false,
  hideSourceMaps: false,
  automaticVercelMonitors: false,
};

// Make sure adding Sentry options is the last code to run before exporting, to
// ensure that your source maps include changes from all other Webpack plugins
export default withSentryConfig(
  nextConfig,
  sentryWebpackPluginOptions,
  sentryOptions
);
