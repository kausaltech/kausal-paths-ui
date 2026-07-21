import { type Edge, MarkerType } from '@xyflow/react';

import type {
  EditorNodeEdgeFragment,
  EditorNodeFieldsFragment,
} from '@/common/__generated__/graphql';
import { type ElkNodeType, type HiddenContextRef, getNodeStyle } from './ElkNode';
import { getNodeLayoutMeta, getNodeSpec, getNodeType } from './nodeHelpers';

/**
 * Pure transforms for the node graph editor: turning the NodeGraph query
 * result (nodes + edges) into what React Flow renders. No React state —
 * everything here is a plain function of its inputs.
 */

const EDGE_MARKER: Edge['markerEnd'] = {
  type: MarkerType.ArrowClosed,
  width: 12,
  height: 12,
  color: '#b0bec5',
};

export function getNodeBorderColor(node: EditorNodeFieldsFragment): string {
  const spec = getNodeSpec(node);
  const typeConfig = spec?.typeConfig;
  const nodeClass =
    typeConfig && 'nodeClass' in typeConfig ? typeConfig.nodeClass : getNodeType(node);
  const isOutcome = node.__typename === 'Node' ? (node.isOutcome ?? false) : false;
  return getNodeStyle(node.kind ?? '', nodeClass ?? '', isOutcome).border;
}

/** Walk edges backwards from a set of root node IDs and return all upstream node IDs (inclusive). */
export function computeUpstreamNodeIds(
  rootIds: ReadonlySet<string>,
  edges: readonly EditorNodeEdgeFragment[],
  allNodeIds: ReadonlySet<string>
): Set<string> {
  const reverseAdj = new Map<string, string[]>();
  for (const edge of edges) {
    if (!allNodeIds.has(edge.fromRef.nodeId) || !allNodeIds.has(edge.toRef.nodeId)) continue;
    const list = reverseAdj.get(edge.toRef.nodeId) ?? [];
    list.push(edge.fromRef.nodeId);
    reverseAdj.set(edge.toRef.nodeId, list);
  }
  const visited = new Set<string>();
  const stack = [...rootIds];
  while (stack.length > 0) {
    const id = stack.pop()!;
    if (visited.has(id)) continue;
    visited.add(id);
    for (const upstream of reverseAdj.get(id) ?? []) {
      if (!visited.has(upstream)) stack.push(upstream);
    }
  }
  return visited;
}

const SPAN_THRESHOLD = 8;
const FANOUT_THRESHOLD = 5;

export function computeSnippedEdgeIds(
  edges: readonly EditorNodeEdgeFragment[],
  nodes: readonly EditorNodeFieldsFragment[]
): Set<string> {
  const nodeById = new Map(nodes.map((n: EditorNodeFieldsFragment) => [n.id, n]));
  const snipped = new Set<string>();

  const outDegree = new Map<string, number>();
  for (const e of edges) {
    outDegree.set(e.fromRef.nodeId, (outDegree.get(e.fromRef.nodeId) ?? 0) + 1);
  }

  for (const edge of edges) {
    const src = nodeById.get(edge.fromRef.nodeId);
    const tgt = nodeById.get(edge.toRef.nodeId);
    const srcLayoutMeta = src ? getNodeLayoutMeta(src) : null;
    const tgtLayoutMeta = tgt ? getNodeLayoutMeta(tgt) : null;
    if (!srcLayoutMeta || !tgtLayoutMeta) continue;

    const span = Math.abs(tgtLayoutMeta.topologicalLayer - srcLayoutMeta.topologicalLayer);
    const srcOutDegree = outDegree.get(edge.fromRef.nodeId) ?? 0;

    if (span > SPAN_THRESHOLD) {
      snipped.add(edge.id);
    } else if (srcOutDegree >= FANOUT_THRESHOLD && span > 3) {
      snipped.add(edge.id);
    }
  }

  return snipped;
}

export function convertToElk(
  nodes: readonly EditorNodeFieldsFragment[],
  edges: readonly EditorNodeEdgeFragment[],
  hiddenSourcesByNodeAndPort: ReadonlyMap<string, ReadonlyMap<string, HiddenContextRef[]>>
) {
  const nodeIds = new Set(nodes.map((n) => n.id));

  const sourceHandlesFromEdges = new Map<string, Set<string>>();
  const targetHandlesFromEdges = new Map<string, Set<string>>();
  for (const edge of edges) {
    if (!nodeIds.has(edge.fromRef.nodeId) || !nodeIds.has(edge.toRef.nodeId)) continue;
    if (!sourceHandlesFromEdges.has(edge.fromRef.nodeId))
      sourceHandlesFromEdges.set(edge.fromRef.nodeId, new Set());
    sourceHandlesFromEdges.get(edge.fromRef.nodeId)!.add(edge.fromRef.portId);
    if (!targetHandlesFromEdges.has(edge.toRef.nodeId))
      targetHandlesFromEdges.set(edge.toRef.nodeId, new Set());
    targetHandlesFromEdges.get(edge.toRef.nodeId)!.add(edge.toRef.portId);
  }

  const nodesById = new Map(nodes.map((n) => [n.id, n]));
  const validEdges = edges.filter((edge) => {
    const src = nodesById.get(edge.fromRef.nodeId);
    const tgt = nodesById.get(edge.toRef.nodeId);
    if (src) {
      const outPorts = getNodeSpec(src)?.outputPorts;
      if (!outPorts || !outPorts.some((p) => p.id === edge.fromRef.portId)) {
        console.warn(
          `Skipping edge ${edge.id}: fromPort="${edge.fromRef.portId}" not found on node "${src.identifier}"`
        );
        return false;
      }
    }
    if (tgt) {
      const inPorts = getNodeSpec(tgt)?.inputPorts;
      if (!inPorts || !inPorts.some((p) => p.id === edge.toRef.portId)) {
        console.warn(
          `Skipping edge ${edge.id}: toPort="${edge.toRef.portId}" not found on node "${tgt.identifier}"`
        );
        return false;
      }
    }
    return true;
  });

  const elkNodes = nodes.map((node: EditorNodeFieldsFragment) => {
    const spec = getNodeSpec(node);
    const inputPorts = spec?.inputPorts ?? [];
    const outputPorts = spec?.outputPorts ?? [];
    const srcHandles = outputPorts.map((p) => ({ id: p.id }));
    const hiddenSourcesForNode = hiddenSourcesByNodeAndPort.get(node.id);
    const tgtHandles = inputPorts.map((p) => ({
      id: p.id,
      multi: p.multi,
      datasets: p.bindings.flatMap((b) =>
        b.__typename === 'DatasetPortType' && b.dataset != null && b.metric != null
          ? [{ id: b.id, label: `${b.dataset.name} → ${b.metric.label}` }]
          : []
      ),
      hiddenSources: hiddenSourcesForNode?.get(p.id),
    }));

    const typeConfig = spec?.typeConfig;
    const nodeClass =
      typeConfig && 'nodeClass' in typeConfig ? typeConfig.nodeClass : getNodeType(node);

    const elkNode: ElkNodeType = {
      id: node.id,
      data: {
        label: node.name,
        kind: node.kind ?? '',
        nodeClass: nodeClass ?? '',
        color: node.color ?? '',
        isOutcome: node.__typename === 'Node' ? (node.isOutcome ?? false) : false,
        quantityKind: node.quantityKind ?? null,
        sourceHandles: srcHandles,
        targetHandles: tgtHandles,
      },
      position: { x: 0, y: 0 },
      type: 'elk',
    };
    return elkNode;
  });

  const elkNodesById = new Map(elkNodes.map((node) => [node.id, node]));

  const elkEdges = validEdges
    .filter((edge) => elkNodesById.has(edge.fromRef.nodeId) && elkNodesById.has(edge.toRef.nodeId))
    .map<Edge>((edge) => ({
      id: edge.id,
      source: edge.fromRef.nodeId,
      sourceHandle: edge.fromRef.portId,
      target: edge.toRef.nodeId,
      targetHandle: edge.toRef.portId,
      markerEnd: EDGE_MARKER,
    }));

  return { nodes: elkNodes, edges: elkEdges };
}
