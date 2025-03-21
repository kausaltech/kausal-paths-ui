import * as url from 'node:url';

import type BundleAnalyzerPlugin from '@next/bundle-analyzer';
import type { NextConfig } from 'next';

import { getNextConfig } from './kausal_common/configs/common-next-config';
import { wrapWithSentryConfig } from './kausal_common/src/sentry/sentry-next-config';
import i18nConfig from './next-i18next.config.js';

const { i18n } = i18nConfig;

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

process.env.NEXT_TELEMETRY_DISABLED = '1';

let nextConfig: NextConfig = {
  ...getNextConfig(__dirname, { isPagesRouter: true }),
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
