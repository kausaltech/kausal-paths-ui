import { Box, Chip, Stack, Tooltip, Typography } from '@mui/material';

import { Database, InfoSquare } from 'react-bootstrap-icons';

import type {
  EditorNodeEdgeFragment,
  EditorNodeFieldsFragment,
} from '@/common/__generated__/graphql';
import { getNodeStyle } from '../ElkNode';
import type { getNodeSpec } from '../nodeHelpers';
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
  ports: readonly InputPort[];
  incomingByPort: ReadonlyMap<string, readonly EditorNodeEdgeFragment[]>;
  nodeMap: ReadonlyMap<string, EditorNodeFieldsFragment>;
  hoveredNodeId: string | null;
  open: boolean;
  onToggle: () => void;
  onSelectNode: (nodeId: string) => void;
  onHover: (nodeId: string | null) => void;
  onShowDataset?: (bindingId: string) => void;
};

export default function NodeInputPortsSection({
  ports,
  incomingByPort,
  nodeMap,
  hoveredNodeId,
  open,
  onToggle,
  onSelectNode,
  onHover,
  onShowDataset,
}: NodeInputPortsSectionProps) {
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
                {port.label ?? `Port #${index + 1}`}
                {port.multi ? ' (multi)' : ''}
                <InfoSquare size={10} aria-label="Port info" />
              </Typography>
            </Tooltip>
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
                        onSelect={onSelectNode}
                        onHover={onHover}
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
              <NotConnectedChip />
            )}
          </Box>
        );
      })}
    </CollapsibleSection>
  );
}
