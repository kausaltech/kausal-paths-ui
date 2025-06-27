// @ts-check
import { mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import * as url from 'node:url';

import { withSentryConfig } from '@sentry/nextjs';
import { secrets } from 'docker-secret';
import lockfile from 'proper-lockfile';

import i18nConfig from './next-i18next.config.js';

const { i18n } = i18nConfig;

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));
const require = createRequire(import.meta.url);

const isProd = process.env.NODE_ENV === 'production';

const sentryAuthToken = secrets.SENTRY_AUTH_TOKEN || process.env.SENTRY_AUTH_TOKEN;

const standaloneBuild = process.env.NEXTJS_STANDALONE_BUILD === '1';

async function initializeThemes() {
  const staticPath = path.join(__dirname, 'public', 'static');
  await mkdir(staticPath, { recursive: true });
  const releaseThemeLock = await lockfile.lock('public/static');
  try {
    const destPath = path.join(__dirname, 'public', 'static', 'themes');
    let themesLinked = false;
    try {
      const {
        generateThemeSymlinks: generateThemeSymlinksPrivate,
      } = require('@kausal-private/themes-private/setup.cjs');
      generateThemeSymlinksPrivate(destPath, { verbose: false });
      themesLinked = true;
    } catch (error) {
      if (error.code !== 'MODULE_NOT_FOUND') {
        console.error(error);
        throw error;
      }
    }
    if (!themesLinked) {
      console.log('Private themes not found; using public themes');
      const {
        generateThemeSymlinks: generateThemeSymlinksPublic,
      } = require('@kausal/themes/setup.cjs');
      generateThemeSymlinksPublic(destPath, { verbose: false });
    }
  } finally {
    await releaseThemeLock();
  }
}

initializeThemes();

const prodAssetPrefix = process.env.NEXTJS_ASSET_PREFIX;
const sentryDebug = !isProd || process.env.SENTRY_DEBUG === '1';

/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  assetPrefix: isProd ? prodAssetPrefix : undefined,
  sassOptions: {
    includePaths: [path.join(__dirname, 'styles')],
  },
  output: standaloneBuild ? 'standalone' : undefined,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
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
    const { isServer, webpack } = context;
    if (!isServer) {
      cfg.resolve.alias['next-i18next/serverSideTranslations'] = false;
      cfg.resolve.alias['./next-i18next.config'] = false;
      cfg.resolve.alias['v8'] = false;
      cfg.resolve.symlinks = true;
    } else {
      cfg.resolve.extensionAlias = {
        '.js': ['.ts', '.js'],
      };
      cfg.optimization = {
        ...cfg.optimization,
        minimize: false,
      };
    }
    const defines = {
      'globalThis.__DEV__': isProd ? 'false' : 'true',
    };
    cfg.plugins.push(new webpack.DefinePlugin(defines));
    return cfg;
  },
  reactStrictMode: true,
  transpilePackages: ['react-cytoscapejs'],
  skipMiddlewareUrlNormalize: true,
  experimental: {
    outputFileTracingIncludes: standaloneBuild
      ? {
          '/': ['./node_modules/@kausal*/themes*/**'],
        }
      : undefined,
  },
  generateBuildId: async () => {
    if (process.env.NEXTJS_BUILD_ID) return process.env.NEXTJS_BUILD_ID;
    // If a fixed Build ID was not provided, fall back to the default implementation.
    return null;
  },
  // basePath: process.env.BASE_PATH,
  i18n: {
    defaultLocale: 'default',
    locales: ['default', ...i18nConfig.i18n.locales],
    localeDetection: false,
  },
};

function initSentryWebpack(config) {
  /**
   * @type {import('@sentry/nextjs/types/config/types').SentryBuildOptions}
   */
  const sentryOptions = {
    silent: false,
    telemetry: false,
    authToken: sentryAuthToken,
    release: {
      setCommits: {
        auto: true,
      },
    },
    disableLogger: !sentryDebug,
    widenClientFileUpload: true,
    automaticVercelMonitors: false,
    reactComponentAnnotation: {
      enabled: true,
    },
    unstable_sentryWebpackPluginOptions: {
      // Even though this is advertised as unstable, the risk has low impact for this use case.
      //
      // This is passing options straight to the SentryWebpackPlugin and the key has to be found
      // in SentryWebpackPluginOptions which come from @sentry/bundler-plugin-core
      errorHandler: (error) => {
        // When an error occurs during release creation or sourcemaps
        // upload, the plugin will call this function. Without this
        // handler, the build would fail completely.
        console.error('⚠️  There was an error communicating with the Sentry API');
        console.error(error.message);
      },
    },
  };

  // Make sure adding Sentry options is the last code to run before exporting, to
  // ensure that your source maps include changes from all other Webpack plugins
  return withSentryConfig(config, sentryOptions);
}

export default initSentryWebpack(nextConfig);
