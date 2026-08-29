import type { CodegenConfig } from '@graphql-codegen/cli';
import type { TypeScriptPluginConfig } from '@graphql-codegen/typescript';
import type { TypeScriptDocumentsPluginConfig } from '@graphql-codegen/typescript-operations';

import { getPrivateExtensions } from './configs/private-extensions.ts';
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
const privateExtensions = getPrivateExtensions();
const privateExcludes = privateExtensions.map(({ rootDir }) => `!./${rootDir}/**`);
const allDocuments = [...generalExcludes, ...graphqlConfig.documents];
const appDocuments = [e2eTestsExclude, ...privateExcludes, ...allDocuments];
const e2eDocuments = [appExclude, ...privateExcludes, ...allDocuments];
const schema = getSchema();

console.log(`🍓 Using GraphQL schema from: ${schema}`);

function getPrivateDocuments(currentRootDir: string): string[] {
  const otherPrivateExcludes = privateExtensions
    .filter(({ rootDir }) => rootDir !== currentRootDir)
    .map(({ rootDir }) => `!./${rootDir}/**`);

  return [appExclude, e2eTestsExclude, ...otherPrivateExcludes, ...allDocuments];
}

const privateGenerates: NonNullable<CodegenConfig['generates']> = Object.fromEntries(
  privateExtensions.map(({ rootDir, sourceDir }) => [
    `${sourceDir}/__generated__/graphql.ts`,
    {
      plugins: ['typescript-operations'],
      documents: getPrivateDocuments(rootDir),
      config: tsoConfig,
    },
  ])
);

const config: CodegenConfig = {
  schema,
  hooks: {
    afterAllFileWrite: ['prettier --write'],
  },
  generates: {
    'src/common/__generated__/possible_types.json': {
      plugins: ['fragment-matcher'],
      documents: appDocuments,
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
      documents: appDocuments,
      config: tsoConfig,
    },
    'e2e-tests/__generated__/graphql.ts': {
      plugins: ['typescript-operations'],
      config: {
        onlyOperationTypes: true,
        useTypeImports: true,
        nonOptionalTypename: true,
      } satisfies GraphQLOpConfig,
      documents: e2eDocuments,
    },
    ...privateGenerates,
  },
};

export default config;
