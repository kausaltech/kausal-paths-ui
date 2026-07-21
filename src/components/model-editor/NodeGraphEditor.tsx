import { Suspense, lazy, useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';

import { Box, CircularProgress, Drawer } from '@mui/material';

import { useReactiveVar, useSuspenseQuery } from '@apollo/client/react';
import {
  type Edge,
  MarkerType,
  type NodeChange,
  type OnNodesChange,
  type OnSelectionChangeFunc,
} from '@xyflow/react';
import {
  Background,
  ControlButton,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { ArrowCounterclockwise } from 'react-bootstrap-icons';

import type {
  EditorNodeEdgeFragment,
  EditorNodeFieldsFragment,
  NodeGraphQuery,
} from '@/common/__generated__/graphql';
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
import NodeGraphContextMenu, { type ContextMenuState } from './NodeGraphContextMenu';
import './NodeGraphEditor.css';
import { clearLayoutCache, loadViewport, saveUserPosition } from './layoutCache';
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

const ActionWizard = lazy(() => import('./action-wizard/ActionWizard'));

const nodeTypes = {
  elk: ElkNode,
};

const DRAWER_WIDTH = 360;
const OVERLAY_DRAWER_WIDTH = 600;
const PANEL_PEEK_WIDTH = 48;

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
  const { screenToFlowPosition } = useReactFlow();
  // Captured once so later URL changes (e.g. deselecting a node) don't
  // re-toggle RF's built-in `fitView` prop and refit the whole graph.
  const [initialFitView] = useState(() => searchParams.get('node') === null);
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
  // overlay when the selected node changes, without the cascading render that
  // an effect-based reset would cause.
  const [prevSelectedNodeId, setPrevSelectedNodeId] = useState(selectedNodeId);
  if (prevSelectedNodeId !== selectedNodeId) {
    setPrevSelectedNodeId(selectedNodeId);
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

  const instance = useInstance();
  const instanceId = instance.id;

  // Captured once on mount: the viewport (pan + zoom) the user left this
  // instance at. When present (and not overridden by a deep-link), we restore
  // it instead of fitting the whole graph — see useGraphNavigation.
  const [savedViewport] = useState(() => loadViewport(instanceId));

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges);

  const handleNodesChange = useCallback<OnNodesChange<ElkNodeType>>(
    (changes: NodeChange<ElkNodeType>[]) => {
      onNodesChange(changes);
      for (const change of changes) {
        if (
          change.type === 'position' &&
          change.dragging === false &&
          change.position !== undefined
        ) {
          saveUserPosition(instanceId, change.id, change.position.x, change.position.y);
        }
      }
    },
    [onNodesChange, instanceId]
  );

  const [resetCounter, setResetCounter] = useState(0);
  const handleResetLayout = useCallback(() => {
    clearLayoutCache(instanceId);
    setResetCounter((c) => c + 1);
  }, [instanceId]);

  useEffect(() => {
    // Functional updater preserves the `selected` flag from the current RF
    // state so replacing nodes after a save doesn't close the details panel.
    setNodes((prev) => {
      const selectedIds = new Set(prev.filter((n) => n.selected).map((n) => n.id));
      return layoutedNodes.map((n) => (selectedIds.has(n.id) ? { ...n, selected: true } : n));
    });
    setEdges(layoutedEdges);
  }, [layoutedEdges, layoutedNodes, setEdges, setNodes]);

  const appliedLayoutNodes = useLayoutNodes(instanceId, layoutedNodes, resetCounter, {
    // Suppress the initial fit when we have a saved viewport to restore
    // (useGraphNavigation sets it once layout is current), so the graph doesn't
    // flash "show everything" before snapping to the user's last view.
    skipFitView: !initialFitView || savedViewport !== null,
  });
  const isLayoutCurrent = appliedLayoutNodes === layoutedNodes;

  const { onMoveEnd } = useGraphNavigation({
    instanceId,
    nodes: props.nodes,
    nodeMap,
    selectedNodeId,
    isLayoutCurrent,
    savedViewport,
    setNodes,
  });

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

  // Holds a new node's id (from create / duplicate) until it's present in
  // React Flow's own node state, so the selection block below can attach the
  // `selected` flag.
  const [pendingSelectNodeId, setPendingSelectNodeId] = useState<string | null>(null);

  const handleNodeDeleted = useCallback(
    (nodeId: string) => {
      setSelectedNodeId((prev) => (prev === nodeId ? null : prev));
      handleResetLayout();
    },
    [handleResetLayout]
  );

  const crud = useNodeCrudActions({
    instanceId,
    allNodes: props.nodes,
    nodeMap,
    onCreated: setPendingSelectNodeId,
    onDeleted: handleNodeDeleted,
  });

  // Adjust-state-during-render: once the copy is present in React Flow's own
  // node state, drive RF's selection to it (which fires `onSelectionChange` →
  // opens the details panel). Gating on RF state lets the `selected` flag
  // actually attach; an effect-based version would trip the cascading-render
  // lint and add a render hop.
  if (pendingSelectNodeId !== null && nodes.some((n) => n.id === pendingSelectNodeId)) {
    setNodes((prev) => prev.map((n) => ({ ...n, selected: n.id === pendingSelectNodeId })));
    setPendingSelectNodeId(null);
  }

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
              onNodesChange={handleNodesChange}
              onEdgesChange={onEdgesChange}
              onSelectionChange={onSelectionChange}
              onEdgeClick={onEdgeClick}
              onEdgeContextMenu={onEdgeContextMenu}
              onNodeContextMenu={onNodeContextMenu}
              onPaneContextMenu={onPaneContextMenu}
              onMoveEnd={onMoveEnd}
              nodeTypes={nodeTypes}
              minZoom={0.2}
              maxZoom={5}
              fitViewOptions={{ maxZoom: 1, padding: 0.2 }}
            >
              <Background color="#f0f0f0" />
              <Controls>
                <ControlButton
                  onClick={handleResetLayout}
                  title="Reset layout"
                  aria-label="Reset layout"
                >
                  <ArrowCounterclockwise />
                </ControlButton>
              </Controls>
              <MiniMap nodeStrokeWidth={3} />
            </ReactFlow>
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
