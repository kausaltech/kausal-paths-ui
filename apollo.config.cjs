require('dotenv').config();

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.paths.kausal.dev/v1';

const JS = '*.{js,jsx,ts,tsx,mjs}';

module.exports = {
  client: {
    includes: [`./src/**/${JS}`],
    service: {
      name: 'kausal-paths',
      url: `${apiUrl}/graphql/`,
    },
  },
};
