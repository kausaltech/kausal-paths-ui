import { Box, Typography } from '@mui/material';

import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import 'overlayscrollbars/styles/overlayscrollbars.css';

import type { EditorNodeFieldsFragment } from '@/common/__generated__/graphql';
import { type InputPort, getNodeSpec, outputMatchesPort } from '../nodeHelpers';
import { ConnectedNodeChip, getStyleForNode } from './shared';

type Props = {
  nodes: readonly EditorNodeFieldsFragment[];
  port: InputPort;
  currentNodeId: string;
  onSelect?: (nodeId: string) => void;
};

function nodeMatches(node: EditorNodeFieldsFragment, port: InputPort): boolean {
  const outputs = getNodeSpec(node)?.outputPorts ?? [];
  return outputs.some((o) => outputMatchesPort(port, o));
}

export default function NodeSelector({ nodes, port, currentNodeId, onSelect }: Props) {
  const candidates = nodes
    .filter((n) => n.id !== currentNodeId && nodeMatches(n, port))
    .sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
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
      <Typography variant="caption" sx={{ fontSize: 10, color: 'text.secondary' }}>
        {candidates.length} compatible node{candidates.length === 1 ? '' : 's'}
      </Typography>
    </Box>
  );
}
