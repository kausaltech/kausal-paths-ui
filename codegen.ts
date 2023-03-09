import type { CodegenConfig } from '@graphql-codegen/cli';
import type { TypeScriptDocumentsPluginConfig } from '@graphql-codegen/typescript-operations'
import type { TypeScriptPluginConfig } from '@graphql-codegen/typescript'
import apolloConfig from './apollo.config';


const tsoConfig: TypeScriptDocumentsPluginConfig & TypeScriptPluginConfig = {
  arrayInputCoercion: false,
  mergeFragmentTypes: true,
  onlyOperationTypes: true,
  preResolveTypes: true,
};

const config: CodegenConfig = {
  schema: apolloConfig.client.service.url,
  documents: apolloConfig.client.includes,
  generates: {
    'src/common/__generated__/possible_types.json': {
      plugins: ['fragment-matcher'],
      config: {
        useExplicitTyping: true,
      },
    },
    'src/common/__generated__/graphql.ts': {
      plugins: ['typescript', 'typescript-operations'],
      config: tsoConfig,
    },
  },
};

export default config;
