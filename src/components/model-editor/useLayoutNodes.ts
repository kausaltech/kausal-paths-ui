import { useEffect, useRef, useState } from 'react';

import { type Edge, useNodesInitialized, useReactFlow } from '@xyflow/react';
import ELK, { type ElkNode as ElkGraphNode } from 'elkjs/lib/elk.bundled.js';

import { type ElkNodeType, type HandleData } from './ElkNode';
import { loadLayoutCache, saveAutoPositions } from './layoutCache';
import { computeLayoutMetrics, formatMetrics } from './layoutMetrics';

const NODE_WIDTH = 150;
const NODE_HEIGHT = 50;
const HANDLE_SPACING = 12;

function getMinNodeHeight(node: ElkNodeType): number {
  const portCount = Math.max(node.data.targetHandles.length, node.data.sourceHandles.length);
  return Math.max(NODE_HEIGHT, portCount * HANDLE_SPACING + 16);
}

const ELK_OPTIONS: Record<string, string> = {
  'elk.algorithm': 'org.eclipse.elk.layered',
  'elk.direction': 'RIGHT',
  'elk.edgeRouting': 'POLYLINE',
  'elk.layered.spacing.edgeNodeBetweenLayers': '40',
  'elk.layered.spacing.nodeNodeBetweenLayers': '60',
  'elk.spacing.nodeNode': '20',
  'elk.spacing.portPort': '8',
  'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
  'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
};

const elk = new ELK({
  defaultLayoutOptions: ELK_OPTIONS,
});

async function getElkLayoutedNodes(nodes: ElkNodeType[], edges: Edge[]): Promise<ElkNodeType[]> {
  const graph = {
    id: 'root',
    layoutOptions: ELK_OPTIONS,
    children: nodes.map((n) => {
      const w = NODE_WIDTH;
      const h = getMinNodeHeight(n);

      const targetPorts = n.data.targetHandles.map((t) => ({
        id: `${n.id}:${t.id}`,
        properties: { side: 'WEST' },
      }));
      const sourcePorts = n.data.sourceHandles.map((s) => ({
        id: `${n.id}:${s.id}`,
        properties: { side: 'EAST' },
      }));

      return {
        id: n.id,
        width: w,
        height: h,
        properties: {
          // FIXED_SIDE lets ELK reorder ports within each side to minimize
          // crossings during node placement; our post-layout port-order pass
          // (see `assignPortTops`) then re-sorts render positions by the
          // final source/target Y coordinates for a clean visual.
          'org.eclipse.elk.portConstraints': 'FIXED_SIDE',
        },
        ports: [...targetPorts, ...sourcePorts],
      };
    }),
    edges: edges.map((e) => ({
      id: e.id,
      sources: [`${e.source}:${e.sourceHandle || e.source}`],
      targets: [`${e.target}:${e.targetHandle || e.target}`],
    })),
  };

  const layoutedGraph = await elk.layout(graph);
  const childMap = new Map<string, ElkGraphNode>();
  for (const child of layoutedGraph.children ?? []) {
    childMap.set(child.id, child);
  }

  return nodes.map((node) => {
    const laid = childMap.get(node.id);
    return {
      ...node,
      position: {
        x: laid?.x ?? 0,
        y: laid?.y ?? 0,
      },
    };
  });
}

/**
 * Reorder each node's target/source handles by the Y of their connected peers
 * and push the resulting `top` into `HandleData`. Works post-layout (once
 * node positions are known) so it applies whether positions came from ELK or
 * the localStorage cache.
 *
 * Ports with no edges keep their original relative order and sit below the
 * connected ones.
 */
function assignPortTops(nodes: ElkNodeType[], edges: Edge[]): ElkNodeType[] {
  const nodeById = new Map(nodes.map((n) => [n.id, n]));

  const sortAndAssign = (
    handles: readonly HandleData[],
    getPeerYs: (handleId: string) => number[]
  ): HandleData[] => {
    const n = handles.length;
    if (n === 0) return [];
    type Sortable = { handle: HandleData; sortKey: number; originalIndex: number };
    const withKeys: Sortable[] = handles.map((handle, originalIndex) => {
      const ys = getPeerYs(handle.id);
      const sortKey =
        ys.length === 0 ? Number.POSITIVE_INFINITY : ys.reduce((a, b) => a + b, 0) / ys.length;
      return { handle, sortKey, originalIndex };
    });
    withKeys.sort((a, b) => {
      if (a.sortKey !== b.sortKey) return a.sortKey - b.sortKey;
      return a.originalIndex - b.originalIndex;
    });
    return withKeys.map(({ handle }, i) => ({
      ...handle,
      top: n > 1 ? `${((i + 1) / (n + 1)) * 100}%` : '50%',
    }));
  };

  return nodes.map((node) => {
    const targetHandles = sortAndAssign(node.data.targetHandles, (handleId) =>
      edges
        .filter((e) => e.target === node.id && e.targetHandle === handleId)
        .map((e) => nodeById.get(e.source)?.position.y)
        .filter((y): y is number => y != null)
    );
    const sourceHandles = sortAndAssign(node.data.sourceHandles, (handleId) =>
      edges
        .filter((e) => e.source === node.id && e.sourceHandle === handleId)
        .map((e) => nodeById.get(e.target)?.position.y)
        .filter((y): y is number => y != null)
    );
    return { ...node, data: { ...node.data, targetHandles, sourceHandles } };
  });
}

type Options = {
  /** When true, skip the default fitView after layout (caller will set viewport). */
  skipFitView?: boolean;
};

/**
 * Runs ELK layout once React Flow has measured all node dimensions, then
 * calls fitView (unless `skipFitView` is set). Re-runs when `sourceNodes`
 * changes reference or when `resetTrigger` bumps.
 *
 * Positions are read from a per-instance localStorage cache when available
 * (see layoutCache.ts). ELK only runs when at least one visible node has no
 * cached position; existing `user`-sourced entries are always preserved so
 * drags survive re-layouts.
 *
 * Returns the `sourceNodes` reference that was most recently laid out and
 * written to React Flow. Gate viewport-manipulating effects on
 * `returned === currentSourceNodes` to avoid racing against in-flight layouts.
 */
export default function useLayoutNodes(
  instanceId: string,
  sourceNodes: readonly ElkNodeType[],
  resetTrigger: number,
  options: Options = {}
): readonly ElkNodeType[] | null {
  const { skipFitView = false } = options;
  const nodesInitialized = useNodesInitialized();
  const { getEdges, setNodes, fitView } = useReactFlow<ElkNodeType>();
  const lastSourceNodesRef = useRef<readonly ElkNodeType[] | null>(null);
  const lastResetTriggerRef = useRef(-1);
  // Supersession refs — let async callbacks detect whether a newer layout
  // request has arrived without relying on effect cleanup (cleanup would
  // also fire on the transient `nodesInitialized` flip that `setNodes`
  // inside `finishWith` itself causes, cancelling the rAF that sets
  // `appliedNodes`).
  const latestSourceNodesRef = useRef(sourceNodes);
  const latestResetTriggerRef = useRef(resetTrigger);
  const [appliedNodes, setAppliedNodes] = useState<readonly ElkNodeType[] | null>(null);

  useEffect(() => {
    latestSourceNodesRef.current = sourceNodes;
  }, [sourceNodes]);
  useEffect(() => {
    latestResetTriggerRef.current = resetTrigger;
  }, [resetTrigger]);

  useEffect(() => {
    if (!nodesInitialized) return;
    if (
      lastSourceNodesRef.current === sourceNodes &&
      lastResetTriggerRef.current === resetTrigger
    ) {
      return;
    }
    lastSourceNodesRef.current = sourceNodes;
    lastResetTriggerRef.current = resetTrigger;

    const isCurrent = () =>
      latestSourceNodesRef.current === sourceNodes &&
      latestResetTriggerRef.current === resetTrigger;

    // Reading nodes from sourceNodes instead of RF's `getNodes()` — the latter
    // can lag by a frame when the previous `setNodes(layoutedNodes)` hasn't
    // been reconciled yet, causing stale `data` (e.g. out-of-date node names).
    const nodes = sourceNodes as ElkNodeType[];
    const edges = getEdges();

    const cache = loadLayoutCache(instanceId);
    const missing = nodes.filter((n) => !(n.id in cache));

    const finishWith = (laidOut: ElkNodeType[]) => {
      if (!isCurrent()) return;
      // Sort each node's handles by the Y of their connected peers so edges
      // line up with the source/target vertical order, minimising crossings.
      const withPorts = assignPortTops(laidOut, edges);
      // Preserve selection flag from live RF state — replacing nodes wholesale
      // would otherwise drop it and close the details panel.
      setNodes((prev) => {
        const selectedIds = new Set(prev.filter((n) => n.selected).map((n) => n.id));
        return withPorts.map((n) => (selectedIds.has(n.id) ? { ...n, selected: true } : n));
      });
      requestAnimationFrame(() => {
        if (!isCurrent()) return;
        if (!skipFitView) {
          fitView();
        }
        setAppliedNodes(sourceNodes);
        const metrics = computeLayoutMetrics(withPorts, edges);
        console.log(formatMetrics(metrics));
      });
    };

    if (missing.length === 0) {
      const fromCache = nodes.map((node) => {
        const cached = cache[node.id];
        return cached ? { ...node, position: { x: cached.x, y: cached.y } } : node;
      });
      finishWith(fromCache);
      return;
    }

    getElkLayoutedNodes(nodes, edges).then(
      (layoutedNodes) => {
        if (!isCurrent()) return;
        const merged = layoutedNodes.map((node) => {
          const cached = cache[node.id];
          if (cached?.source === 'user') {
            return { ...node, position: { x: cached.x, y: cached.y } };
          }
          return node;
        });
        const autoPositions = merged
          .filter((n) => cache[n.id]?.source !== 'user')
          .map((n) => ({ id: n.id, x: n.position.x, y: n.position.y }));
        saveAutoPositions(instanceId, autoPositions);
        finishWith(merged);
      },
      (err) => {
        console.error('ELK layout failed:', err);
      }
    );
  }, [
    nodesInitialized,
    sourceNodes,
    resetTrigger,
    instanceId,
    getEdges,
    setNodes,
    fitView,
    skipFitView,
  ]);

  return appliedNodes;
}
