import { useEffect, useRef, useState } from 'react';

import { type Edge, useNodesInitialized, useReactFlow } from '@xyflow/react';
import ELK, { type ElkNode as ElkGraphNode } from 'elkjs/lib/elk.bundled.js';

import { type ElkNodeType } from './ElkNode';
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
          'org.eclipse.elk.portConstraints': 'FIXED_ORDER',
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

type Options = {
  /** When true, skip the default fitView after layout (caller will set viewport). */
  skipFitView?: boolean;
};

/**
 * Runs ELK layout once React Flow has measured all node dimensions,
 * then calls fitView (unless `skipFitView` is set). Accepts a `layoutVersion`
 * that should be bumped whenever the set of nodes/edges changes, so the
 * effect re-fires after the new nodes are measured.
 *
 * Positions are read from a per-instance localStorage cache when available
 * (see layoutCache.ts). ELK only runs when at least one visible node has no
 * cached position; existing `user`-sourced entries are always preserved so
 * drags survive re-layouts.
 *
 * Returns the last layout version whose positions have been written to
 * React Flow. Gate viewport-manipulating effects on this matching the
 * current `layoutVersion` to avoid racing against in-flight layouts.
 */
export default function useLayoutNodes(
  instanceId: string,
  layoutVersion: number,
  options: Options = {}
): number {
  const { skipFitView = false } = options;
  const nodesInitialized = useNodesInitialized();
  const { getNodes, getEdges, setNodes, fitView } = useReactFlow<ElkNodeType>();
  const lastLayoutVersionRef = useRef(-1);
  const [appliedVersion, setAppliedVersion] = useState(-1);

  useEffect(() => {
    if (!nodesInitialized) return;
    if (lastLayoutVersionRef.current === layoutVersion) return;
    lastLayoutVersionRef.current = layoutVersion;

    const nodes = getNodes() as ElkNodeType[];
    const edges = getEdges();
    let cancelled = false;

    const cache = loadLayoutCache(instanceId);
    const missing = nodes.filter((n) => !(n.id in cache));

    const finishWith = (laidOut: ElkNodeType[]) => {
      if (cancelled) return;
      setNodes(laidOut);
      requestAnimationFrame(() => {
        if (cancelled) return;
        if (!skipFitView) {
          fitView();
        }
        setAppliedVersion(layoutVersion);
        const metrics = computeLayoutMetrics(laidOut, edges);
        console.log(formatMetrics(metrics));
      });
    };

    if (missing.length === 0) {
      const fromCache = nodes.map((node) => {
        const cached = cache[node.id];
        return cached ? { ...node, position: { x: cached.x, y: cached.y } } : node;
      });
      finishWith(fromCache);
      return () => {
        cancelled = true;
      };
    }

    getElkLayoutedNodes(nodes, edges).then(
      (layoutedNodes) => {
        if (cancelled) return;
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

    return () => {
      cancelled = true;
    };
  }, [
    nodesInitialized,
    layoutVersion,
    instanceId,
    getNodes,
    getEdges,
    setNodes,
    fitView,
    skipFitView,
  ]);

  return appliedVersion;
}
