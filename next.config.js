//const { nextI18NextRewrites } = require('next-i18next/rewrites')
const localeSubpaths = {
  en: 'en',
  fi: 'fi',
}
const path = require('path')

const DEFAULT_GRAPHQL_API_URL = 'http://localhost:5000/graphql';

module.exports = {
  //rewrites: async () => nextI18NextRewrites(localeSubpaths),
  serverRuntimeConfig: {
    graphqlUrl: process.env.SERVER_GRAPHQL_API_URL || DEFAULT_GRAPHQL_API_URL,
  },
  publicRuntimeConfig: {
    localeSubpaths,
    graphqlUrl: process.env.BROWSER_GRAPHQL_API_URL || DEFAULT_GRAPHQL_API_URL,
  },
  sassOptions: {
    includePaths: [path.join(__dirname, 'styles')],
  },
}
