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
    defaultLanguage: process.env.DEFAULT_LANGUAGE || 'en',
  },
  sassOptions: {
    includePaths: [path.join(__dirname, 'styles')],
  },
  future: {
    webpack5: true,
  },
  i18n: {
    locales: ['en', 'fi'],
    defaultLocale: 'fi',
  },
}
