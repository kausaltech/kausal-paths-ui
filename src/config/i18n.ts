import { headers } from 'next/headers';

import * as Sentry from '@sentry/nextjs';
import { getRequestConfig } from 'next-intl/server';

import { DEFAULT_LANGUAGE_HEADER } from '@common/constants/headers.mjs';

import { CURRENT_LANGUAGE_HEADER } from '@/common/const';

const FALLBACKS: Record<string, string> = {
  'de-CH': 'de',
  'es-US': 'es',
  default: 'en',
};

type LocaleFile = 'common' | 'errors';

const NAMESPACES: LocaleFile[] = ['common', 'errors'];

async function importLocale(locale: string, file: LocaleFile) {
  try {
    const translations = (await import(`../../public/locales/${locale}/${file}.json`)).default;
    return translations as Record<string, string>;
  } catch (error) {
    console.warn(`kausal-paths-ui > Failed to load ${file} translations for ${locale}`);
    Sentry.captureException(error);
    return {};
  }
}

type TranslationWithNamespaces = { [x: string]: Record<string, string> };

async function importLocales(
  locale: string,
  mergeTranslations?: TranslationWithNamespaces
): Promise<TranslationWithNamespaces> {
  let translations: TranslationWithNamespaces = mergeTranslations ?? {};
  for (const ns of NAMESPACES) {
    const nsMessages = await importLocale(locale, ns);
    const existingNsMessages = translations[ns] ?? {};
    translations = { ...translations, [ns]: { ...nsMessages, ...existingNsMessages } };
  }

  // Include fallback translations for country-specific variants
  // e.g. "de-CH" falls back to "de"
  if (FALLBACKS[locale]) {
    return await importLocales(FALLBACKS[locale], translations);
  }

  // Always include English as a final fallback
  if (locale !== FALLBACKS.default) {
    return await importLocales(FALLBACKS.default, translations);
  }

  return translations;
}

export default getRequestConfig(async ({ requestLocale }) => {
  const requestHeaders = await headers();
  const localeFromHeader = requestHeaders.get(CURRENT_LANGUAGE_HEADER);
  const localeFromRequest = await requestLocale;
  const locale = localeFromRequest ?? localeFromHeader ?? 'en';
  const messages = await importLocales(locale);
  return {
    locale,
    messages,
  };
});
