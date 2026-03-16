import fs from 'node:fs';

import dotenv from 'dotenv';
import type { IGraphQLProject } from 'graphql-config';

dotenv.config({ quiet: true });

export function getLocalSchema() {
  const fn = 'graphql.schema';
  if (!fs.existsSync(fn)) {
    return null;
  }
  return fn;
}

export function getRemoteSchema() {
  return (process.env.PATHS_BACKEND_URL || 'https://api.paths.kausal.dev') + '/v1/graphql/';
}
const JS = '*.{js,jsx,ts,tsx,mjs}';

const config = {
  schema: getLocalSchema() ?? getRemoteSchema(),
  documents: [`./src/**/${JS}`, `./e2e-tests/**/${JS}`, `./kausal_common/src/**/${JS}`],
} satisfies IGraphQLProject;

export default config;
