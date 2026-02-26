import 'next-intl';
import { useLocale, useTranslations } from 'next-intl';
import numbro from 'numbro';
import numbroCs from 'numbro/dist/languages/cs-CZ.min.js';
import numbroDa from 'numbro/dist/languages/da-DK.min.js';
import numbroDeCh from 'numbro/dist/languages/de-CH.min.js';
import numbroDe from 'numbro/dist/languages/de-DE.min.js';
import numbroEl from 'numbro/dist/languages/el.min.js';
import numbroEnGb from 'numbro/dist/languages/en-GB.min.js';
import numbroEs from 'numbro/dist/languages/es-ES.min.js';
import numbroFi from 'numbro/dist/languages/fi-FI.min.js';
import numbroLv from 'numbro/dist/languages/lv-LV.min.js';
import numbroPl from 'numbro/dist/languages/pl-PL.min.js';
import numbroSv from 'numbro/dist/languages/sv-SE.min.js';

import type nsCommon from '../../public/locales/en/common.json';
import type nsErrors from '../../public/locales/en/errors.json';

type NL = numbro.NumbroLanguage;

function numbroEsUs() {
  const esUs = numbroEs as NL;
  esUs.languageTag = 'es-US';
  esUs.delimiters = {
    thousands: ',',
    decimal: '.',
  };
  esUs.currency = {
    symbol: '$',
    position: 'prefix',
    code: 'USD',
  };

  return esUs;
}

const numbroLangs = {
  de: numbroDe as NL,
  'de-DE': numbroDe as NL,
  'de-CH': numbroDeCh as NL,
  'en-GB': numbroEnGb as NL,
  fi: numbroFi as NL,
  cs: numbroCs as NL,
  da: numbroDa as NL,
  lv: numbroLv as NL,
  pl: numbroPl as NL,
  'es-US': numbroEsUs(),
  el: numbroEl as NL,
  sv: numbroSv as NL,
};

Object.entries(numbroLangs).forEach(([lang, conf]) => {
  numbro.registerLanguage({
    ...conf,
    languageTag: lang,
  });
});

type ValidNamespace = 'common' | 'errors';

/**
 * Compatibility wrapper around next-intl's useTranslations hook.
 * Returns { t, i18n } to match the previous next-i18next API.
 */
export function useTranslation<NS extends ValidNamespace = 'common'>(namespace?: NS | NS[]) {
  const ns = (Array.isArray(namespace) ? namespace[0] : (namespace ?? 'common')) as NS;
  const t = useTranslations(ns);
  const locale = useLocale();
  const i18n = { language: locale };
  return { t, i18n };
}

export { useLocale, useTranslations };

/** Type for the t() function returned by useTranslations, defaults to common namespace */
export type TFunction = ReturnType<typeof useTranslations<'common'>>;

// TypeScript module augmentation for next-intl message type safety
declare module 'next-intl' {
  interface AppConfig {
    Messages: {
      common: typeof nsCommon;
      errors: typeof nsErrors;
    };
  }
}
