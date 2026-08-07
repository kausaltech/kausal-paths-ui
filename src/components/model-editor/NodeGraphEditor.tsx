import { Suspense, lazy, memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';

import { Box, CircularProgress, Drawer } from '@mui/material';

import { useReactiveVar, useSuspenseQuery } from '@apollo/client/react';
import {
  type Edge,
  type EdgeMouseHandler,
  MarkerType,
  type NodeMouseHandler,
  type OnNodeDrag,
} from '@xyflow/react';
import {
  Background,
  ControlButton,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { ArrowCounterclockwise } from 'react-bootstrap-icons';

import type {
  EditorNodeEdgeFragment,
  EditorNodeFieldsFragment,
  NodeGraphQuery,
} from '@/common/__generated__/graphql';
import { NodeLayoutSource } from '@/common/__generated__/graphql';
import { nodeFiltersVar } from '@/common/cache';
import { useInstance } from '@/common/instance';
import DatasetDrawer from './DatasetDrawer';
import ElkNode, {
  type ElkNodeType,
  type HiddenContextRef,
  NodeGraphInteractionContext,
} from './ElkNode';
import MetricsDrawer from './MetricsDrawer';
import NodeCrudDialogs from './NodeCrudDialogs';
import NodeDetailsPanel from './NodeDetailsPanel';
import NodeDisplaySettingsMenu from './NodeDisplaySettingsMenu';
import NodeGraphContextMenu, { type ContextMenuState } from './NodeGraphContextMenu';
import './NodeGraphEditor.css';
import {
  type CachedPosition,
  type CachedPositionSource,
  clearLayoutCache,
  loadViewport,
  saveUserPosition,
} from './layoutCache';
import {
  computeSnippedEdgeIds,
  computeUpstreamNodeIds,
  convertToElk,
  getNodeBorderColor,
} from './nodeGraphTransforms';
import { GET_NODE_GRAPH, type NodeFieldOverrides, nodeGraphOverridesVar } from './queries';
import { useEditorApolloContext } from './useEditorApolloContext';
import { useEditorPublishState } from './useEditorPublishState';
import { useGraphNavigation } from './useGraphNavigation';
import useLayoutNodes from './useLayoutNodes';
import { useNodeCrudActions } from './useNodeCrudActions';
import { useNodeStatuses } from './useNodeStatuses';
import { useClearNodeLayouts, useUpdateNodeLayouts } from './useUpdateNodeLayouts';

const ActionWizard = lazy(() => import('./action-wizard/ActionWizard'));

const nodeTypes = {
  elk: ElkNode,
};

const DRAWER_WIDTH = 360;
const OVERLAY_DRAWER_WIDTH = 600;
const PANEL_PEEK_WIDTH = 48;
const NODE_POINTER_THRESHOLD = 4;

type FlowCanvasProps = {
  instanceId: string;
  graphNodes: readonly EditorNodeFieldsFragment[];
  nodeMap: ReadonlyMap<string, EditorNodeFieldsFragment>;
  layoutedNodes: ElkNodeType[];
  layoutedEdges: Edge[];
  persistedPositions: Readonly<Record<string, CachedPosition>>;
  inspectedNodeId: string | null;
  layoutResetCounter: number;
  onInspectNode: (nodeId: string | null) => void;
  onResetLayout: () => void;
  onEdgeContextMenu: EdgeMouseHandler;
  onNodeContextMenu: NodeMouseHandler<ElkNodeType>;
  onPaneContextMenu: (event: React.MouseEvent | MouseEvent) => void;
  onSaveLayouts: (
    positions: ReadonlyArray<{ id: string; x: number; y: number }>,
    source: CachedPositionSource
  ) => Promise<void>;
};

/**
 * Owns React Flow's high-frequency interaction state. Nodes are intentionally
 * uncontrolled: dragging updates React Flow's internal store without rendering
 * the editor shell and its drawers on every pointer movement.
 */
const FlowCanvas = memo(function FlowCanvas({
  instanceId,
  graphNodes,
  nodeMap,
  layoutedNodes,
  layoutedEdges,
  persistedPositions,
  inspectedNodeId,
  layoutResetCounter,
  onInspectNode,
  onResetLayout,
  onEdgeContextMenu,
  onNodeContextMenu,
  onPaneContextMenu,
  onSaveLayouts,
}: FlowCanvasProps) {
  const searchParams = useSearchParams();
  const { setEdges, setNodes } = useReactFlow<ElkNodeType>();
  // Captured once so later URL changes don't alter initial viewport behaviour.
  const [initialFitView] = useState(() => searchParams.get('node') === null);
  const [savedViewport] = useState(() => loadViewport(instanceId));

  useEffect(() => {
    // Keep RF selection as canvas-local interaction state when graph data is
    // replaced. Inspection is independent and is not driven by this flag.
    setNodes((prev) => {
      const selectedIds = new Set(prev.filter((n) => n.selected).map((n) => n.id));
      return layoutedNodes.map((n) => (selectedIds.has(n.id) ? { ...n, selected: true } : n));
    });
  }, [layoutedNodes, setNodes]);

  const displayedEdges = useMemo<Edge[]>(() => {
    if (!inspectedNodeId) return layoutedEdges;
    return layoutedEdges.map((edge): Edge => {
      const otherId =
        edge.source === inspectedNodeId
          ? edge.target
          : edge.target === inspectedNodeId
            ? edge.source
            : null;
      if (otherId === null) return edge;
      const other = nodeMap.get(otherId);
      if (!other) return edge;
      const color = getNodeBorderColor(other);
      return {
        ...edge,
        style: { ...edge.style, stroke: color, strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, width: 12, height: 12, color },
        zIndex: 10,
      };
    });
  }, [inspectedNodeId, layoutedEdges, nodeMap]);

  useEffect(() => {
    setEdges(displayedEdges);
  }, [displayedEdges, setEdges]);

  const appliedLayoutNodes = useLayoutNodes(
    instanceId,
    layoutedNodes,
    persistedPositions,
    layoutResetCounter,
    {
      skipFitView: !initialFitView || savedViewport !== null,
      onSaveAutoPositions: (positions) => onSaveLayouts(positions, 'auto'),
    }
  );
  const isLayoutCurrent = appliedLayoutNodes === layoutedNodes;

  const { onMoveEnd } = useGraphNavigation({
    instanceId,
    nodes: graphNodes,
    nodeMap,
    inspectedNodeId,
    onInspectNode,
    isLayoutCurrent,
    savedViewport,
  });

  const handleNodeClick = useCallback<NodeMouseHandler<ElkNodeType>>(
    (_event, node) => {
      onInspectNode(node.id);
    },
    [onInspectNode]
  );

  const handleEdgeClick = useCallback<EdgeMouseHandler>(
    (_event, edge) => {
      onInspectNode(edge.source);
    },
    [onInspectNode]
  );

  const handleNodeDragStop = useCallback<OnNodeDrag<ElkNodeType>>(
    (_event, node, draggedNodes) => {
      const movedNodes = draggedNodes.length > 0 ? draggedNodes : [node];
      for (const movedNode of movedNodes) {
        saveUserPosition(instanceId, movedNode.id, movedNode.position.x, movedNode.position.y);
      }
      void onSaveLayouts(
        movedNodes.map((movedNode) => ({
          id: movedNode.id,
          x: movedNode.position.x,
          y: movedNode.position.y,
        })),
        'user'
      ).catch((err: unknown) => {
        console.error('Failed to persist dragged node layout', err);
      });
    },
    [instanceId, onSaveLayouts]
  );

  return (
    <ReactFlow
      defaultNodes={layoutedNodes}
      defaultEdges={displayedEdges}
      onNodeClick={handleNodeClick}
      onNodeDragStop={handleNodeDragStop}
      onEdgeClick={handleEdgeClick}
      onEdgeContextMenu={onEdgeContextMenu}
      onNodeContextMenu={onNodeContextMenu}
      onPaneClick={() => onInspectNode(null)}
      onPaneContextMenu={onPaneContextMenu}
      onMoveEnd={onMoveEnd}
      nodeTypes={nodeTypes}
      selectNodesOnDrag={false}
      nodeDragThreshold={NODE_POINTER_THRESHOLD}
      nodeClickDistance={NODE_POINTER_THRESHOLD}
      minZoom={0.2}
      maxZoom={5}
      fitViewOptions={{ maxZoom: 1, padding: 0.2 }}
    >
      <Background color="#f0f0f0" />
      <Controls>
        <ControlButton onClick={onResetLayout} title="Reset layout" aria-label="Reset layout">
          <ArrowCounterclockwise />
        </ControlButton>
        <NodeDisplaySettingsMenu />
      </Controls>
      <MiniMap nodeStrokeWidth={3} />
    </ReactFlow>
  );
});

function FlowEditor(props: {
  nodes: readonly EditorNodeFieldsFragment[];
  edges: readonly EditorNodeEdgeFragment[];
  outcomeNodeIds: readonly string[];
  actionGroups: readonly { id: string; name: string; color: string | null }[];
}) {
  const [inspectedNodeId, setInspectedNodeId] = useState<string | null>(null);
  const [userHiddenEdgeIds, setUserHiddenEdgeIds] = useState<ReadonlySet<string>>(() => new Set());
  const [contextMenu, setContextMenu] = useState<ContextMenuState>(null);
  const filters = useReactiveVar(nodeFiltersVar);
  const { screenToFlowPosition } = useReactFlow();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardSourceAction, setWizardSourceAction] = useState<EditorNodeFieldsFragment | null>(
    null
  );
  const [overlay, setOverlay] = useState<
    | { kind: 'metrics'; nodeId: string; nodeName: string | null }
    | { kind: 'dataset'; bindingId: string }
    | null
  >(null);
  const overlayOpen = overlay !== null;

  // Adjust-state-during-render (React's recommended pattern) to reset the
  // overlay when the inspected node changes, without the cascading render that
  // an effect-based reset would cause.
  const [prevInspectedNodeId, setPrevInspectedNodeId] = useState(inspectedNodeId);
  if (prevInspectedNodeId !== inspectedNodeId) {
    setPrevInspectedNodeId(inspectedNodeId);
    setOverlay(null);
  }

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
              upstreamFilteredNodeIds.has(edge.portRef.nodeId)))
      ),
    [props.edges, autoSnippedEdgeIds, userHiddenEdgeIds, upstreamFilteredNodeIds]
  );

  const visibleNodeIdsSet = useMemo(() => new Set(visibleNodes.map((n) => n.id)), [visibleNodes]);

  const snippedConnectionsByNodeId = useMemo(() => {
    const refs = new Map<string, Map<string, HiddenContextRef[]>>();
    for (const edge of props.edges) {
      if (!autoSnippedEdgeIds.has(edge.id)) continue;
      const srcNode = nodeMap.get(edge.fromRef.nodeId);
      const tgtNode = nodeMap.get(edge.portRef.nodeId);
      if (!srcNode || !tgtNode) continue;
      if (!visibleNodeIdsSet.has(edge.portRef.nodeId)) continue;
      const perPort = refs.get(edge.portRef.nodeId) ?? new Map<string, HiddenContextRef[]>();
      const list = perPort.get(edge.portRef.portId) ?? [];
      list.push({ id: srcNode.id, label: srcNode.name, color: getNodeBorderColor(srcNode) });
      perPort.set(edge.portRef.portId, list);
      refs.set(edge.portRef.nodeId, perPort);
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

  const instance = useInstance();
  const instanceId = instance.id;
  const updateNodeLayouts = useUpdateNodeLayouts();
  const clearNodeLayouts = useClearNodeLayouts();
  const persistedPositions = useMemo<Record<string, CachedPosition>>(
    () =>
      Object.fromEntries(
        props.nodes.flatMap((node) => {
          const layout = node.editor?.layout;
          if (!layout) return [];
          return [
            [
              node.id,
              {
                x: layout.x,
                y: layout.y,
                source: layout.source === NodeLayoutSource.User ? 'user' : 'auto',
              },
            ],
          ];
        })
      ),
    [props.nodes]
  );
  const handleSaveLayouts = useCallback(
    (
      positions: ReadonlyArray<{ id: string; x: number; y: number }>,
      source: CachedPositionSource
    ) =>
      updateNodeLayouts(
        positions.map((position) => ({
          nodeId: position.id,
          x: position.x,
          y: position.y,
          source: source === 'user' ? NodeLayoutSource.User : NodeLayoutSource.Auto,
        }))
      ),
    [updateNodeLayouts]
  );

  const [layoutResetCounter, setLayoutResetCounter] = useState(0);
  const handleResetLayout = useCallback(() => {
    void clearNodeLayouts()
      .then(() => {
        clearLayoutCache(instanceId);
        setLayoutResetCounter((counter) => counter + 1);
      })
      .catch((err: unknown) => {
        console.error('Failed to clear persisted node layouts', err);
      });
  }, [clearNodeLayouts, instanceId]);

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

  const onPaneContextMenu = useCallback(
    (event: React.MouseEvent | MouseEvent) => {
      event.preventDefault();
      // Translate the click to flow coordinates so a new node lands where the
      // user right-clicked, regardless of pan/zoom.
      const flow = screenToFlowPosition({ x: event.clientX, y: event.clientY });
      setContextMenu({
        kind: 'pane',
        mouseX: event.clientX,
        mouseY: event.clientY,
        flowX: flow.x,
        flowY: flow.y,
      });
    },
    [screenToFlowPosition]
  );

  const handleHideEdge = useCallback((edgeId: string) => {
    setUserHiddenEdgeIds((prev) => new Set([...prev, edgeId]));
  }, []);

  const handleOpenActionWizard = useCallback(
    (nodeId: string) => {
      const node = nodeMap.get(nodeId);
      if (!node) return;
      setWizardSourceAction(node);
      setWizardOpen(true);
    },
    [nodeMap]
  );

  // Holds a new node's id until it is present in the visible graph. Inspection
  // is editor state, so it does not need to manipulate React Flow selection.
  const [pendingInspectNodeId, setPendingInspectNodeId] = useState<string | null>(null);

  const handleNodeDeleted = useCallback(
    (nodeId: string) => {
      setInspectedNodeId((prev) => (prev === nodeId ? null : prev));
      handleResetLayout();
    },
    [handleResetLayout]
  );

  const crud = useNodeCrudActions({
    instanceId,
    allNodes: props.nodes,
    nodeMap,
    onCreated: setPendingInspectNodeId,
    onDeleted: handleNodeDeleted,
    onSaveLayouts: handleSaveLayouts,
  });

  // Adjust state during render once a newly created node reaches graph data.
  if (
    pendingInspectNodeId !== null &&
    visibleNodes.some((node) => node.id === pendingInspectNodeId)
  ) {
    setInspectedNodeId(pendingInspectNodeId);
    setPendingInspectNodeId(null);
  }

  const handleSnippedNodeClick = useCallback((nodeId: string) => {
    setInspectedNodeId(nodeId);
  }, []);

  const interactionCtx = useMemo(
    () => ({
      highlightedNodeIds,
      activeNodeId: inspectedNodeId,
      onHiddenContextClick: handleSnippedNodeClick,
    }),
    [highlightedNodeIds, inspectedNodeId, handleSnippedNodeClick]
  );

  const inspectedNode = inspectedNodeId ? (nodeMap.get(inspectedNodeId) ?? null) : null;

  return (
    <NodeGraphInteractionContext value={interactionCtx}>
      <Box sx={{ display: 'flex', width: '100%', height: '100%' }}>
        <Box sx={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ flex: 1, position: 'relative' }}>
            <FlowCanvas
              instanceId={instanceId}
              graphNodes={props.nodes}
              nodeMap={nodeMap}
              layoutedNodes={layoutedNodes}
              layoutedEdges={layoutedEdges}
              persistedPositions={persistedPositions}
              inspectedNodeId={inspectedNodeId}
              layoutResetCounter={layoutResetCounter}
              onInspectNode={setInspectedNodeId}
              onResetLayout={handleResetLayout}
              onEdgeContextMenu={onEdgeContextMenu}
              onNodeContextMenu={onNodeContextMenu}
              onPaneContextMenu={onPaneContextMenu}
              onSaveLayouts={handleSaveLayouts}
            />
            <NodeGraphContextMenu
              state={contextMenu}
              onClose={() => setContextMenu(null)}
              onHideEdge={handleHideEdge}
              onOpenActionWizard={handleOpenActionWizard}
              onDuplicateNode={crud.duplicateNode}
              onDeleteNode={crud.requestDeleteNode}
              onNewNode={crud.createNodeAt}
            />
            <Drawer
              variant="persistent"
              anchor="right"
              open={!!inspectedNode}
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
                node={inspectedNode}
                allNodes={props.nodes}
                edges={props.edges}
                actionGroups={props.actionGroups}
                onClose={() => setInspectedNodeId(null)}
                onSelectNode={setInspectedNodeId}
                onShowMetrics={(nodeId, nodeName) =>
                  setOverlay({ kind: 'metrics', nodeId, nodeName })
                }
                onShowDataset={(bindingId) => setOverlay({ kind: 'dataset', bindingId })}
              />
            </Drawer>
            <MetricsDrawer
              nodeId={overlay?.kind === 'metrics' ? overlay.nodeId : null}
              nodeName={overlay?.kind === 'metrics' ? overlay.nodeName : null}
              open={overlay?.kind === 'metrics'}
              onClose={() => setOverlay(null)}
              width={OVERLAY_DRAWER_WIDTH}
            />
            <DatasetDrawer
              nodeId={inspectedNode?.id ?? null}
              bindingId={overlay?.kind === 'dataset' ? overlay.bindingId : null}
              open={overlay?.kind === 'dataset' && !!inspectedNode}
              onClose={() => setOverlay(null)}
              width={OVERLAY_DRAWER_WIDTH}
            />
          </Box>
        </Box>
      </Box>
      {wizardOpen && (
        <Suspense fallback={null}>
          <ActionWizard
            key={wizardSourceAction?.id ?? 'blank'}
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
      <NodeCrudDialogs crud={crud} />
    </NodeGraphInteractionContext>
  );
}

function applyOverride(
  node: EditorNodeFieldsFragment,
  override: NodeFieldOverrides
): EditorNodeFieldsFragment {
  const merged: EditorNodeFieldsFragment = { ...node };
  if (override.name !== undefined) merged.name = override.name;
  if (override.shortName !== undefined) merged.shortName = override.shortName;
  if (override.description !== undefined) merged.description = override.description;
  if (override.color !== undefined) merged.color = override.color;
  if (override.isVisible !== undefined) merged.isVisible = override.isVisible;
  if (override.isOutcome !== undefined && merged.__typename === 'Node') {
    merged.isOutcome = override.isOutcome;
  }
  if (override.nodeGroup !== undefined && merged.editor) {
    merged.editor = { ...merged.editor, nodeGroup: override.nodeGroup };
  }
  return merged;
}

export default function NodeGraphEditor() {
  const editorContext = useEditorApolloContext();
  const { data } = useSuspenseQuery<NodeGraphQuery>(GET_NODE_GRAPH, {
    fetchPolicy: 'no-cache',
    context: editorContext,
  });
  const overrides = useReactiveVar(nodeGraphOverridesVar);
  // Keeps draftHeadTokenVar current while the graph is open.
  useEditorPublishState();
  // Seeds init-time node status and asynchronously fetches compute-phase status.
  useNodeStatuses(data.instance.nodes);
  const editor = data.instance.editor;

  const nodesWithOverrides = useMemo(() => {
    if (Object.keys(overrides).length === 0) return data.instance.nodes;
    return data.instance.nodes.map((node) => {
      const override = overrides[node.id];
      return override ? applyOverride(node, override) : node;
    });
  }, [data.instance.nodes, overrides]);

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
            nodes={nodesWithOverrides}
            edges={editor.edges}
            outcomeNodeIds={editor.graphLayout.outcomeIds}
            actionGroups={data.instance.actionGroups}
          />
        </ReactFlowProvider>
      </div>
    </Suspense>
  );
}
