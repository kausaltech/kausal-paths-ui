import { defineConfig, globalIgnores } from 'eslint/config';

import { getEslintConfig } from './kausal_common/configs/eslint.mjs';

const config = defineConfig(
  ...(await getEslintConfig(import.meta.dirname)),
  globalIgnores(
    ['kausal_common/src/components/paths', 'kausal_common/src/utils/paths'],
    'no-patchenstein'
  )
);

export default config;
