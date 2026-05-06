/**
 * Always returns `false` while preview-mode routing is disabled (see
 * `ApolloWrapper.detectPreviewMode`). All mutations hit the backend's
 * publish-first default slice, so the editor is effectively editing the
 * published revision in place. Restore the `editorPreviewModeVar` check
 * once the backend DRAFT hydrate bug is fixed.
 */
export function useIsEditorReadOnly(): boolean {
  return false;
}
