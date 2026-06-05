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
