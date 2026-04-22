import type { EditorNodeFieldsFragment } from '@/common/__generated__/graphql';

export function getNodeSpec(node: EditorNodeFieldsFragment) {
  return node.editor?.spec ?? null;
}

export function getNodeLayoutMeta(node: EditorNodeFieldsFragment) {
  return node.editor?.layoutMeta ?? null;
}

export function getNodeType(node: EditorNodeFieldsFragment) {
  return node.editor?.nodeType ?? '';
}

export function getNodeGroup(node: EditorNodeFieldsFragment) {
  return node.editor?.nodeGroup ?? null;
}
