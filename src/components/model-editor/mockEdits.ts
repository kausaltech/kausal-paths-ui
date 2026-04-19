import { makeVar } from '@apollo/client';

/**
 * Client-side mock edits for the node fields that the backend `updateNode`
 * mutation does not yet accept (short name, description, node group, action
 * group). Everything else is persisted via `updateNode`.
 *
 * When the backend extends `UpdateNodeInput` to cover these fields, delete
 * this module entirely and replace the call sites in NodeDetailsSection.
 */

export type MockNodeEdit = {
  shortName?: string | null;
  description?: string | null;
  nodeGroup?: string | null;
  actionGroup?: string | null;
  editedAt?: Date;
  editedBy?: string;
};

export type EditableNodeField = Exclude<keyof MockNodeEdit, 'editedAt' | 'editedBy'>;

export const mockNodeEditsVar = makeVar<Record<string, MockNodeEdit>>({});

export function clearMockNodeEdits(): void {
  mockNodeEditsVar({});
}

export function setMockNodeFieldEdit<K extends EditableNodeField>(
  nodeId: string,
  field: K,
  value: MockNodeEdit[K],
  originalValue: MockNodeEdit[K],
  editedBy: string
): void {
  const current = mockNodeEditsVar();
  const next = { ...current };
  const existing: MockNodeEdit = next[nodeId] ?? {};
  const matchesOriginal = value === originalValue;

  if (matchesOriginal) {
    const { [field]: _omit, editedAt: _t, editedBy: _u, ...rest } = existing;
    const hasOtherFieldEdits = Object.keys(rest).some((k) => k !== 'editedAt' && k !== 'editedBy');
    if (!hasOtherFieldEdits) {
      delete next[nodeId];
    } else {
      next[nodeId] = { ...rest, editedAt: new Date(), editedBy };
    }
  } else {
    next[nodeId] = {
      ...existing,
      [field]: value,
      editedAt: new Date(),
      editedBy,
    };
  }
  mockNodeEditsVar(next);
}
