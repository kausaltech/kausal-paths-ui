import { existsSync } from 'node:fs';
import { join } from 'node:path';

import type BundleAnalyzerPlugin from '@next/bundle-analyzer';
import type { NextConfig } from 'next';
import withNextIntl from 'next-intl/plugin';
import type { Options as SassOptions } from 'sass';
import type { Configuration as WebpackConfig } from 'webpack';

import { getNextConfig } from './kausal_common/configs/common-next-config.ts';
import { wrapWithSentryConfig } from './kausal_common/configs/sentry-next-config.ts';
import { getWildcardDomains } from './kausal_common/src/env/runtime.ts';
import { isLocalDev } from './kausal_common/src/env/static.ts';
import { initializeThemes } from './kausal_common/src/themes/next-config.mjs';

process.env.NEXT_TELEMETRY_DISABLED = '1';

initializeThemes(__dirname);

const assistantRoot = join(__dirname, 'private', 'assistant');
const hasPrivateAssistant = existsSync(join(assistantRoot, 'package.json'));
const assistantWebpackAliases = {
  '@paths-assistant/client': hasPrivateAssistant
    ? join(assistantRoot, 'src', 'client', 'index.ts')
    : join(__dirname, 'src', 'features', 'assistant', 'fallback-client.tsx'),
  '@paths-assistant/server': hasPrivateAssistant
    ? join(assistantRoot, 'src', 'server', 'index.ts')
    : join(__dirname, 'src', 'features', 'assistant', 'fallback-server.ts'),
};
const assistantTurbopackAliases = {
  '@paths-assistant/client': hasPrivateAssistant
    ? './private/assistant/src/client/index.ts'
    : './src/features/assistant/fallback-client.tsx',
  '@paths-assistant/server': hasPrivateAssistant
    ? './private/assistant/src/server/index.ts'
    : './src/features/assistant/fallback-server.ts',
};
const baseNextConfig = getNextConfig(__dirname);

let nextConfig: NextConfig = {
  ...baseNextConfig,
  productionBrowserSourceMaps: false,
  typescript: {
    ignoreBuildErrors: false,
  },
  turbopack: {
    ...baseNextConfig.turbopack,
    resolveAlias: {
      ...baseNextConfig.turbopack?.resolveAlias,
      ...assistantTurbopackAliases,
    },
  },
  webpack(config, context) {
    const configured = (baseNextConfig.webpack?.(config, context) ?? config) as WebpackConfig;
    configured.resolve ??= {};
    const existingAliases = configured.resolve.alias;
    configured.resolve.alias = {
      ...(existingAliases && !Array.isArray(existingAliases) ? existingAliases : {}),
      ...assistantWebpackAliases,
    };
    return configured;
  },
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
};

if (isLocalDev) {
  nextConfig.allowedDevOrigins = getWildcardDomains().map((domain) => `*.${domain}`);
}

nextConfig = wrapWithSentryConfig(nextConfig, {
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },
});
nextConfig = withNextIntl('./src/config/i18n.ts')(nextConfig);

if (process.env.ANALYZE_BUNDLE === '1') {
  const withBundleAnalyzer = require('@next/bundle-analyzer') as typeof BundleAnalyzerPlugin;
  nextConfig = withBundleAnalyzer({
    enabled: true,
    openAnalyzer: true,
  })(nextConfig);
}

export default nextConfig;
