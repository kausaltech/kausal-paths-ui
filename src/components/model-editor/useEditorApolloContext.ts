import { useMemo } from 'react';

import type { DefaultContext } from '@apollo/client';

import { useInstance } from '@/common/instance';

/**
 * Apollo `context` overlay for editor operations.
 *
 * The editor edits the canonical (default-language) source values regardless
 * of the UI locale the user is browsing in — editing in a non-default
 * language would otherwise overwrite the base column and silently drop the
 * other locales. Forcing `locale` to the instance's `defaultLanguage` makes
 * read responses pre-populate fields with the default-language content and
 * keeps mutation response payloads in the same language.
 *
 * Wired up via `makeInstanceMiddleware` (apollo-config), which reads
 * `context.locale` per-operation and falls back to the client-level locale.
 *
 * Also opts every editor operation into the backend's fault-tolerant mode
 * (`tolerateNodeFailures`), so a broken node is quarantined and surfaced via
 * `editor.status`/`editor.errors` instead of aborting the whole computation.
 */
export function useEditorApolloContext(): DefaultContext {
  const instance = useInstance();
  return useMemo(
    () => ({ locale: instance.defaultLanguage, tolerateNodeFailures: true }),
    [instance.defaultLanguage]
  );
}
