import fs from 'node:fs';

import dotenv from 'dotenv';

dotenv.config();

function getLocalSchema() {
  const fn = 'graphql.schema.json';
  if (!fs.existsSync(fn)) {
    return null;
  }
  return fn;
}

function getRemoteSchema() {
  return (process.env.PATHS_BACKEND_URL || 'https://api.paths.kausal.dev') + '/v1/graphql/';
}

/**
 * @type {import('graphql-config').IGraphQLProject}
 */
const config = {
  schema: getLocalSchema() ?? getRemoteSchema(),
  documents: ['src/**/*.{ts,tsx,js,jsx}', 'kausal_common/**/*.{ts,tsx,js,jsx}'],
};

export default config;
