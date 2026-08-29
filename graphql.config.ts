import fs from 'node:fs';

import dotenv from 'dotenv';
import type { IGraphQLProject } from 'graphql-config';

import { getPrivateExtensions } from './configs/private-extensions.ts';

dotenv.config({ quiet: true });

export function getLocalSchema() {
  for (const fn of ['graphql.schema', 'schema.graphql']) {
    if (fs.existsSync(fn)) {
      return fn;
    }
  }
  return null;
}

export function getRemoteSchema() {
  return (process.env.PATHS_BACKEND_URL || 'https://api.paths.kausal.dev') + '/v1/graphql/';
}

export function getSchema() {
  return getLocalSchema() ?? getRemoteSchema();
}
const JS = '*.{js,jsx,ts,tsx,mjs}';
const documentDirs = [
  'src',
  'e2e-tests',
  'kausal_common/src',
  ...getPrivateExtensions().map(({ sourceDir }) => sourceDir),
];

const config = {
  schema: getSchema(),
  documents: documentDirs.map((dir) => `./${dir}/**/${JS}`),
} satisfies IGraphQLProject;

export default config;
