require('dotenv').config();

JS = '*.{js,jsx,ts,tsx,mjs}'

module.exports = {
  client: {
    includes: [
      `./*.mjs`,
      `./components/**/${JS}`,
      `./pages/**/${JS}`,
      `./common/**/${JS}`
    ],
    service: {
      name: 'kausal-paths',
      url: process.env.DEFAULT_GRAPHQL_API_URL || 'http://localhost:8000/v1/graphql/'
    },
  }
};
