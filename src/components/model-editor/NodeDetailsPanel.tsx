import { Suspense, lazy, useCallback, useEffect, useState } from 'react';

import CloseIcon from '@mui/icons-material/Close';
import StorageIcon from '@mui/icons-material/Storage';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  Typography,
} from '@mui/material';

import { useReactFlow } from '@xyflow/react';

import type {
  EditorNodeEdgeFragment,
  EditorNodeFieldsFragment,
} from '@/common/__generated__/graphql';
import { getNodeStyle } from './ElkNode';
import { useNodeMetric } from './metric-viewer/useNodeMetric';
import { getNodeGroup, getNodeSpec, getNodeType } from './nodeHelpers';

function getStyleForNode(node: EditorNodeFieldsFragment) {
  const spec = getNodeSpec(node);
  const typeConfig = spec?.typeConfig;
  const nodeClass =
    typeConfig && 'nodeClass' in typeConfig ? typeConfig.nodeClass : getNodeType(node);
  const isOutcome = node.__typename === 'Node' ? (node.isOutcome ?? false) : false;
  return getNodeStyle(node.kind ?? '', nodeClass ?? '', isOutcome);
}

const MetricDataViewer = lazy(() => import('./metric-viewer/MetricDataViewer'));
const DatasetViewerModal = lazy(() => import('./dataset-viewer/DatasetViewerModal'));

type ConnectedNodeChipProps = {
  nodeId: string;
  label: string;
  style: ReturnType<typeof getNodeStyle>;
  onSelect: (nodeId: string) => void;
  onHover: (nodeId: string | null) => void;
};

function ConnectedNodeChip({ nodeId, label, style, onSelect, onHover }: ConnectedNodeChipProps) {
  return (
    <Chip
      icon={<Box sx={{ color: style.border, display: 'flex' }}>{style.icon}</Box>}
      label={label}
      size="small"
      variant="outlined"
      onClick={() => onSelect(nodeId)}
      onMouseEnter={() => onHover(nodeId)}
      onMouseLeave={() => onHover(null)}
      sx={{
        cursor: 'pointer',
        maxWidth: '100%',
        backgroundColor: style.bg,
        borderColor: style.border,
        color: style.border,
        '& .MuiChip-icon': { color: style.border, ml: '4px' },
      }}
    />
  );
}

export type NodeDetailsPanelProps = {
  node: EditorNodeFieldsFragment | null;
  allNodes: readonly EditorNodeFieldsFragment[];
  edges: readonly EditorNodeEdgeFragment[];
  onClose: () => void;
  onWideContent: (isWide: boolean) => void;
  onSelectNode: (nodeId: string) => void;
};

export default function NodeDetailsPanel({
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
                              style={
                                sourceNode
                                  ? getStyleForNode(sourceNode)
                                  : getNodeStyle('', '', false)
                              }
                              onSelect={handleNavigateToNode}
                              onHover={handleHover}
                            />
                          </Box>
                        );
                      })}
                      {datasetBindings.map((ds) => (
                        <Chip
                          key={ds.dataset.id}
                          icon={<StorageIcon sx={{ fontSize: 18 }} />}
                          label={`${ds.dataset.name} → ${ds.metric.label}`}
                          variant="outlined"
                          color="info"
                          onClick={() => setDatasetModal({ bindingId: ds.id })}
                          sx={{
                            maxWidth: '100%',
                            cursor: 'pointer',
                            height: 32,
                            fontSize: 13,
                            '& .MuiChip-label': { px: 1.25 },
                          }}
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
                              style={
                                targetNode
                                  ? getStyleForNode(targetNode)
                                  : getNodeStyle('', '', false)
                              }
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
