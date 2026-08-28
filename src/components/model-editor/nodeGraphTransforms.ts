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
    if (!allNodeIds.has(edge.fromRef.nodeUuid) || !allNodeIds.has(edge.portRef.nodeUuid)) continue;
    const list = reverseAdj.get(edge.portRef.nodeUuid) ?? [];
    list.push(edge.fromRef.nodeUuid);
    reverseAdj.set(edge.portRef.nodeUuid, list);
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
  const nodeByUuid = new Map(nodes.map((n: EditorNodeFieldsFragment) => [n.uuid, n]));
  const snipped = new Set<string>();

  const outDegree = new Map<string, number>();
  for (const e of edges) {
    outDegree.set(e.fromRef.nodeUuid, (outDegree.get(e.fromRef.nodeUuid) ?? 0) + 1);
  }

  for (const edge of edges) {
    const src = nodeByUuid.get(edge.fromRef.nodeUuid);
    const tgt = nodeByUuid.get(edge.portRef.nodeUuid);
    const srcLayoutMeta = src ? getNodeLayoutMeta(src) : null;
    const tgtLayoutMeta = tgt ? getNodeLayoutMeta(tgt) : null;
    if (!srcLayoutMeta || !tgtLayoutMeta) continue;

    const span = Math.abs(tgtLayoutMeta.topologicalLayer - srcLayoutMeta.topologicalLayer);
    const srcOutDegree = outDegree.get(edge.fromRef.nodeUuid) ?? 0;

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
  const nodeUuids = new Set(nodes.map((n) => n.uuid));

  const sourceHandlesFromEdges = new Map<string, Set<string>>();
  const targetHandlesFromEdges = new Map<string, Set<string>>();
  for (const edge of edges) {
    if (!nodeUuids.has(edge.fromRef.nodeUuid) || !nodeUuids.has(edge.portRef.nodeUuid)) continue;
    if (!sourceHandlesFromEdges.has(edge.fromRef.nodeUuid))
      sourceHandlesFromEdges.set(edge.fromRef.nodeUuid, new Set());
    sourceHandlesFromEdges.get(edge.fromRef.nodeUuid)!.add(edge.fromRef.portId);
    if (!targetHandlesFromEdges.has(edge.portRef.nodeUuid))
      targetHandlesFromEdges.set(edge.portRef.nodeUuid, new Set());
    targetHandlesFromEdges.get(edge.portRef.nodeUuid)!.add(edge.portRef.portId);
  }

  const nodesByUuid = new Map(nodes.map((n) => [n.uuid, n]));
  const validEdges = edges.filter((edge) => {
    const src = nodesByUuid.get(edge.fromRef.nodeUuid);
    const tgt = nodesByUuid.get(edge.portRef.nodeUuid);
    if (src) {
      const spec = getNodeSpec(src);
      if (spec && !spec.outputPorts.some((p) => p.id === edge.fromRef.portId)) {
        console.warn(
          `Skipping edge ${edge.id}: fromPort="${edge.fromRef.portId}" not found on node "${src.identifier}"`
        );
        return false;
      }
    }
    if (tgt) {
      const spec = getNodeSpec(tgt);
      if (spec && !spec.inputPorts.some((p) => p.id === edge.portRef.portId)) {
        console.warn(
          `Skipping edge ${edge.id}: toPort="${edge.portRef.portId}" not found on node "${tgt.identifier}"`
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
    const srcHandles = [
      ...new Set([
        ...outputPorts.map((p) => p.id),
        ...(sourceHandlesFromEdges.get(node.uuid) ?? []),
      ]),
    ].map((id) => ({ id }));
    const hiddenSourcesForNode = hiddenSourcesByNodeAndPort.get(node.uuid);
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
    for (const id of targetHandlesFromEdges.get(node.uuid) ?? []) {
      if (!tgtHandles.some((handle) => handle.id === id)) {
        tgtHandles.push({ id, multi: false, datasets: [], hiddenSources: undefined });
      }
    }

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
        isProtected: !node.isEditable,
        isEnabled: node.__typename === 'ActionNode' ? node.isEnabled : null,
        actionGroup:
          node.__typename === 'ActionNode' && node.group
            ? { id: node.group.id, name: node.group.name, color: node.group.color }
            : null,
        quantityKind: node.quantityKind ?? null,
        sourceHandles: srcHandles,
        targetHandles: tgtHandles,
      },
      position: { x: 0, y: 0 },
      type: 'elk',
    };
    return elkNode;
  });

  const elkEdges = validEdges
    .map<Edge | null>((edge) => {
      const source = nodesByUuid.get(edge.fromRef.nodeUuid);
      const target = nodesByUuid.get(edge.portRef.nodeUuid);
      if (!source || !target) return null;
      return {
        id: edge.id,
        source: source.id,
        sourceHandle: edge.fromRef.portId,
        target: target.id,
        targetHandle: edge.portRef.portId,
        markerEnd: EDGE_MARKER,
      };
    })
    .filter((edge): edge is Edge => edge !== null);

  return { nodes: elkNodes, edges: elkEdges };
}
