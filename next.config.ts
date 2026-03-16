import type BundleAnalyzerPlugin from '@next/bundle-analyzer';
import type { NextConfig } from 'next';
import type { Options as SassOptions } from 'sass';

import { getNextConfig } from './kausal_common/configs/common-next-config';
import { wrapWithSentryConfig } from './kausal_common/configs/sentry-next-config.ts';
import { initializeThemes } from './kausal_common/src/themes/next-config.mjs';

const SUPPORTED_LOCALES = ['en', 'fi', 'sv', 'de', 'de-CH', 'cs', 'da', 'lv', 'pl', 'es-US', 'el'];

process.env.NEXT_TELEMETRY_DISABLED = '1';

initializeThemes(__dirname);

let nextConfig: NextConfig = {
  ...getNextConfig(__dirname),
  sassOptions: {
    quietDeps: true,
    silenceDeprecations: [
      'import',
      'legacy-js-api',
      'color-functions',
      'global-builtin',
      'color-4-api',
    ],
  } satisfies SassOptions<'sync'>,
  // basePath: process.env.BASE_PATH,
  i18n: {
    defaultLocale: 'default',
    locales: ['default', ...SUPPORTED_LOCALES],
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
