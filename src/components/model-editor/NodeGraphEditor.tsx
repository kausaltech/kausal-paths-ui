import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';

import { Box, CircularProgress, Drawer } from '@mui/material';

import { gql } from '@apollo/client';
import { useReactiveVar, useSuspenseQuery } from '@apollo/client/react';
import { type Edge, MarkerType, type OnSelectionChangeFunc } from '@xyflow/react';
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import type {
  EditorNodeEdgeFragment,
  EditorNodeFieldsFragment,
  NodeGraphQuery,
} from '@/common/__generated__/graphql';
import { nodeFiltersVar } from '@/common/cache';
import DatasetDrawer from './DatasetDrawer';
import ElkNode, {
  type ElkNodeType,
  type HiddenContextRef,
  NodeGraphInteractionContext,
  getNodeStyle,
} from './ElkNode';
import MetricsDrawer from './MetricsDrawer';
import NodeDetailsPanel from './NodeDetailsPanel';
import NodeGraphContextMenu, { type ContextMenuState } from './NodeGraphContextMenu';
import './NodeGraphEditor.css';
import { getNodeLayoutMeta, getNodeSpec, getNodeType } from './nodeHelpers';
import useLayoutNodes from './useLayoutNodes';

const ActionWizard = lazy(() => import('./action-wizard/ActionWizard'));

const nodeTypes = {
  elk: ElkNode,
};

const GET_NODE_GRAPH = gql`
  query NodeGraph {
    instance {
      id
      identifier
      actionGroups {
        id
        name
        color
      }
      editor {
        graphLayout {
          thresholds {
            hubDegree
            ghostableOutDegree
            ghostableTotalDegree
            ghostableAvgOutgoingSpan
          }
          coreNodeIds
          ghostableContextSourceIds
          hubIds
          actionIds
          outcomeIds
          mainGraphNodeIds
        }
        edges {
          id
          ...EditorNodeEdge
        }
      }
      nodes {
        id
        ...EditorNodeFields
      }
    }
  }
  fragment EditorNodeFields on NodeInterface {
    id
    identifier
    name
    shortName
    description
    color
    isVisible
    uuid
    kind
    quantityKind {
      icon
      id
      label
    }
    ... on Node {
      isOutcome
    }
    ... on ActionNode {
      group {
        id
        name
        color
      }
    }
    editor {
      nodeGroup
      nodeType
      layoutMeta {
        primaryClass
        isHub
        ghostable
        ghostTargets
        canonicalRail
        topologicalLayer
        inDegree
        outDegree
        totalDegree
        avgOutgoingSpan
        maxOutgoingSpan
        hasActionAncestor
      }
      spec {
        inputPorts {
          id
          label
          multi
          quantity
          unit {
            id
            short
          }
          requiredDimensions
          supportedDimensions
          bindings {
            __typename
            ... on DatasetPortType {
              id
              dataset {
                id
                identifier
                name
              }
              metric {
                id
                label
              }
            }
            ... on NodeEdgeType {
              id
            }
          }
        }
        outputPorts {
          id
          label
          quantity
          unit {
            id
            short
          }
        }
        typeConfig {
          __typename
          ... on SimpleConfigType {
            nodeClass
          }
          ... on ActionConfigType {
            nodeClass
          }
        }
      }
    }
  }
  fragment EditorNodeEdge on NodeEdgeType {
    id
    fromRef {
      nodeId
      portId
    }
    toRef {
      nodeId
      portId
    }
  }
`;

const EDGE_MARKER: Edge['markerEnd'] = {
  type: MarkerType.ArrowClosed,
  width: 12,
  height: 12,
  color: '#b0bec5',
};

function getNodeBorderColor(node: EditorNodeFieldsFragment): string {
  const spec = getNodeSpec(node);
  const typeConfig = spec?.typeConfig;
  const nodeClass =
    typeConfig && 'nodeClass' in typeConfig ? typeConfig.nodeClass : getNodeType(node);
  const isOutcome = node.__typename === 'Node' ? (node.isOutcome ?? false) : false;
  return getNodeStyle(node.kind ?? '', nodeClass ?? '', isOutcome).border;
}

const DRAWER_WIDTH = 360;
const OVERLAY_DRAWER_WIDTH = 600;
const PANEL_PEEK_WIDTH = 48;

/** Walk edges backwards from a set of root node IDs and return all upstream node IDs (inclusive). */
function computeUpstreamNodeIds(
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

function computeSnippedEdgeIds(
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

function convertToElk(
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

function FlowEditor(props: {
  nodes: readonly EditorNodeFieldsFragment[];
  edges: readonly EditorNodeEdgeFragment[];
  outcomeNodeIds: readonly string[];
  actionGroups: readonly { id: string; name: string; color: string | null }[];
}) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [userHiddenEdgeIds, setUserHiddenEdgeIds] = useState<ReadonlySet<string>>(() => new Set());
  const [contextMenu, setContextMenu] = useState<ContextMenuState>(null);
  const filters = useReactiveVar(nodeFiltersVar);
  const searchParams = useSearchParams();
  const requestedNodeKey = searchParams.get('node');
  const { setCenter, getNodes, getZoom } = useReactFlow();
  const handledNodeKeyRef = useRef<string | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardSourceAction, setWizardSourceAction] = useState<EditorNodeFieldsFragment | null>(
    null
  );
  const [overlay, setOverlay] = useState<
    { kind: 'metrics' } | { kind: 'dataset'; bindingId: string } | null
  >(null);
  const overlayOpen = overlay !== null;

  useEffect(() => {
    setOverlay(null);
  }, [selectedNodeId]);

  const nodeMap = useMemo(() => new Map(props.nodes.map((n) => [n.id, n])), [props.nodes]);

  const allNodeIdsSet = useMemo(() => new Set(props.nodes.map((n) => n.id)), [props.nodes]);

  const autoSnippedEdgeIds = useMemo(
    () => computeSnippedEdgeIds(props.edges, props.nodes),
    [props.edges, props.nodes]
  );

  const upstreamFilteredNodeIds = useMemo(() => {
    if (filters.outcomeId === null) return null;
    return computeUpstreamNodeIds(new Set([filters.outcomeId]), props.edges, allNodeIdsSet);
  }, [filters.outcomeId, props.edges, allNodeIdsSet]);

  const visibleNodes = useMemo(
    () =>
      props.nodes.filter(
        (node) => upstreamFilteredNodeIds === null || upstreamFilteredNodeIds.has(node.id)
      ),
    [props.nodes, upstreamFilteredNodeIds]
  );

  const visibleEdges = useMemo(
    () =>
      props.edges.filter(
        (edge) =>
          !autoSnippedEdgeIds.has(edge.id) &&
          !userHiddenEdgeIds.has(edge.id) &&
          (upstreamFilteredNodeIds === null ||
            (upstreamFilteredNodeIds.has(edge.fromRef.nodeId) &&
              upstreamFilteredNodeIds.has(edge.toRef.nodeId)))
      ),
    [props.edges, autoSnippedEdgeIds, userHiddenEdgeIds, upstreamFilteredNodeIds]
  );

  const visibleNodeIdsSet = useMemo(() => new Set(visibleNodes.map((n) => n.id)), [visibleNodes]);

  const snippedConnectionsByNodeId = useMemo(() => {
    const refs = new Map<string, Map<string, HiddenContextRef[]>>();
    for (const edge of props.edges) {
      if (!autoSnippedEdgeIds.has(edge.id)) continue;
      const srcNode = nodeMap.get(edge.fromRef.nodeId);
      const tgtNode = nodeMap.get(edge.toRef.nodeId);
      if (!srcNode || !tgtNode) continue;
      if (!visibleNodeIdsSet.has(edge.toRef.nodeId)) continue;
      const perPort = refs.get(edge.toRef.nodeId) ?? new Map<string, HiddenContextRef[]>();
      const list = perPort.get(edge.toRef.portId) ?? [];
      list.push({ id: srcNode.id, label: srcNode.name, color: getNodeBorderColor(srcNode) });
      perPort.set(edge.toRef.portId, list);
      refs.set(edge.toRef.nodeId, perPort);
    }
    for (const perPort of refs.values()) {
      for (const list of perPort.values()) {
        list.sort((a, b) => a.label.localeCompare(b.label));
      }
    }
    return refs;
  }, [props.edges, autoSnippedEdgeIds, nodeMap, visibleNodeIdsSet]);

  const highlightedNodeIds = useMemo(() => new Set<string>(), []);

  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(() => {
    return convertToElk(visibleNodes, visibleEdges, snippedConnectionsByNodeId);
  }, [snippedConnectionsByNodeId, visibleEdges, visibleNodes]);

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges);

  const layoutVersionRef = useRef(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const layoutVersion = useMemo(() => ++layoutVersionRef.current, [layoutedNodes, layoutedEdges]);

  useEffect(() => {
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [layoutedEdges, layoutedNodes, setEdges, setNodes]);

  const layoutAppliedVersion = useLayoutNodes(layoutVersion, {
    skipFitView: requestedNodeKey !== null,
  });

  // Deep-link: /model-editor/nodes?node=<identifier> opens the panel on that
  // node and centers the graph on it. Waits for ELK layout to be *applied*
  // (positions written back to React Flow) so `setCenter` reads real coords.
  useEffect(() => {
    if (!requestedNodeKey) return;
    if (layoutAppliedVersion !== layoutVersion) return;
    if (handledNodeKeyRef.current === requestedNodeKey) return;

    const target =
      props.nodes.find((n) => n.identifier === requestedNodeKey) ??
      props.nodes.find((n) => n.id === requestedNodeKey);
    if (!target) return;

    const rfNodes = getNodes();
    const targetRfNode = rfNodes.find((n) => n.id === target.id);
    if (!targetRfNode) return;

    const width = targetRfNode.measured?.width ?? targetRfNode.width ?? 0;
    const height = targetRfNode.measured?.height ?? targetRfNode.height ?? 0;
    const cx = targetRfNode.position.x + width / 2;
    const cy = targetRfNode.position.y + height / 2;
    // Readable-label threshold (ElkNode's zoomSelector shows content at >= 0.7).
    // Use 0.8 for a small margin so the first paint is clearly legible.
    const MIN_FOCUS_ZOOM = 0.8;
    const focusZoom = Math.max(getZoom(), MIN_FOCUS_ZOOM);
    void setCenter(cx, cy, { zoom: focusZoom, duration: 400 });
    setSelectedNodeId(target.id);
    handledNodeKeyRef.current = requestedNodeKey;
  }, [
    requestedNodeKey,
    layoutAppliedVersion,
    layoutVersion,
    props.nodes,
    getNodes,
    setCenter,
    getZoom,
  ]);

  const onSelectionChange: OnSelectionChangeFunc = useCallback(({ nodes: selected }) => {
    if (selected.length !== 1) {
      setSelectedNodeId(null);
      return;
    }
    setSelectedNodeId(selected[0].id);
  }, []);

  const onEdgeClick = useCallback((_event: React.MouseEvent, edge: Edge) => {
    setSelectedNodeId(edge.source);
  }, []);

  const onEdgeContextMenu = useCallback((event: React.MouseEvent, edge: Edge) => {
    event.preventDefault();
    setContextMenu({ kind: 'edge', mouseX: event.clientX, mouseY: event.clientY, edgeId: edge.id });
  }, []);

  const onNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: { id: string }) => {
      event.preventDefault();
      const graphNode = nodeMap.get(node.id);
      const isAction = (graphNode?.kind ?? '').toLowerCase() === 'action';
      setContextMenu({
        kind: 'node',
        mouseX: event.clientX,
        mouseY: event.clientY,
        nodeId: node.id,
        isAction,
      });
    },
    [nodeMap]
  );

  const handleHideEdge = useCallback((edgeId: string) => {
    setUserHiddenEdgeIds((prev) => new Set([...prev, edgeId]));
  }, []);

  const handleCopyAction = useCallback(
    (nodeId: string) => {
      const node = nodeMap.get(nodeId);
      if (!node) return;
      setWizardSourceAction(node);
      setWizardOpen(true);
    },
    [nodeMap]
  );

  const handleSnippedNodeClick = useCallback((nodeId: string) => {
    setSelectedNodeId(nodeId);
  }, []);

  const interactionCtx = useMemo(
    () => ({
      highlightedNodeIds,
      activeNodeId: selectedNodeId,
      onHiddenContextClick: handleSnippedNodeClick,
    }),
    [highlightedNodeIds, selectedNodeId, handleSnippedNodeClick]
  );

  const selectedNode = selectedNodeId ? (nodeMap.get(selectedNodeId) ?? null) : null;

  const displayedEdges = useMemo<Edge[]>(() => {
    if (!selectedNodeId) return edges;
    return edges.map((e): Edge => {
      const otherId =
        e.source === selectedNodeId ? e.target : e.target === selectedNodeId ? e.source : null;
      if (otherId === null) return e;
      const other = nodeMap.get(otherId);
      if (!other) return e;
      const color = getNodeBorderColor(other);
      return {
        ...e,
        style: { ...e.style, stroke: color, strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, width: 12, height: 12, color },
        zIndex: 10,
      };
    });
  }, [edges, selectedNodeId, nodeMap]);

  return (
    <NodeGraphInteractionContext value={interactionCtx}>
      <Box sx={{ display: 'flex', width: '100%', height: '100%' }}>
        <Box sx={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ flex: 1, position: 'relative' }}>
            <ReactFlow
              nodes={nodes}
              edges={displayedEdges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onSelectionChange={onSelectionChange}
              onEdgeClick={onEdgeClick}
              onEdgeContextMenu={onEdgeContextMenu}
              onNodeContextMenu={onNodeContextMenu}
              nodeTypes={nodeTypes}
              minZoom={0.2}
              maxZoom={5}
              fitView
              fitViewOptions={{ maxZoom: 1, padding: 0.2 }}
            >
              <Background color="#f0f0f0" />
              <Controls />
              <MiniMap nodeStrokeWidth={3} />
            </ReactFlow>
            <NodeGraphContextMenu
              state={contextMenu}
              onClose={() => setContextMenu(null)}
              onHideEdge={handleHideEdge}
              onCopyAction={handleCopyAction}
            />
            <Drawer
              variant="persistent"
              anchor="right"
              open={!!selectedNode}
              slotProps={{
                paper: {
                  onClick: () => {
                    if (overlayOpen) setOverlay(null);
                  },
                  sx: {
                    width: DRAWER_WIDTH,
                    maxWidth: 'none',
                    boxShadow: 10,
                    cursor: overlayOpen ? 'pointer' : 'default',
                    transform: overlayOpen
                      ? `translateX(-${OVERLAY_DRAWER_WIDTH - DRAWER_WIDTH + PANEL_PEEK_WIDTH}px) !important`
                      : undefined,
                    transition: (theme) =>
                      theme.transitions.create('transform', {
                        easing: theme.transitions.easing.sharp,
                        duration: theme.transitions.duration.standard,
                      }),
                  },
                },
              }}
            >
              <NodeDetailsPanel
                node={selectedNode}
                allNodes={props.nodes}
                edges={props.edges}
                actionGroups={props.actionGroups}
                onClose={() => setSelectedNodeId(null)}
                onSelectNode={setSelectedNodeId}
                onShowMetrics={() => setOverlay({ kind: 'metrics' })}
                onShowDataset={(bindingId) => setOverlay({ kind: 'dataset', bindingId })}
              />
            </Drawer>
            <MetricsDrawer
              nodeId={selectedNode?.id ?? null}
              nodeName={selectedNode?.name ?? null}
              open={overlay?.kind === 'metrics' && !!selectedNode}
              onClose={() => setOverlay(null)}
              width={OVERLAY_DRAWER_WIDTH}
            />
            <DatasetDrawer
              nodeId={selectedNode?.id ?? null}
              bindingId={overlay?.kind === 'dataset' ? overlay.bindingId : null}
              open={overlay?.kind === 'dataset' && !!selectedNode}
              onClose={() => setOverlay(null)}
              width={OVERLAY_DRAWER_WIDTH}
            />
          </Box>
        </Box>
      </Box>
      {wizardOpen && (
        <Suspense fallback={null}>
          <ActionWizard
            open={wizardOpen}
            onClose={() => {
              setWizardOpen(false);
              setWizardSourceAction(null);
            }}
            nodes={props.nodes}
            edges={props.edges}
            initialSourceAction={wizardSourceAction}
          />
        </Suspense>
      )}
    </NodeGraphInteractionContext>
  );
}

export default function NodeGraphEditor() {
  const { data } = useSuspenseQuery<NodeGraphQuery>(GET_NODE_GRAPH, { fetchPolicy: 'no-cache' });
  const editor = data.instance.editor;

  if (!editor) {
    return (
      <Box
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Suspense fallback={<CircularProgress />}>
      <div style={{ width: '100%', height: '100%' }}>
        <ReactFlowProvider>
          <FlowEditor
            nodes={data.instance.nodes}
            edges={editor.edges}
            outcomeNodeIds={editor.graphLayout.outcomeIds}
            actionGroups={data.instance.actionGroups}
          />
        </ReactFlowProvider>
      </div>
    </Suspense>
  );
}
