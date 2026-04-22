import path from 'node:path';

import { tanstackRouter } from '@tanstack/router-plugin/vite';
import viteReact from '@vitejs/plugin-react';
import { reactDevtools } from 'agent-react-devtools/vite';
import { type Plugin, defineConfig } from 'vite';
import { analyzer } from 'vite-bundle-analyzer';
import devtoolsJson from 'vite-plugin-devtools-json';

const isElectron = !!process.env.ELECTRON;

async function getElectronPlugins(): Promise<Plugin[]> {
  const electron = (await import('vite-plugin-electron/simple')).default;
  return electron({
    main: {
      entry: 'electron/main.ts',
    },
    preload: {
      input: 'electron/preload.ts',
    },
  });
}

const analyzeBundle = process.env.ANALYZE_BUNDLE === '1';
console.log(analyzeBundle);

const config = defineConfig({
  css: { devSourcemap: true },
  build: {
    sourcemap: true,
  },
  server: {
    // Don't hide any of our source files from devtools
    sourcemapIgnoreList: (sourcePath) => sourcePath.includes('node_modules'),
  },
  plugins: [
    reactDevtools(),
    devtoolsJson({ projectRoot: path.resolve(__dirname, '..') }),
    tanstackRouter({ target: 'react', autoCodeSplitting: true }),
    viteReact(),
    process.env.ANALYZE_BUNDLE === '1' ? analyzer() : null,
    isElectron ? getElectronPlugins() : null,
  ].filter(Boolean),
  resolve: {
    dedupe: ['react', 'react-dom', '@emotion/react', '@emotion/styled', '@emotion/cache'],
    alias: [
      { find: /^#\//, replacement: path.resolve(__dirname, 'src') + '/' },
      { find: /^@\//, replacement: path.resolve(__dirname, '../src') + '/' },
      { find: /^@common\//, replacement: path.resolve(__dirname, '../kausal_common/src') + '/' },
      {
        find: /^@sentry\/nextjs$/,
        replacement: path.resolve(__dirname, './node_modules/@sentry/react'),
      },
      { find: /^next-intl$/, replacement: path.resolve(__dirname, 'src/shims/next-intl.ts') },
      { find: /^next\/link$/, replacement: path.resolve(__dirname, 'src/shims/next-link.tsx') },
      { find: /^next\/router$/, replacement: path.resolve(__dirname, 'src/shims/next-router.ts') },
      { find: /^next\/head$/, replacement: path.resolve(__dirname, 'src/shims/next-head.tsx') },
      {
        find: /^next\/dynamic$/,
        replacement: path.resolve(__dirname, 'src/shims/next-dynamic.tsx'),
      },
      { find: /^next\/error$/, replacement: path.resolve(__dirname, 'src/shims/next-error.tsx') },
      { find: /^next$/, replacement: path.resolve(__dirname, 'src/shims/next.ts') },
    ],
  },
});

export default config;
