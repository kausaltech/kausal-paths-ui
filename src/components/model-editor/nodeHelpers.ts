import type { EditorNodeFieldsFragment } from '@/common/__generated__/graphql';

export function getNodeSpec(node: EditorNodeFieldsFragment) {
  return node.editor?.spec ?? null;
}

type NodeSpec = NonNullable<ReturnType<typeof getNodeSpec>>;
export type InputPort = NodeSpec['inputPorts'][number];
export type OutputPort = NodeSpec['outputPorts'][number];

/**
 * Whether an output port can feed an input port. The single source of truth for
 * port compatibility, shared by the node picker (NodeSelector) and edge binding
 * (NodeInputPortsSection) so the two never drift.
 *
 * - Quantity: enforced only when the input port declares one (empty = no constraint).
 * - Required dims: every required dimension must be present on the output.
 * - Supported dims: when set, the output may not carry a dimension outside the set.
 */
export function outputMatchesPort(port: InputPort, output: OutputPort): boolean {
  if (port.quantity && port.quantity !== output.quantity) return false;
  if (port.requiredDimensions.some((req) => !output.dimensions.includes(req))) return false;
  if (
    port.supportedDimensions.length > 0 &&
    output.dimensions.some((d) => !port.supportedDimensions.includes(d))
  ) {
    return false;
  }
  return true;
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
