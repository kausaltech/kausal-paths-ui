import { useState } from 'react';

import {
  Box,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';

import {
  BarChartLine,
  Database,
  InfoSquare,
  PencilSquare,
  X as XIcon,
} from 'react-bootstrap-icons';

import type {
  EditorNodeEdgeFragment,
  EditorNodeFieldsFragment,
} from '@/common/__generated__/graphql';
import { getNodeStyle } from '../ElkNode';
import type { getNodeSpec } from '../nodeHelpers';
import PortBindingSelector from './PortBindingSelector';
import { CollapsibleSection, ConnectedNodeChip, NotConnectedChip, getStyleForNode } from './shared';

type NodeSpec = NonNullable<ReturnType<typeof getNodeSpec>>;
type InputPort = NodeSpec['inputPorts'][number];

type PortInfoRowProps = {
  label: string;
  value: string;
};

function PortInfoRow({ label, value }: PortInfoRowProps) {
  return (
    <Box sx={{ display: 'flex', gap: 1, fontSize: 11, lineHeight: 1.4 }}>
      <Box sx={{ minWidth: 110, color: 'grey.400', flexShrink: 0 }}>{label}</Box>
      <Box sx={{ wordBreak: 'break-word' }}>{value}</Box>
    </Box>
  );
}

function PortTooltipContent({ port }: { port: InputPort }) {
  const datasetBindingCount = port.bindings.filter(
    (b) => b.__typename === 'DatasetPortType'
  ).length;
  const edgeBindingCount = port.bindings.filter((b) => b.__typename === 'NodeEdgeType').length;

  return (
    <Stack spacing={0.5} sx={{ py: 0.5 }}>
      <PortInfoRow label="ID" value={port.id} />
      <PortInfoRow label="Label" value={port.label ?? '—'} />
      <PortInfoRow label="Quantity" value={port.quantity ?? '—'} />
      <PortInfoRow label="Unit" value={port.unit?.short ?? '—'} />
      <PortInfoRow label="Multi" value={port.multi ? 'Yes' : 'No'} />
      <PortInfoRow
        label="Required dims"
        value={port.requiredDimensions.length ? port.requiredDimensions.join(', ') : '—'}
      />
      <PortInfoRow
        label="Supported dims"
        value={port.supportedDimensions.length ? port.supportedDimensions.join(', ') : '—'}
      />
      <PortInfoRow
        label="Bindings"
        value={`${port.bindings.length} (${edgeBindingCount} edge, ${datasetBindingCount} dataset)`}
      />
    </Stack>
  );
}

type NodeInputPortsSectionProps = {
  currentNodeId: string;
  ports: readonly InputPort[];
  incomingByPort: ReadonlyMap<string, readonly EditorNodeEdgeFragment[]>;
  nodeMap: ReadonlyMap<string, EditorNodeFieldsFragment>;
  hoveredNodeId: string | null;
  open: boolean;
  onToggle: () => void;
  onSelectNode: (nodeId: string) => void;
  onHover: (nodeId: string | null) => void;
  onShowDataset?: (bindingId: string) => void;
  onShowMetrics?: (nodeId: string, nodeName: string | null) => void;
};

export default function NodeInputPortsSection({
  currentNodeId,
  ports,
  incomingByPort,
  nodeMap,
  hoveredNodeId,
  open,
  onToggle,
  onSelectNode,
  onHover,
  onShowDataset,
  onShowMetrics,
}: NodeInputPortsSectionProps) {
  const [editingPortId, setEditingPortId] = useState<string | null>(null);
  const editingPort = editingPortId ? (ports.find((p) => p.id === editingPortId) ?? null) : null;

  if (ports.length === 0) return null;

  return (
    <CollapsibleSection
      title={`Node input ports (${ports.length})`}
      open={open}
      onToggle={onToggle}
    >
      {ports.map((port, index) => {
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
        const singleSourceNode =
          connectedEdges.length === 1
            ? (nodeMap.get(connectedEdges[0].fromRef.nodeId) ?? null)
            : null;
        // For a port with no explicit label, derive the name the
        // formula/runtime references. Formula-node conventions:
        //   - dataset binding: always referenced as "reference"
        //   - edge binding: first edge tag (alias) or source-node identifier
        // `tags` cast: codegen is blocked by unrelated schema drift; the
        // fragment fetches `tags` at runtime.
        const singleEdgeTags =
          connectedEdges.length === 1
            ? ((connectedEdges[0] as (typeof connectedEdges)[0] & { tags: readonly string[] })
                .tags ?? [])
            : [];
        const hasSingleDataset = datasetBindings.length === 1 && connectedEdges.length === 0;
        const derivedPortName = port.label
          ? null
          : hasSingleDataset
            ? 'reference'
            : singleSourceNode
              ? (singleEdgeTags[0] ?? singleSourceNode.identifier)
              : null;

        return (
          <Box key={port.id}>
            <Tooltip
              title={<PortTooltipContent port={port} />}
              placement="right"
              arrow
              enterDelay={200}
            >
              <Typography
                component="span"
                variant="body2"
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.5,
                  fontSize: 10,
                  color: 'text.secondary',
                  mb: 0,
                  cursor: 'help',
                }}
              >
                Port: {port.label ?? derivedPortName ?? `#${index + 1}`}
                {port.multi ? ' (multi)' : ''}
                <InfoSquare size={10} aria-label="Port info" />
              </Typography>
            </Tooltip>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {hasConnections ? (
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', flex: 1 }}>
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
                          onSelect={onSelectNode}
                          onHover={onHover}
                        />
                      </Box>
                    );
                  })}
                  {datasetBindings.map((ds) => (
                    <Chip
                      key={ds.id}
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
                <Box sx={{ flex: 1 }}>
                  <NotConnectedChip />
                </Box>
              )}
              <Tooltip title="Select input node" placement="left">
                <IconButton
                  size="small"
                  onClick={() => setEditingPortId(port.id)}
                  aria-label="Select input node"
                  sx={{ p: 0.5, color: 'text.secondary' }}
                >
                  <PencilSquare size={12} />
                </IconButton>
              </Tooltip>
              {singleSourceNode && onShowMetrics && (
                <Tooltip title="Show source node output data" placement="left">
                  <IconButton
                    size="small"
                    onClick={() =>
                      onShowMetrics(singleSourceNode.id, singleSourceNode.name ?? null)
                    }
                    aria-label="Show source node output data"
                    sx={{ p: 0.5, color: 'text.secondary' }}
                  >
                    <BarChartLine size={12} />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </Box>
        );
      })}
      <Dialog
        open={editingPort !== null}
        onClose={() => setEditingPortId(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ pr: 6 }}>
          Select new input node
          <IconButton
            aria-label="Close"
            onClick={() => setEditingPortId(null)}
            sx={{ position: 'absolute', right: 8, top: 8, color: 'text.secondary' }}
          >
            <XIcon size={20} />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {editingPort && (
            <PortBindingSelector
              nodes={[...nodeMap.values()]}
              port={editingPort}
              currentNodeId={currentNodeId}
              onSelectNode={() => setEditingPortId(null)}
              onSelectDataset={() => setEditingPortId(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </CollapsibleSection>
  );
}
