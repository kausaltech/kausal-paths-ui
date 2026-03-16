/**
 * Shim that maps next-intl imports to use-intl equivalents.
 * Used via Vite resolve.alias so that existing components importing
 * from 'next-intl' work without modification.
 */
export {
  IntlProvider as NextIntlClientProvider,
  useLocale,
  useTranslations,
  useFormatter,
  useMessages,
  useNow,
  useTimeZone,
  IntlError,
  IntlErrorCode,
} from 'use-intl';
