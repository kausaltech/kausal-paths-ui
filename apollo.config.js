require('dotenv').config();

JS = '*.{js,jsx,ts,tsx,mjs}'

module.exports = {
  client: {
    includes: [
      `./components/**/${JS}`,
      `./pages/**/${JS}`,
      `./common/**/${JS}`,
      `./server/**/${JS}`,
    ],
    service: {
      name: 'kausal-paths',
      url: process.env.DEFAULT_GRAPHQL_API_URL || 'http://localhost:8000/v1/graphql/'
    },
  }
};
