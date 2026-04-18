import { makeVar } from '@apollo/client';

/**
 * Mock client-side edit state for the model editor.
 *
 * We don't yet have a backend for drafts, so user edits to node properties
 * are kept in these in-memory reactive vars. When the backend lands, these
 * go away and the edits live on the server.
 */

export type MockNodeEdit = {
  name?: string;
  shortName?: string | null;
  description?: string | null;
  color?: string | null;
  isVisible?: boolean;
  isOutcome?: boolean;
  nodeGroup?: string | null;
  actionGroup?: string | null;
  editedAt?: Date;
  editedBy?: string;
};

export type EditableNodeField = Exclude<keyof MockNodeEdit, 'editedAt' | 'editedBy'>;

export const mockNodeEditsVar = makeVar<Record<string, MockNodeEdit>>({});

export type MockPublishInfo = { at: Date; by: string };
export const mockLastPublishedVar = makeVar<MockPublishInfo | null>(null);

export function clearMockNodeEdits(): void {
  mockNodeEditsVar({});
}

export function publishMockEdits(publishedBy: string): void {
  mockLastPublishedVar({ at: new Date(), by: publishedBy });
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

export function setMockNodeNameEdit(
  nodeId: string,
  value: string,
  originalName: string,
  editedBy: string
): void {
  setMockNodeFieldEdit(nodeId, 'name', value, originalName, editedBy);
}
