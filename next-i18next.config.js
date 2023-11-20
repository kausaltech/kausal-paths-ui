const SUPPORTED_LANGUAGES = ['en', 'fi', 'sv', 'de', 'de-CH'];

/**
 * @type {import('next-i18next').UserConfig}
 */
const i18nConfig = {
  i18n: {
    defaultLocale: 'fi',
    locales: SUPPORTED_LANGUAGES,
    localeDetection: false,
  },
  fallbackLng: {
    'en-AU': ['en'],
    'de-CH': ['de'],
    default: ['en'],
  },
  localePath: './public/locales',
  localeExtension: 'json',
  //saveMissing: process.env.NODE_ENV !== 'production',
  ns: ['common', 'errors'],
  returnNull: false,
  defaultNS: 'common',
  fallbackNS: ['common'],
  SUPPORTED_LANGUAGES,
};

export default i18nConfig;
