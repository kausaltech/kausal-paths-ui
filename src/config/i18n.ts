import * as Sentry from '@sentry/nextjs';
import { getRequestConfig } from 'next-intl/server';

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

async function importLocales(locale: string): Promise<Record<string, string>> {
  let translations: Record<string, string> = {};
  for (const ns of NAMESPACES) {
    const nsMessages = await importLocale(locale, ns);
    translations = { ...translations, [ns]: nsMessages };
  }

  // Include fallback translations for country-specific variants
  // e.g. "de-CH" falls back to "de"
  if (FALLBACKS[locale]) {
    return {
      ...(await importLocales(FALLBACKS[locale])),
      ...translations,
    };
  }

  // Always include English as a final fallback
  if (locale !== FALLBACKS.default) {
    return {
      ...(await importLocales(FALLBACKS.default)),
      ...translations,
    };
  }

  return translations;
}

export default getRequestConfig(async ({ requestLocale }) => {
  const locale = (await requestLocale) ?? 'en';
  const messages = await importLocales(locale);
  return {
    locale,
    messages,
  };
});
