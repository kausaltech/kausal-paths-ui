import 'next-intl';
import { useLocale, useTranslations } from 'next-intl';

import type nsCommon from '../../public/locales/en/common.json';
import type nsErrors from '../../public/locales/en/errors.json';
import type nsModelEditor from '../../public/locales/en/model-editor.json';

type ValidNamespace = 'common' | 'errors' | 'model-editor';

/**
 * Compatibility wrapper around next-intl's useTranslations hook.
 * Returns { t, i18n } to match the previous next-i18next API.
 * @deprecated prefer to use direct import from next-intl for consistency
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
      'model-editor': typeof nsModelEditor;
    };
  }
}
