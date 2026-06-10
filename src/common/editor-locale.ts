/**
 * Cookie holding the user's preferred *editor interface* language. This is
 * deliberately separate from the URL `[lang]` segment, which drives the
 * *content* language (the locale the backend renders node/dataset strings in).
 *
 * The model editor layout reads this cookie server-side and overrides next-intl
 * for the editor subtree via a nested `NextIntlClientProvider`, so the chrome
 * can be in one language while the content stays in another. The public site
 * is unaffected — it never reads this cookie.
 */
export const EDITOR_UI_LOCALE_COOKIE = 'paths-editor-ui-locale';

/**
 * Locales the editor interface is actually translated into. The interface
 * language is intentionally independent of the instance's content languages,
 * so this list — not `instance.supportedLanguages` — is the source of truth for
 * the Settings language selector. Add a locale here once its `model-editor`
 * (and shared `common` / `errors`) message bundles are translated.
 */
export const AVAILABLE_EDITOR_UI_LOCALES = ['en', 'de', 'fi'] as const;

export type EditorUiLocale = (typeof AVAILABLE_EDITOR_UI_LOCALES)[number];

export function isAvailableEditorUiLocale(locale: string): locale is EditorUiLocale {
  return (AVAILABLE_EDITOR_UI_LOCALES as readonly string[]).includes(locale);
}

/**
 * Resolve the editor interface locale: the saved preference if it's one we ship,
 * otherwise the content locale when that happens to be translated, else English.
 * Always clamped to an available locale so we never try to load a bundle we
 * don't have. The content-locale fallback only sets the *initial* language — the
 * user can still pick any available interface language independently.
 */
export function resolveEditorUiLocale(
  cookieValue: string | undefined,
  contentLocale: string | undefined
): EditorUiLocale {
  if (cookieValue && isAvailableEditorUiLocale(cookieValue)) return cookieValue;
  if (contentLocale && isAvailableEditorUiLocale(contentLocale)) return contentLocale;
  return 'en';
}

/** One year, in seconds — the editor UI language is a long-lived preference. */
const EDITOR_UI_LOCALE_MAX_AGE = 60 * 60 * 24 * 365;

/**
 * Persist the editor interface language and reload so the server re-renders the
 * editor subtree with the new next-intl messages. A full reload (rather than a
 * client-side state swap) keeps the change in lockstep with the server-loaded
 * message bundle, and leaves the URL — and thus the content language —
 * untouched.
 */
export function setEditorUiLocale(locale: string) {
  document.cookie = `${EDITOR_UI_LOCALE_COOKIE}=${encodeURIComponent(locale)}; path=/; max-age=${EDITOR_UI_LOCALE_MAX_AGE}; samesite=lax`;
  window.location.reload();
}
