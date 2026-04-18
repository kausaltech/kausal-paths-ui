import { type ReactNode, useCallback, useState } from 'react';

import { Box, Chip, Collapse, IconButton, Typography } from '@mui/material';

import { useReactFlow } from '@xyflow/react';
import {
  BarChartLine,
  ChevronDown,
  ChevronRight,
  DashCircle,
  Database,
  X,
} from 'react-bootstrap-icons';

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

const metaChipSx = {
  height: 20,
  '& .MuiChip-label': { px: 0.75, fontSize: 10, color: 'text.secondary' },
};

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
        borderRadius: 1,
        backgroundColor: 'grey.100',
        borderColor: style.border,
        color: style.border,
        '& .MuiChip-icon': { color: style.border, ml: '4px' },
      }}
    />
  );
}

type CollapsibleSectionProps = {
  title: ReactNode;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
};

function CollapsibleSection({ title, open, onToggle, children }: CollapsibleSectionProps) {
  return (
    <Box
      sx={{
        mb: 0.5,
        pt: 0.5,
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Box
        onClick={onToggle}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          cursor: 'pointer',
          userSelect: 'none',
          mb: 0.5,
          px: 0.5,
        }}
      >
        {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        <Typography variant="subtitle2" sx={{ fontSize: 12 }}>
          {title}
        </Typography>
      </Box>
      <Collapse in={open}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, px: 1, py: 2 }}>
          {children}
        </Box>
      </Collapse>
    </Box>
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
  const { setCenter, getZoom, getNodes } = useReactFlow();
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [inputOpen, setInputOpen] = useState(true);
  const [outputOpen, setOutputOpen] = useState(true);
  const [nodeDataOpen, setNodeDataOpen] = useState(true);

  const handleNavigateToNode = useCallback(
    (targetNodeId: string) => {
      const rfNodes = getNodes();
      const targetRfNode = rfNodes.find((n) => n.id === targetNodeId);
      if (targetRfNode) {
        const width = targetRfNode.measured?.width ?? targetRfNode.width ?? 0;
        const height = targetRfNode.measured?.height ?? targetRfNode.height ?? 0;
        const cx = targetRfNode.position.x + width / 2;
        const cy = targetRfNode.position.y + height / 2;
        void setCenter(cx, cy, { zoom: getZoom(), duration: 400 });
      }
      onSelectNode(targetNodeId);
    },
    [getNodes, setCenter, getZoom, onSelectNode]
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
    <Box sx={{ p: 0 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 1,
          mb: 1,
          px: 2,
          py: 1.5,
          backgroundColor: 'grey.100',
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

      <CollapsibleSection
        title="Details"
        open={detailsOpen}
        onToggle={() => setDetailsOpen((v) => !v)}
      >
        <Box
          sx={{
            width: '100%',
            bgcolor: 'grey.100',
            borderRadius: 0.5,
            px: 1,
            py: 0.5,
            overflowX: 'auto',
          }}
        >
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              display: 'block',
              fontFamily: 'monospace',
              fontSize: 10,
              whiteSpace: 'nowrap',
            }}
          >
            {node.identifier}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
          <Chip label={node.kind} size="small" variant="outlined" sx={metaChipSx} />
          <Chip
            label={(nodeClass ?? getNodeType(node)).split('.').pop()}
            size="small"
            variant="outlined"
            sx={metaChipSx}
          />
          {node.quantityKind && (
            <Chip
              label={`${node.quantityKind.icon ?? ''} ${node.quantityKind.label}`.trim()}
              title={`quantityKind: ${node.quantityKind.id}`}
              size="small"
              variant="outlined"
              sx={metaChipSx}
            />
          )}
          {node.__typename === 'Node' && node.isOutcome && (
            <Chip label="outcome" size="small" color="primary" sx={metaChipSx} />
          )}
          {getNodeGroup(node) && (
            <Chip label={getNodeGroup(node)} size="small" variant="outlined" sx={metaChipSx} />
          )}
        </Box>
      </CollapsibleSection>

      {inputPorts.length > 0 && (
        <CollapsibleSection
          title={`Input ports (${inputPorts.length})`}
          open={inputOpen}
          onToggle={() => setInputOpen((v) => !v)}
        >
          {inputPorts.map((port, index) => {
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
                <Typography variant="body2" sx={{ fontSize: 10, color: 'text.secondary', mb: 0 }}>
                  {port.label ?? `Port #${index + 1}`}
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
                              sourceNode ? getStyleForNode(sourceNode) : getNodeStyle('', '', false)
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
                        title={`${ds.dataset.name} → ${ds.metric.label}`}
                        variant="outlined"
                        onClick={() => onShowDataset?.(ds.id)}
                        sx={{
                          maxWidth: '100%',
                          cursor: 'pointer',
                          height: 32,
                          fontSize: 12,
                          borderRadius: 1,
                          '& .MuiChip-label': { px: 1.25 },
                        }}
                      />
                    ))}
                  </Box>
                ) : (
                  <Chip
                    icon={<DashCircle size={14} />}
                    label="Not connected"
                    size="small"
                    variant="outlined"
                    sx={{
                      alignSelf: 'flex-start',
                      borderRadius: 1,
                      color: 'text.disabled',
                      borderColor: 'divider',
                      bgcolor: 'transparent',
                      '& .MuiChip-icon': { color: 'text.disabled' },
                    }}
                  />
                )}
              </Box>
            );
          })}
        </CollapsibleSection>
      )}

      <CollapsibleSection
        title="Node result data"
        open={nodeDataOpen}
        onToggle={() => setNodeDataOpen((v) => !v)}
      >
        <Chip
          icon={<BarChartLine size={18} />}
          label="Node data"
          title="Node data"
          variant="outlined"
          onClick={onShowMetrics}
          sx={{
            maxWidth: '100%',
            cursor: 'pointer',
            borderRadius: 1,
            height: 32,
            fontSize: 13,
            '& .MuiChip-label': { px: 1.25 },
            alignSelf: 'flex-start',
          }}
        />
      </CollapsibleSection>

      {outputPorts.length > 0 && (
        <CollapsibleSection
          title={`Output ports (${outputPorts.length})`}
          open={outputOpen}
          onToggle={() => setOutputOpen((v) => !v)}
        >
          {outputPorts.map((port, portIdx) => {
            const connectedEdges = outgoingByPort.get(port.id) ?? [];
            return (
              <Box key={port.id}>
                <Typography variant="body2" sx={{ fontSize: 10, color: 'text.secondary', mb: 0 }}>
                  {port.label ?? `Port #${portIdx + 1}`}
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
                              targetNode ? getStyleForNode(targetNode) : getNodeStyle('', '', false)
                            }
                            onSelect={handleNavigateToNode}
                            onHover={handleHover}
                          />
                        </Box>
                      );
                    })}
                  </Box>
                ) : (
                  <Chip
                    icon={<DashCircle size={14} />}
                    label="Not connected"
                    size="small"
                    variant="outlined"
                    sx={{
                      alignSelf: 'flex-start',
                      borderRadius: 1,
                      color: 'text.disabled',
                      borderColor: 'divider',
                      bgcolor: 'transparent',
                      '& .MuiChip-icon': { color: 'text.disabled' },
                    }}
                  />
                )}
              </Box>
            );
          })}
        </CollapsibleSection>
      )}
    </Box>
  );
}
