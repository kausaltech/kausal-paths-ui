#!/usr/bin/env node

import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { UrlLoader } from '@graphql-tools/url-loader';
import { printSchema } from 'graphql';

function withTypesSortedByName(schema) {
  const typeMap = schema.getTypeMap();
  const sortedTypeMap = Object.fromEntries(
    Object.keys(typeMap)
      .sort()
      .map((name) => [name, typeMap[name]])
  );

  return new Proxy(schema, {
    get(target, property, receiver) {
      return property === 'getTypeMap'
        ? () => sortedTypeMap
        : Reflect.get(target, property, receiver);
    },
  });
}

const [endpoint, output = 'schema.graphql'] = process.argv.slice(2);

if (!endpoint) {
  console.error('Usage: pnpm download-schema <endpoint> [output]');
  process.exitCode = 2;
} else {
  const [source] = await new UrlLoader().load(endpoint, {
    directiveIsRepeatable: true,
    inputValueDeprecation: true,
    oneOf: true,
    schemaDescription: true,
    specifiedByUrl: true,
  });
  if (!source?.schema) {
    throw new Error(`No GraphQL schema returned by ${endpoint}`);
  }

  const outputPath = resolve(output);
  const schema = printSchema(withTypesSortedByName(source.schema));
  await writeFile(outputPath, `${schema}\n`, 'utf8');
  console.log(`GraphQL schema saved to ${outputPath}`);
}
