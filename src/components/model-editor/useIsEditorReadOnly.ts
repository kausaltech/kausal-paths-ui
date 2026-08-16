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

type PermissionedEntity = {
  userPermissions: {
    change: boolean;
    delete: boolean;
  } | null;
};

/**
 * Object-level write access is independent of the editor slice. In particular,
 * protected objects can still be editable by an elevated user, while no object
 * is writable from the published preview.
 */
export function useIsEntityReadOnly(entity: PermissionedEntity | null | undefined): boolean {
  return useIsEditorReadOnly() || entity?.userPermissions?.change !== true;
}
