import fs from 'node:fs';

import dotenv from 'dotenv';
import type { IGraphQLProject } from 'graphql-config';

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

const config = {
  schema: getSchema(),
  documents: [`./src/**/${JS}`, `./e2e-tests/**/${JS}`, `./kausal_common/src/**/${JS}`],
} satisfies IGraphQLProject;

export default config;
