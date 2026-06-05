// Autonym display names for the locales the app supports, keyed by base
// language code. Region subtags (de-CH, es-US, …) fall back to the base
// language's name, with the region appended for disambiguation.
const languageNames: Record<string, string> = {
  fi: 'Suomi',
  en: 'English',
  de: 'Deutsch',
  sv: 'Svenska',
  cs: 'Čeština',
  da: 'Dansk',
  lv: 'Latviešu',
  pl: 'Polski',
  es: 'Español',
  el: 'Ελληνικά',
};

/** Base language code without any region subtag (e.g. `de-CH` -> `de`). */
export function getLanguageCodeLabel(lang: string): string {
  return lang.includes('-') ? lang.split('-')[0] : lang;
}

/**
 * Human-readable name for a locale, in its own language. Region subvariants
 * keep the base language name and append the region (e.g. `de-CH` ->
 * `Deutsch (CH)`) so two variants of the same language stay distinguishable.
 */
export function getLanguageName(lang: string): string {
  const base = getLanguageCodeLabel(lang);
  const name = languageNames[base] ?? base;
  if (lang.includes('-')) {
    const region = lang.split('-')[1]?.toUpperCase();
    return region ? `${name} (${region})` : name;
  }
  return name;
}
