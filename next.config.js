const { i18n } = require('./next-i18next.config')

const localeSubpaths = {
  en: 'en',
  fi: 'fi',
}
const path = require('path')

const DEFAULT_GRAPHQL_API_URL = process.env.DEFAULT_GRAPHQL_API_URL || 'https://api.paths.kausal.tech/v1/graphql/';

module.exports = {
  serverRuntimeConfig: {
    graphqlUrl: process.env.SERVER_GRAPHQL_API_URL || DEFAULT_GRAPHQL_API_URL,
  },
  publicRuntimeConfig: {
    localeSubpaths,
    graphqlUrl: process.env.BROWSER_GRAPHQL_API_URL || DEFAULT_GRAPHQL_API_URL,
    defaultLanguage: i18n.defaultLocale,
    basePath: process.env.BASE_PATH,
  },
  sassOptions: {
    includePaths: [path.join(__dirname, 'styles')],
  },
  future: {
    webpack5: true,
  },
  basePath: process.env.BASE_PATH,
  i18n,
}
