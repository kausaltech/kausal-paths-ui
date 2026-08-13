import { useReactiveVar } from '@apollo/client/react';

import { editorPreviewModeVar } from './queries';

/**
 * The editor is read-only while viewing the PUBLISHED slice — it's a
 * preview of what's live, not the working copy. Editing surfaces subscribe
 * so flipping the draft/published toggle enables/disables them immediately.
 */
export function useIsEditorReadOnly(): boolean {
  return useReactiveVar(editorPreviewModeVar) === 'PUBLISHED';
}
