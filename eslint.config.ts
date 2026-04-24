import { defineConfig, globalIgnores } from 'eslint/config';
import type { ConfigWithExtends } from 'typescript-eslint';

import {
  getGlobalIgnores,
  getGraphQLDocsConfig,
  getGraphQLProcessorConfig,
  getNextEslintConfig,
  getNodeConfig,
} from './kausal_common/configs/eslint.ts';

const nodeConfig = getNodeConfig({
  dirs: ['kausal_common/configs'],
  files: ['*.ts', '*.js', 'kausal_common/scripts/*.js'],
});
const nextConfig = await getNextEslintConfig(['src', 'kausal_common/src']);
const config: ConfigWithExtends[] = defineConfig(
  getGraphQLProcessorConfig({ jsDirs: ['src', 'kausal_common/src'] }),
  getGraphQLDocsConfig(['src', 'kausal_common/src']),
  nextConfig,
  nodeConfig,
  getGlobalIgnores(),
  globalIgnores(
    ['kausal_common/src/components/paths', 'kausal_common/src/utils/paths'],
    'no-patchenstein'
  )
);

export default config;
