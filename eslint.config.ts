import { defineConfig, globalIgnores } from 'eslint/config';
import type { ConfigWithExtends } from 'typescript-eslint';

import { getPrivateExtensions } from './configs/private-extensions.ts';
import {
  getGlobalIgnores,
  getGraphQLDocsConfig,
  getGraphQLProcessorConfig,
  getNextEslintConfig,
  getNodeConfig,
} from './kausal_common/configs/eslint.ts';

const privateSourceDirs = getPrivateExtensions().map(({ sourceDir }) => sourceDir);
const sourceDirs = ['src', 'kausal_common/src', ...privateSourceDirs];

const nodeConfig = getNodeConfig({
  dirs: ['kausal_common/configs'],
  files: ['*.ts', '*.js', 'kausal_common/scripts/*.js'],
});
const nextConfig = await getNextEslintConfig(sourceDirs);
const config: ConfigWithExtends[] = defineConfig(
  getGraphQLProcessorConfig({ jsDirs: sourceDirs }),
  getGraphQLDocsConfig(sourceDirs),
  nextConfig,
  nodeConfig,
  {
    name: 'project-typescript-root',
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  getGlobalIgnores(),
  globalIgnores(
    ['kausal_common/src/components/paths', 'kausal_common/src/utils/paths'],
    'no-patchenstein'
  )
);

export default config;
