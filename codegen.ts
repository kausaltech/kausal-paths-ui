import type { CodegenConfig } from '@graphql-codegen/cli';
import type { TypeScriptPluginConfig } from '@graphql-codegen/typescript';
import type { ApolloClientHelpersConfig } from '@graphql-codegen/typescript-apollo-client-helpers/typings/config';
import type { TypeScriptDocumentsPluginConfig } from '@graphql-codegen/typescript-operations';

import apolloConfig from './apollo.config.cjs';

const tsoConfig: TypeScriptDocumentsPluginConfig & TypeScriptPluginConfig = {
  arrayInputCoercion: false,
  mergeFragmentTypes: true,
  onlyOperationTypes: true,
  preResolveTypes: true,
  avoidOptionals: true,
  nonOptionalTypename: true,
  scalars: {
    UUID: 'string',
    RichText: 'string',
    PositiveInt: 'number',
    DateTime: 'string',
    JSONString: 'string',
  },
};

const generalExcludes = ['!**/node_modules/**', '!**/__generated__/**'];
const e2eTestsExclude = '!./e2e-tests/**';
const appExclude = '!./src/**';
const apolloConfigDocs = [...generalExcludes, ...apolloConfig.client.includes];

const config: CodegenConfig = {
  schema: apolloConfig.client.service.url,
  generates: {
    'src/common/__generated__/possible_types.json': {
      plugins: ['fragment-matcher'],
      documents: [e2eTestsExclude, ...apolloConfigDocs],
      config: {
        useExplicitTyping: true,
      },
    },
    // 'src/common/__generated__/apollo-helpers.ts': {
    //   plugins: ['typescript-apollo-client-helpers'],
    //   documents: [e2eTestsExclude, ...apolloConfigDocs],
    //   config: {
    //     useTypeImports: true,
    //   } satisfies ApolloClientHelpersConfig,
    // },
    'src/common/__generated__/graphql.ts': {
      plugins: ['typescript', 'typescript-operations'],
      documents: [e2eTestsExclude, ...apolloConfigDocs],
      config: tsoConfig,
    },
    'e2e-tests/__generated__/graphql.ts': {
      plugins: ['typescript', 'typescript-operations'],
      config: {
        onlyOperationTypes: true,
        useTypeImports: true,
      } satisfies TypeScriptDocumentsPluginConfig,
      documents: [appExclude, ...apolloConfigDocs],
    },
  },
};

export default config;
