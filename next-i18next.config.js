const SUPPORTED_LANGUAGES = ['en', 'fi', 'sv', 'de'];

module.exports = {
  i18n: {
    defaultLocale: 'fi',
    locales: SUPPORTED_LANGUAGES,
    localeDetection: false,
  },
  fallbackLng: {
    'en-AU': ['en'],
    'de-CH': ['de'],
    'default': ['en'],
  },
  localePath: './public/locales',
  localeExtension: 'json',
  saveMissing: process.env.NODE_ENV !== 'production',
  ns: ['common'],
  defaultNS: 'common',
  fallbackNS: ['common'],
  SUPPORTED_LANGUAGES,
};
