import { Box, Stack, Tooltip, Typography } from '@mui/material';

import { InfoSquare } from 'react-bootstrap-icons';

import type {
  EditorNodeEdgeFragment,
  EditorNodeFieldsFragment,
} from '@/common/__generated__/graphql';
import { getNodeStyle } from '../ElkNode';
import type { getNodeSpec } from '../nodeHelpers';
import { CollapsibleSection, ConnectedNodeChip, NotConnectedChip, getStyleForNode } from './shared';

type NodeSpec = NonNullable<ReturnType<typeof getNodeSpec>>;
type OutputPort = NodeSpec['outputPorts'][number];

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

function PortTooltipContent({ port, edgeCount }: { port: OutputPort; edgeCount: number }) {
  return (
    <Stack spacing={0.5} sx={{ py: 0.5 }}>
      <PortInfoRow label="ID" value={port.id} />
      <PortInfoRow label="Label" value={port.label ?? '—'} />
      <PortInfoRow label="Quantity" value={port.quantity ?? '—'} />
      <PortInfoRow label="Unit" value={port.unit?.short ?? '—'} />
      <PortInfoRow
        label="Dimensions"
        value={port.dimensions.length ? port.dimensions.join(', ') : '—'}
      />
      <PortInfoRow label="Edges" value={String(edgeCount)} />
    </Stack>
  );
}

type NodeOutputPortsSectionProps = {
  ports: readonly OutputPort[];
  outgoingByPort: ReadonlyMap<string, readonly EditorNodeEdgeFragment[]>;
  nodeMap: ReadonlyMap<string, EditorNodeFieldsFragment>;
  hoveredNodeId: string | null;
  open: boolean;
  onToggle: () => void;
  onSelectNode: (nodeId: string) => void;
  onHover: (nodeId: string | null) => void;
};

export default function NodeOutputPortsSection({
  ports,
  outgoingByPort,
  nodeMap,
  hoveredNodeId,
  open,
  onToggle,
  onSelectNode,
  onHover,
}: NodeOutputPortsSectionProps) {
  if (ports.length === 0) return null;

  return (
    <CollapsibleSection
      title={`Node output ports (${ports.length})`}
      open={open}
      onToggle={onToggle}
    >
      {ports.map((port, index) => {
        const connectedEdges = outgoingByPort.get(port.id) ?? [];
        const singleTargetNode =
          connectedEdges.length === 1
            ? (nodeMap.get(connectedEdges[0].toRef.nodeId) ?? null)
            : null;
        // For a port with no explicit label and exactly one outgoing edge,
        // use the name downstream formulas reference this output by:
        // the edge's first tag (alias) or the target node's identifier.
        // `tags` cast: codegen is blocked by unrelated schema drift; the
        // fragment fetches `tags` at runtime.
        const singleEdgeTags =
          connectedEdges.length === 1
            ? ((connectedEdges[0] as (typeof connectedEdges)[0] & { tags: readonly string[] })
                .tags ?? [])
            : [];
        const derivedPortName =
          !port.label && singleTargetNode
            ? (singleEdgeTags[0] ?? singleTargetNode.identifier)
            : null;

        return (
          <Box key={port.id}>
            <Tooltip
              title={<PortTooltipContent port={port} edgeCount={connectedEdges.length} />}
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
                <InfoSquare size={10} aria-label="Port info" />
              </Typography>
            </Tooltip>
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
                        onSelect={onSelectNode}
                        onHover={onHover}
                      />
                    </Box>
                  );
                })}
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
