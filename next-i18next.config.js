const SUPPORTED_LANGUAGES = ['en', 'fi', 'sv'];

module.exports = {
  i18n: {
    defaultLocale: 'fi',
    locales: SUPPORTED_LANGUAGES,
    localeDetection: false,
  },
  fallbackLng: {
    'en-AU': ['en'],
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
