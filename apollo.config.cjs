require('dotenv').config();

function getGraphqlUrl() {
  let val = process.env.PATHS_BACKEND_URL;
  if (val) {
    return `${val}/v1/graphql/`;
  }
  val = process.env.NEXT_PUBLIC_API_URL;
  if (val) {
    return `${val}/graphql/`;
  }
  return 'https://api.paths.kausal.dev/v1/graphql/';
}

const JS = '*.{js,jsx,ts,tsx,mjs}';

module.exports = {
  client: {
    includes: [`./src/**/${JS}`, `./e2e-tests/**/${JS}`],
    excludes: [
      '**/node_modules/**',
      '**/__generated__/**',
      './e2e-tests/tests-out/**',
      './node_modules/**',
    ],
    service: {
      name: 'kausal-paths',
      url: getGraphqlUrl(),
    },
  },
};
