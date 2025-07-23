import 'i18next';
import * as NextI18Next from 'next-i18next';
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

const { appWithTranslation, withTranslation, Trans, useTranslation } = NextI18Next;

export function getI18n() {
  return NextI18Next.i18n;
}

export { appWithTranslation, Trans, useTranslation, withTranslation };

declare module 'i18next' {
  // Extend CustomTypeOptions
  interface CustomTypeOptions {
    // custom namespace type, if you changed it
    defaultNS: 'common';
    nsSeparator: ':';
    // custom resources type
    resources: {
      common: typeof nsCommon;
      errors: typeof nsErrors;
    };
    // other
  }
}
