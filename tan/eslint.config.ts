import eslint from '@eslint/js';
import { globalIgnores } from 'eslint/config';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig(
  globalIgnores(['node_modules']),
  eslint.configs.recommended,
  tseslint.configs.recommended
);
