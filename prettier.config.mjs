import defaultConfig from './kausal_common/configs/prettier.mjs';

/**
 * @type {import('prettier').Config}
 */
const config = {
  ...defaultConfig,
  overrides: [
    {
      files: ['src/common/__generated__/*'],
      excludeFiles: ['**'],
    },
  ],
};
export default config;
