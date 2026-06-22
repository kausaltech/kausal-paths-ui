import type { CodegenConfig } from '@graphql-codegen/cli';
import type { TypeScriptPluginConfig } from '@graphql-codegen/typescript';
import type { TypeScriptDocumentsPluginConfig } from '@graphql-codegen/typescript-operations';

import graphqlConfig, { getSchema } from './graphql.config.ts';

type GraphQLOpConfig = TypeScriptDocumentsPluginConfig & TypeScriptPluginConfig;

const tsoConfig = {
  arrayInputCoercion: false,
  avoidOptionals: true,
  immutableTypes: false,
  mergeFragmentTypes: true,
  nonOptionalTypename: true,
  onlyOperationTypes: true,
  constEnums: true,
  enumsAsTypes: false,
  useTypeImports: true,
  strictScalars: true,
  enumType: 'native-const',
  scalars: {
    UUID: 'string',
    RichText: 'string',
    PositiveInt: 'number',
    DateTime: 'string',
    JSONString: 'string',
    Date: 'string',
    JSON: 'Record<string, unknown> | unknown[]',
    _Any: 'unknown',
  },
} satisfies GraphQLOpConfig;

const generalExcludes = [
  '!**/node_modules/**',
  '!**/__generated__/**',
  '!./kausal_common/components/paths/**',
  '!./kausal_common/src/utils/paths/**',
];
const e2eTestsExclude = '!./e2e-tests/**';
const appExclude = '!./src/**';
const apolloConfigDocs = [...generalExcludes, ...graphqlConfig.documents];
const schema = getSchema();

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
      plugins: ['typescript-operations'],
      documents: [e2eTestsExclude, ...apolloConfigDocs],
      config: tsoConfig,
    },
    'e2e-tests/__generated__/graphql.ts': {
      plugins: ['typescript-operations'],
      config: {
        onlyOperationTypes: true,
        useTypeImports: true,
        nonOptionalTypename: true,
      } satisfies GraphQLOpConfig,
      documents: [appExclude, ...apolloConfigDocs],
    },
  },
};

export default config;
