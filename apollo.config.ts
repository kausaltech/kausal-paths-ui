import { getLocalSchema, getRemoteSchema } from './graphql.config.ts';

const JS = '*.{js,jsx,ts,tsx,mjs}';

const localSchema = getLocalSchema();

const config = {
  client: {
    includes: [`./src/**/${JS}`, `./e2e-tests/**/${JS}`],
    excludes: [
      '**/node_modules/**',
      '**/__generated__/**',
      './e2e-tests/tests-out/**',
      './node_modules/**',
    ],
    service: {
      name: 'kausal-paths',
      url: localSchema ? undefined : getRemoteSchema(),
      localSchemaFile: localSchema,
      skipSslValidation: false,
    },
  },
};

export default config;
