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
 * - Quantity: the declared one when the port has it, otherwise the
 *   solver-derived quantity of the value this port must deliver
 *   (`effectiveShape`) — role ports often declare nothing themselves while
 *   the shape rules still pin the quantity.
 * - Required dims: every required dimension must be present on the output.
 *
 * The derived shape's dimensions are not matched here: they reference
 * dimensions by uuid while spec ports carry identifiers, and aggregation can
 * legitimately reshape inputs — quantity is the safe, high-signal filter.
 */
export function outputMatchesPort(port: InputPort, output: OutputPort): boolean {
  const requiredQuantity = port.quantity ?? port.effectiveShape?.quantity ?? null;
  if (requiredQuantity && requiredQuantity !== output.quantity) return false;
  if (port.requiredDimensions.some((req) => !output.dimensions.includes(req))) return false;
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
