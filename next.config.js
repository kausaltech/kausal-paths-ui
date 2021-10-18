const SUPPORTED_LANGUAGES = ['en', 'fi', 'sv'];
const i18n = {
  defaultLocale: 'en',
  locales: SUPPORTED_LANGUAGES,
  localeDetection: false,
};

const path = require('path')

const DEFAULT_GRAPHQL_API_URL = process.env.DEFAULT_GRAPHQL_API_URL || 'https://api.paths.kausal.tech/v1/graphql/';
const INSTANCE_IDENTIFIER = process.env.INSTANCE_IDENTIFIER;

module.exports = {
  serverRuntimeConfig: {
    graphqlUrl: process.env.SERVER_GRAPHQL_API_URL || DEFAULT_GRAPHQL_API_URL,
  },
  publicRuntimeConfig: {
    graphqlUrl: process.env.BROWSER_GRAPHQL_API_URL || DEFAULT_GRAPHQL_API_URL,
    basePath: process.env.BASE_PATH,
    instanceIdentifier: INSTANCE_IDENTIFIER,
  },
  sassOptions: {
    includePaths: [path.join(__dirname, 'styles')],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.alias['next-i18next/serverSideTranslations'] = false;
    }
    return config;
  },
  webpack5: true,
  basePath: process.env.BASE_PATH,
  i18n,
}
