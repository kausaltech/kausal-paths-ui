import type { CodegenConfig } from '@graphql-codegen/cli';
import type { TypeScriptDocumentsPluginConfig } from '@graphql-codegen/typescript-operations';
import type { TypeScriptPluginConfig } from '@graphql-codegen/typescript';
import apolloConfig from './apollo.config.cjs';

const tsoConfig: TypeScriptDocumentsPluginConfig & TypeScriptPluginConfig = {
  arrayInputCoercion: false,
  mergeFragmentTypes: true,
  onlyOperationTypes: true,
  preResolveTypes: true,
  avoidOptionals: true,
  nonOptionalTypename: true,
};

const generatedExclude = '!**/__generated__/**';

const apolloConfigDocs = [...apolloConfig.client.includes, generatedExclude];

const config: CodegenConfig = {
  schema: apolloConfig.client.service.url,
  generates: {
    'src/common/__generated__/possible_types.json': {
      plugins: ['fragment-matcher'],
      documents: apolloConfigDocs,
      config: {
        useExplicitTyping: true,
      },
    },
    'src/common/__generated__/graphql.ts': {
      plugins: ['typescript', 'typescript-operations'],
      documents: apolloConfigDocs,
      config: tsoConfig,
    },
    'e2e-tests/__generated__/graphql.ts': {
      plugins: ['typescript', 'typescript-operations'],
      config: {
        onlyOperationTypes: true,
      },
      documents: ['e2e-tests/**/*.ts', generatedExclude],
    },
  },
};

export default config;
