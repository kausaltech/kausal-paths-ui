import * as url from 'node:url';

import type { WebpackConfigContext } from 'next/dist/server/config-shared.js';

import type BundleAnalyzerPlugin from '@next/bundle-analyzer';
import type { NextConfig } from 'next';
import type { Configuration } from 'webpack';
import type * as Webpack from 'webpack';

import { getCommonDefines, getNextConfig } from './kausal_common/configs/common-next-config';
import { wrapWithSentryConfig } from './kausal_common/src/sentry/sentry-next-config';
import i18nConfig from './next-i18next.config.js';

const { i18n } = i18nConfig;

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

let nextConfig: NextConfig = {
  ...getNextConfig(__dirname),
  webpack: (cfg: Configuration, context: WebpackConfigContext) => {
    const { isServer } = context;
    const webpack = context.webpack as typeof Webpack;
    if (!cfg.resolve || !cfg.resolve.alias || !Array.isArray(cfg.plugins))
      throw new Error('cfg.resolve not defined');
    cfg.resolve.extensionAlias = {
      '.js': ['.ts', '.js'],
    };
    if (!isServer) {
      cfg.resolve.alias['next-i18next/serverSideTranslations'] = false;
      cfg.resolve.alias['./next-i18next.config'] = false;
      cfg.resolve.alias['v8'] = false;
      cfg.resolve.symlinks = true;
    } else {
      cfg.optimization = {
        ...cfg.optimization,
        //minimize: false,
      };
    }
    const defines = {
      ...getCommonDefines(__dirname, isServer),
    };
    cfg.plugins.push(new webpack.DefinePlugin(defines));
    return cfg;
  },
  // basePath: process.env.BASE_PATH,
  i18n: {
    defaultLocale: 'default',
    locales: ['default', ...i18n.locales],
    localeDetection: false,
  },
};

nextConfig = wrapWithSentryConfig(nextConfig);

if (process.env.ANALYZE_BUNDLE === '1') {
  const withBundleAnalyzer = require('@next/bundle-analyzer') as typeof BundleAnalyzerPlugin;
  nextConfig = withBundleAnalyzer({
    enabled: true,
    openAnalyzer: true,
  })(nextConfig);
}

export default nextConfig;
