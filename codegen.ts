import type { CodegenConfig } from '@graphql-codegen/cli';
import { type plugin as apolloClientHelpersPlugin } from '@graphql-codegen/typescript-apollo-client-helpers';
import type { TypeScriptDocumentsPluginConfig } from '@graphql-codegen/typescript-operations';
import { type TypescriptOperationTypesPluginConfig } from 'graphql-codegen-typescript-operation-types';

import graphqlConfig, { getRemoteSchema } from './graphql.config.ts';

type ApolloClientHelpersConfig = Parameters<typeof apolloClientHelpersPlugin>[2];
type GraphQLOpConfig = TypeScriptDocumentsPluginConfig & TypescriptOperationTypesPluginConfig;

const tsoConfig: GraphQLOpConfig = {
  arrayInputCoercion: false,
  avoidOptionals: true,
  immutableTypes: false,
  mergeFragmentTypes: true,
  nonOptionalTypename: true,
  onlyOperationTypes: true,
  preResolveTypes: true,
  useTypeImports: true,
  scalars: {
    UUID: 'string',
    RichText: 'string',
    PositiveInt: 'number',
    DateTime: 'string',
    JSONString: 'string',
  },
};

const generalExcludes = [
  '!**/node_modules/**',
  '!**/__generated__/**',
  '!./kausal_common/components/paths/**',
  '!./kausal_common/src/utils/paths/**',
];
const e2eTestsExclude = '!./e2e-tests/**';
const appExclude = '!./src/**';
const apolloConfigDocs = [...generalExcludes, ...graphqlConfig.documents];
const schema = getRemoteSchema();

console.log(`🍓 Using GraphQL schema from: ${schema}`);

const config: CodegenConfig = {
  schema,
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
      plugins: ['graphql-codegen-typescript-operation-types', 'typescript-operations'],
      documents: [e2eTestsExclude, ...apolloConfigDocs],
      config: tsoConfig,
    },
    'e2e-tests/__generated__/graphql.ts': {
      plugins: ['graphql-codegen-typescript-operation-types', 'typescript-operations'],
      config: {
        onlyOperationTypes: true,
        useTypeImports: true,
      } satisfies GraphQLOpConfig,
      documents: [appExclude, ...apolloConfigDocs],
    },
  },
};

export default config;
