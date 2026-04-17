import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import StorageIcon from '@mui/icons-material/Storage';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Drawer,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from '@mui/material';

import { gql } from '@apollo/client';
import { useSuspenseQuery } from '@apollo/client/react';
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
import ElkNode, {
  type ElkNodeType,
  type HiddenContextRef,
  NodeGraphInteractionContext,
} from './ElkNode';
import NodeGraphContextMenu, { type ContextMenuState } from './NodeGraphContextMenu';
import './NodeGraphEditor.css';
import { useNodeMetric } from './metric-viewer/useNodeMetric';
import useLayoutNodes from './useLayoutNodes';

const ActionWizard = lazy(() => import('./action-wizard/ActionWizard'));
const MetricDataViewer = lazy(() => import('./metric-viewer/MetricDataViewer'));
const DatasetViewerModal = lazy(() => import('./dataset-viewer/DatasetViewerModal'));

const nodeTypes = {
  elk: ElkNode,
};

const GET_NODE_GRAPH = gql`
  query NodeGraph {
    instance {
      id
      identifier
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
    color
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

const DRAWER_WIDTH_NARROW = 320;
const DRAWER_WIDTH_WIDE = 700;

const ALL_OUTCOMES = '__all__';

function getNodeSpec(node: EditorNodeFieldsFragment) {
  return node.editor?.spec ?? null;
}

function getNodeLayoutMeta(node: EditorNodeFieldsFragment) {
  return node.editor?.layoutMeta ?? null;
}

function getNodeType(node: EditorNodeFieldsFragment) {
  return node.editor?.nodeType ?? '';
}

function getNodeGroup(node: EditorNodeFieldsFragment) {
  return node.editor?.nodeGroup ?? null;
}

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
  hiddenContextSourcesByNodeId: ReadonlyMap<string, HiddenContextRef[]>
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
    const tgtHandles = inputPorts.map((p) => ({
      id: p.id,
      multi: p.multi,
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
        hiddenContextSources: hiddenContextSourcesByNodeId.get(node.id) ?? [],
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
    .map(
      (edge) =>
        ({
          id: edge.id,
          source: edge.fromRef.nodeId,
          sourceHandle: edge.fromRef.portId,
          target: edge.toRef.nodeId,
          targetHandle: edge.toRef.portId,
          markerEnd: EDGE_MARKER,
        }) satisfies Edge
    );

  return { nodes: elkNodes, edges: elkEdges };
}

type NodeDetailsPanelProps = {
  node: EditorNodeFieldsFragment | null;
  allNodes: readonly EditorNodeFieldsFragment[];
  edges: readonly EditorNodeEdgeFragment[];
  onClose: () => void;
  onWideContent: (isWide: boolean) => void;
  onSelectNode: (nodeId: string) => void;
};

function ConnectedNodeChip({
  nodeId,
  label,
  isDataset,
  onSelect,
  onHover,
}: {
  nodeId: string;
  label: string;
  isDataset: boolean;
  onSelect: (nodeId: string) => void;
  onHover: (nodeId: string | null) => void;
}) {
  return (
    <Chip
      label={label}
      size="small"
      variant="outlined"
      color={isDataset ? 'info' : 'default'}
      onClick={() => onSelect(nodeId)}
      onMouseEnter={() => onHover(nodeId)}
      onMouseLeave={() => onHover(null)}
      sx={{ cursor: 'pointer', maxWidth: '100%' }}
    />
  );
}

function NodeDetailsPanel({
  node,
  allNodes,
  edges,
  onClose,
  onWideContent,
  onSelectNode,
}: NodeDetailsPanelProps) {
  const {
    portMetrics,
    loading: metricsLoading,
    fetch: fetchMetrics,
  } = useNodeMetric(node?.id ?? null);
  const { fitView, getNodes } = useReactFlow();
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [datasetModal, setDatasetModal] = useState<{ bindingId: string } | null>(null);

  const hasMetrics = portMetrics.length > 0;
  useEffect(() => {
    onWideContent(hasMetrics);
  }, [hasMetrics, onWideContent]);

  const handleNavigateToNode = useCallback(
    (targetNodeId: string) => {
      const rfNodes = getNodes();
      const targetRfNode = rfNodes.find((n) => n.id === targetNodeId);
      if (targetRfNode) {
        void fitView({ nodes: [targetRfNode], duration: 400, padding: 0.5 });
      }
      onSelectNode(targetNodeId);
    },
    [getNodes, fitView, onSelectNode]
  );

  const handleHover = useCallback((nodeId: string | null) => {
    setHoveredNodeId(nodeId);
  }, []);

  if (!node) return null;

  const nodeMap = new Map(allNodes.map((n) => [n.id, n]));
  const spec = getNodeSpec(node);
  const typeConfig = spec?.typeConfig;
  const nodeClass = typeConfig && 'nodeClass' in typeConfig ? typeConfig.nodeClass : null;

  const incomingByPort = new Map<string, EditorNodeEdgeFragment[]>();
  for (const e of edges.filter((e) => e.toRef.nodeId === node.id)) {
    const portId = e.toRef.portId;
    const list = incomingByPort.get(portId) ?? [];
    list.push(e);
    incomingByPort.set(portId, list);
  }

  const outgoingByPort = new Map<string, EditorNodeEdgeFragment[]>();
  for (const e of edges.filter((e) => e.fromRef.nodeId === node.id)) {
    const portId = e.fromRef.portId;
    const list = outgoingByPort.get(portId) ?? [];
    list.push(e);
    outgoingByPort.set(portId, list);
  }

  const inputPorts = spec?.inputPorts ?? [];
  const outputPorts = spec?.outputPorts ?? [];

  const isDatasetNode = (n: EditorNodeFieldsFragment | undefined) =>
    n != null && getNodeType(n).toLowerCase().includes('dataset');

  return (
    <Box sx={{ p: 2 }}>
      <Box
        sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}
      >
        <Typography
          variant="h6"
          sx={{ fontSize: 16, fontWeight: 600, lineHeight: 1.3, flex: 1, mr: 1 }}
        >
          {node.name}
        </Typography>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: 'block', mb: 1.5, fontFamily: 'monospace' }}
      >
        {node.identifier}
      </Typography>

      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 2 }}>
        <Chip label={node.kind} size="small" variant="outlined" />
        <Chip
          label={(nodeClass ?? getNodeType(node)).split('.').pop()}
          size="small"
          variant="outlined"
        />
        {node.__typename === 'Node' && node.isOutcome && (
          <Chip label="outcome" size="small" color="primary" />
        )}
        {getNodeGroup(node) && <Chip label={getNodeGroup(node)} size="small" variant="outlined" />}
      </Box>

      <Divider sx={{ mb: 1.5 }} />

      {inputPorts.length > 0 && (
        <>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Inputs
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 2 }}>
            {inputPorts.map((port, portIdx) => {
              const connectedEdges = incomingByPort.get(port.id) ?? [];
              type DatasetBinding = Extract<
                (typeof port.bindings)[number],
                { __typename: 'DatasetPortType' }
              >;
              type BoundDatasetBinding = DatasetBinding & {
                dataset: NonNullable<DatasetBinding['dataset']>;
                metric: NonNullable<DatasetBinding['metric']>;
              };
              const datasetBindings = port.bindings.filter(
                (b): b is BoundDatasetBinding =>
                  b.__typename === 'DatasetPortType' && b.dataset != null && b.metric != null
              );
              const hasConnections = connectedEdges.length > 0 || datasetBindings.length > 0;

              return (
                <Box key={port.id}>
                  <Typography
                    variant="body2"
                    sx={{ fontSize: 12, color: 'text.secondary', mb: 0.5 }}
                  >
                    {port.label ?? `Input #${portIdx + 1}`}
                    {port.multi ? ' (multi)' : ''}
                  </Typography>
                  {hasConnections ? (
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {connectedEdges.map((e) => {
                        const sourceNode = nodeMap.get(e.fromRef.nodeId);
                        const highlighted = hoveredNodeId === e.fromRef.nodeId;
                        return (
                          <Box
                            key={e.id}
                            sx={
                              highlighted
                                ? {
                                    '& .MuiChip-root': {
                                      borderColor: 'primary.main',
                                      bgcolor: 'action.hover',
                                    },
                                  }
                                : undefined
                            }
                          >
                            <ConnectedNodeChip
                              nodeId={e.fromRef.nodeId}
                              label={sourceNode?.name ?? e.fromRef.nodeId}
                              isDataset={isDatasetNode(sourceNode)}
                              onSelect={handleNavigateToNode}
                              onHover={handleHover}
                            />
                          </Box>
                        );
                      })}
                      {datasetBindings.map((ds) => (
                        <Chip
                          key={ds.dataset.id}
                          icon={<StorageIcon sx={{ fontSize: 14 }} />}
                          label={`${ds.dataset.name} → ${ds.metric.label}`}
                          size="small"
                          variant="outlined"
                          color="info"
                          onClick={() => setDatasetModal({ bindingId: ds.id })}
                          sx={{ maxWidth: '100%', cursor: 'pointer' }}
                        />
                      ))}
                    </Box>
                  ) : (
                    <Typography variant="caption" color="text.disabled">
                      Not connected
                    </Typography>
                  )}
                </Box>
              );
            })}
          </Box>
        </>
      )}

      {outputPorts.length > 0 && (
        <>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Outputs
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 2 }}>
            {outputPorts.map((port, portIdx) => {
              const connectedEdges = outgoingByPort.get(port.id) ?? [];
              return (
                <Box key={port.id}>
                  <Typography
                    variant="body2"
                    sx={{ fontSize: 12, color: 'text.secondary', mb: 0.5 }}
                  >
                    {port.label ?? `Output #${portIdx + 1}`}
                  </Typography>
                  {connectedEdges.length > 0 ? (
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {connectedEdges.map((e) => {
                        const targetNode = nodeMap.get(e.toRef.nodeId);
                        const highlighted = hoveredNodeId === e.toRef.nodeId;
                        return (
                          <Box
                            key={e.id}
                            sx={
                              highlighted
                                ? {
                                    '& .MuiChip-root': {
                                      borderColor: 'primary.main',
                                      bgcolor: 'action.hover',
                                    },
                                  }
                                : undefined
                            }
                          >
                            <ConnectedNodeChip
                              nodeId={e.toRef.nodeId}
                              label={targetNode?.name ?? e.toRef.nodeId}
                              isDataset={isDatasetNode(targetNode)}
                              onSelect={handleNavigateToNode}
                              onHover={handleHover}
                            />
                          </Box>
                        );
                      })}
                    </Box>
                  ) : (
                    <Typography variant="caption" color="text.disabled">
                      Not connected
                    </Typography>
                  )}
                </Box>
              );
            })}
          </Box>
        </>
      )}

      <Divider sx={{ my: 1.5 }} />

      {portMetrics.length === 0 ? (
        <Button
          variant="outlined"
          size="small"
          onClick={fetchMetrics}
          disabled={metricsLoading}
          startIcon={metricsLoading ? <CircularProgress size={14} /> : undefined}
          fullWidth
        >
          {metricsLoading ? 'Loading data...' : 'Load output data'}
        </Button>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {portMetrics.map((pm) => (
            <Box key={pm.portId}>
              <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                {pm.portLabel ?? pm.quantity ?? pm.portId}
              </Typography>
              {pm.metric ? (
                <Suspense fallback={<CircularProgress size={20} />}>
                  <MetricDataViewer metric={pm.metric} compact />
                </Suspense>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No data available
                </Typography>
              )}
            </Box>
          ))}
        </Box>
      )}

      {datasetModal && node && (
        <Suspense>
          <DatasetViewerModal
            open
            onClose={() => setDatasetModal(null)}
            nodeId={node.id}
            bindingId={datasetModal.bindingId}
          />
        </Suspense>
      )}
    </Box>
  );
}

function FlowEditor(props: {
  nodes: readonly EditorNodeFieldsFragment[];
  edges: readonly EditorNodeEdgeFragment[];
  outcomeNodeIds: readonly string[];
}) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [userHiddenEdgeIds, setUserHiddenEdgeIds] = useState<ReadonlySet<string>>(() => new Set());
  const [contextMenu, setContextMenu] = useState<ContextMenuState>(null);
  const [selectedOutcomeId, setSelectedOutcomeId] = useState<string>(ALL_OUTCOMES);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardSourceAction, setWizardSourceAction] = useState<EditorNodeFieldsFragment | null>(
    null
  );
  const [drawerWide, setDrawerWide] = useState(false);

  const drawerWidth = drawerWide ? DRAWER_WIDTH_WIDE : DRAWER_WIDTH_NARROW;

  const handleDrawerWideContent = useCallback((isWide: boolean) => {
    setDrawerWide(isWide);
  }, []);

  const nodeMap = useMemo(() => new Map(props.nodes.map((n) => [n.id, n])), [props.nodes]);

  const allNodeIdsSet = useMemo(() => new Set(props.nodes.map((n) => n.id)), [props.nodes]);

  const outcomeNodes = useMemo(
    () =>
      props.outcomeNodeIds
        .map((id) => nodeMap.get(id))
        .filter((n): n is EditorNodeFieldsFragment => Boolean(n)),
    [props.outcomeNodeIds, nodeMap]
  );

  const autoSnippedEdgeIds = useMemo(
    () => computeSnippedEdgeIds(props.edges, props.nodes),
    [props.edges, props.nodes]
  );

  const upstreamFilteredNodeIds = useMemo(() => {
    if (selectedOutcomeId === ALL_OUTCOMES) return null;
    return computeUpstreamNodeIds(new Set([selectedOutcomeId]), props.edges, allNodeIdsSet);
  }, [selectedOutcomeId, props.edges, allNodeIdsSet]);

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
    const refs = new Map<string, HiddenContextRef[]>();
    for (const edge of props.edges) {
      if (!autoSnippedEdgeIds.has(edge.id)) continue;
      const srcNode = nodeMap.get(edge.fromRef.nodeId);
      const tgtNode = nodeMap.get(edge.toRef.nodeId);
      if (!srcNode || !tgtNode) continue;
      if (!visibleNodeIdsSet.has(edge.toRef.nodeId)) continue;
      const list = refs.get(edge.toRef.nodeId) ?? [];
      list.push({ id: srcNode.id, label: srcNode.name });
      refs.set(edge.toRef.nodeId, list);
    }
    for (const [, list] of refs) {
      list.sort((a, b) => a.label.localeCompare(b.label));
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

  useLayoutNodes(layoutVersion);

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
      onHiddenContextClick: handleSnippedNodeClick,
    }),
    [highlightedNodeIds, handleSnippedNodeClick]
  );

  const selectedNode = selectedNodeId ? (nodeMap.get(selectedNodeId) ?? null) : null;

  return (
    <NodeGraphInteractionContext value={interactionCtx}>
      <Box sx={{ display: 'flex', width: '100%', height: '100%' }}>
        <Box sx={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column' }}>
          <Box
            sx={{
              px: 1.5,
              py: 1,
              borderBottom: '1px solid #e0e0e0',
              backgroundColor: '#fafafa',
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 1,
            }}
          >
            <Button
              variant="outlined"
              size="small"
              startIcon={<ContentCopyIcon />}
              onClick={() => {
                setWizardSourceAction(null);
                setWizardOpen(true);
              }}
              sx={{ flexShrink: 0 }}
            >
              Duplicate action
            </Button>
            {outcomeNodes.length > 1 && (
              <>
                <Box sx={{ flex: 1 }} />
                <FormControl size="small" sx={{ minWidth: 220 }}>
                  <InputLabel id="outcome-select-label">Outcome node</InputLabel>
                  <Select
                    labelId="outcome-select-label"
                    label="Outcome node"
                    value={selectedOutcomeId}
                    onChange={(e) => setSelectedOutcomeId(e.target.value)}
                  >
                    <MenuItem value={ALL_OUTCOMES}>All outcomes</MenuItem>
                    {outcomeNodes.map((n) => (
                      <MenuItem key={n.id} value={n.id}>
                        {n.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </>
            )}
          </Box>
          <Box sx={{ flex: 1, position: 'relative' }}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
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
                  sx: {
                    width: drawerWidth,
                    maxWidth: 'none',
                    boxShadow: 10,
                    transition: 'width 0.2s ease-in-out',
                  },
                },
              }}
            >
              <NodeDetailsPanel
                node={selectedNode}
                allNodes={props.nodes}
                edges={props.edges}
                onClose={() => {
                  setSelectedNodeId(null);
                  setDrawerWide(false);
                }}
                onWideContent={handleDrawerWideContent}
                onSelectNode={setSelectedNodeId}
              />
            </Drawer>
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
      <div style={{ width: '100vw', height: '100vh' }}>
        <ReactFlowProvider>
          <FlowEditor
            nodes={data.instance.nodes}
            edges={editor.edges}
            outcomeNodeIds={editor.graphLayout.outcomeIds}
          />
        </ReactFlowProvider>
      </div>
    </Suspense>
  );
}
