import { useCallback, useState } from 'react';

import { Box, Chip, Divider, IconButton, Typography } from '@mui/material';

import { useReactFlow } from '@xyflow/react';
import { BarChartLine, Database, X } from 'react-bootstrap-icons';

import type {
  EditorNodeEdgeFragment,
  EditorNodeFieldsFragment,
} from '@/common/__generated__/graphql';
import { type NodeStyle, getNodeStyle } from './ElkNode';
import { getNodeGroup, getNodeSpec, getNodeType } from './nodeHelpers';

function getStyleForNode(node: EditorNodeFieldsFragment): NodeStyle {
  const spec = getNodeSpec(node);
  const typeConfig = spec?.typeConfig;
  const nodeClass: string =
    typeConfig && 'nodeClass' in typeConfig ? typeConfig.nodeClass : getNodeType(node);
  const isOutcome = node.__typename === 'Node' ? (node.isOutcome ?? false) : false;
  const kind: string = node.kind ?? '';
  return getNodeStyle(kind, nodeClass, isOutcome);
}

type ConnectedNodeChipProps = {
  nodeId: string;
  label: string;
  style: ReturnType<typeof getNodeStyle>;
  onSelect: (nodeId: string) => void;
  onHover: (nodeId: string | null) => void;
};

const CHIP_LABEL_MAX = 35;

function ConnectedNodeChip({ nodeId, label, style, onSelect, onHover }: ConnectedNodeChipProps) {
  const truncated =
    label.length > CHIP_LABEL_MAX ? `${label.slice(0, CHIP_LABEL_MAX - 1)}…` : label;
  return (
    <Chip
      icon={<Box sx={{ color: style.border, display: 'flex' }}>{style.icon}</Box>}
      label={truncated}
      title={label}
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
  onSelectNode: (nodeId: string) => void;
  onShowMetrics?: () => void;
  onShowDataset?: (bindingId: string) => void;
};

export default function NodeDetailsPanel({
  node,
  allNodes,
  edges,
  onClose,
  onSelectNode,
  onShowMetrics,
  onShowDataset,
}: NodeDetailsPanelProps) {
  const { fitView, getNodes } = useReactFlow();
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

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

  const headerStyle = getStyleForNode(node);

  return (
    <Box sx={{ p: 2 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 1,
          mb: 1,
          mx: -2,
          mt: -2,
          px: 2,
          py: 1.5,
          backgroundColor: headerStyle.bg,
          borderBottom: `2px solid ${headerStyle.border}`,
        }}
      >
        <Box
          sx={{
            color: headerStyle.border,
            display: 'flex',
            alignItems: 'center',
            '& .MuiSvgIcon-root': { fontSize: 20 },
            mt: '2px',
          }}
        >
          {headerStyle.icon}
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              color: headerStyle.border,
              fontWeight: 600,
              fontSize: 10,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              lineHeight: 1,
              mb: 0.5,
            }}
          >
            {headerStyle.label}
          </Typography>
          <Typography variant="h6" sx={{ fontSize: 16, fontWeight: 600, lineHeight: 1.3 }}>
            {node.name}
          </Typography>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ mt: '-4px', mr: '-4px' }}>
          <X size={20} />
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
                          icon={<Database size={18} />}
                          label={`${ds.dataset.name} → ${ds.metric.label}`}
                          variant="outlined"
                          color="info"
                          onClick={() => onShowDataset?.(ds.id)}
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

      <Chip
        icon={<BarChartLine size={18} />}
        label="Output data"
        variant="outlined"
        color="info"
        onClick={onShowMetrics}
        sx={{
          maxWidth: '100%',
          cursor: 'pointer',
          height: 32,
          fontSize: 13,
          '& .MuiChip-label': { px: 1.25 },
        }}
      />
    </Box>
  );
}
