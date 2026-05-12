/**
 * Format a language code (e.g. `en`, `fi`, `de-CH`) as a human-readable name
 * in the language itself — e.g. `English`, `suomi`, `Deutsch (Schweiz)`.
 *
 * Uses the platform's `Intl.DisplayNames`. Falls back to the raw code if the
 * API isn't available or the code is unrecognised.
 */
export function getNativeLanguageName(code: string): string {
  try {
    const name = new Intl.DisplayNames([code], { type: 'language' }).of(code);
    return name ?? code;
  } catch {
    return code;
  }
}
