import { Box, Divider, Typography } from '@mui/material';

import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import 'overlayscrollbars/styles/overlayscrollbars.css';

import type { EditorNodeFieldsFragment } from '@/common/__generated__/graphql';
import { getNodeSpec } from '../nodeHelpers';
import { ConnectedNodeChip, getStyleForNode } from './shared';

type NodeSpec = NonNullable<ReturnType<typeof getNodeSpec>>;
type InputPort = NodeSpec['inputPorts'][number];
type OutputPort = NodeSpec['outputPorts'][number];

type Props = {
  nodes: readonly EditorNodeFieldsFragment[];
  port: InputPort;
  currentNodeId: string;
  onSelect?: (nodeId: string) => void;
};

function outputMatches(port: InputPort, output: OutputPort): boolean {
  if (port.quantity !== output.quantity) return false;
  for (const req of port.requiredDimensions) {
    if (!output.dimensions.includes(req)) return false;
  }
  if (port.supportedDimensions.length > 0) {
    for (const d of output.dimensions) {
      if (!port.supportedDimensions.includes(d)) return false;
    }
  }
  return true;
}

function nodeMatches(node: EditorNodeFieldsFragment, port: InputPort): boolean {
  const outputs = getNodeSpec(node)?.outputPorts ?? [];
  return outputs.some((o) => outputMatches(port, o));
}

function CriterionRow({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ display: 'flex', gap: 1, fontSize: 11, alignItems: 'baseline' }}>
      <Typography
        variant="caption"
        sx={{ fontSize: 10, color: 'text.secondary', minWidth: 96, flexShrink: 0 }}
      >
        {label}
      </Typography>
      <Typography variant="caption" sx={{ fontSize: 11 }}>
        {value}
      </Typography>
    </Box>
  );
}

function PortCriteria({ port }: { port: InputPort }) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 0.25,
        p: 1,
        mb: 1,
        bgcolor: 'grey.100',
        borderRadius: 0.5,
      }}
    >
      <Typography
        variant="caption"
        sx={{ fontSize: 10, color: 'text.secondary', textTransform: 'uppercase', mb: 0.25 }}
      >
        Port requirements
      </Typography>
      <CriterionRow label="Quantity" value={port.quantity ?? '—'} />
      <CriterionRow label="Unit" value={port.unit?.short ?? '—'} />
      <CriterionRow
        label="Required dims"
        value={port.requiredDimensions.length ? port.requiredDimensions.join(', ') : '—'}
      />
      <CriterionRow
        label="Supported dims"
        value={port.supportedDimensions.length ? port.supportedDimensions.join(', ') : '—'}
      />
    </Box>
  );
}

export default function NodeSelector({ nodes, port, currentNodeId, onSelect }: Props) {
  const candidates = nodes
    .filter((n) => n.id !== currentNodeId && nodeMatches(n, port))
    .sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <PortCriteria port={port} />
      <Divider />
      {candidates.length === 0 ? (
        <Typography variant="caption" sx={{ fontSize: 11, color: 'text.secondary', py: 1 }}>
          No compatible nodes in this model.
        </Typography>
      ) : (
        <OverlayScrollbarsComponent
          defer
          options={{
            scrollbars: { autoHide: 'leave' },
            overflow: { x: 'hidden', y: 'scroll' },
          }}
          style={{ maxHeight: 200 }}
        >
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, pr: 0.5 }}>
            {candidates.map((node) => (
              <ConnectedNodeChip
                key={node.id}
                nodeId={node.id}
                label={node.name ?? node.id}
                style={getStyleForNode(node)}
                onSelect={(id) => onSelect?.(id)}
                onHover={() => {
                  /* hover highlighting is graph-panel behavior; no-op here */
                }}
              />
            ))}
          </Box>
        </OverlayScrollbarsComponent>
      )}
      <Typography variant="caption" sx={{ fontSize: 10, color: 'text.secondary', mt: 0.5 }}>
        {candidates.length} compatible node{candidates.length === 1 ? '' : 's'}
      </Typography>
    </Box>
  );
}
