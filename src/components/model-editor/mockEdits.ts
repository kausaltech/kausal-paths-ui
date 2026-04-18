import { makeVar } from '@apollo/client';

/**
 * Mock client-side edit state for the model editor.
 *
 * We don't yet have a backend for drafts, so user edits to node properties
 * are kept in these in-memory reactive vars. When the backend lands, these
 * go away and the edits live on the server.
 */

export type MockNodeEdit = { name?: string };

export const mockNodeEditsVar = makeVar<Record<string, MockNodeEdit>>({});

export function clearMockNodeEdits(): void {
  mockNodeEditsVar({});
}

export function setMockNodeNameEdit(nodeId: string, value: string, originalName: string): void {
  const current = mockNodeEditsVar();
  const next = { ...current };
  const existing = next[nodeId] ?? {};
  if (value === originalName) {
    const { name: _omit, ...rest } = existing;
    if (Object.keys(rest).length === 0) {
      delete next[nodeId];
    } else {
      next[nodeId] = rest;
    }
  } else {
    next[nodeId] = { ...existing, name: value };
  }
  mockNodeEditsVar(next);
}
