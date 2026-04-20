import { useReactiveVar } from '@apollo/client/react';

import { editorPreviewModeVar } from './queries';

/** True when the editor is showing the published revision and edits must be suppressed. */
export function useIsEditorReadOnly(): boolean {
  const mode = useReactiveVar(editorPreviewModeVar);
  return mode === 'PUBLISHED';
}
