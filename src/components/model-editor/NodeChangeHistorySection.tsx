import { Box, Typography } from '@mui/material';

import { useQuery } from '@apollo/client/react';

import type {
  NodeChangeHistoryQuery,
  NodeChangeHistoryQueryVariables,
} from '@/common/__generated__/graphql';
import { CollapsibleSection } from './node-details/shared';
import { NODE_CHANGE_HISTORY } from './queries';

type Props = {
  nodeId: string;
  open: boolean;
  onToggle: () => void;
};

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

export default function NodeChangeHistorySection({ nodeId, open, onToggle }: Props) {
  const { data, loading } = useQuery<NodeChangeHistoryQuery, NodeChangeHistoryQueryVariables>(
    NODE_CHANGE_HISTORY,
    {
      variables: { nodeId, limit: 10 },
      fetchPolicy: 'cache-and-network',
    }
  );

  const node = data?.node;
  const entries =
    node && (node.__typename === 'Node' || node.__typename === 'ActionNode')
      ? node.changeHistory
      : [];

  return (
    <CollapsibleSection title="Recent changes" open={open} onToggle={onToggle}>
      {loading && entries.length === 0 ? (
        <Typography variant="caption" color="text.secondary">
          Loading…
        </Typography>
      ) : entries.length === 0 ? (
        <Typography variant="caption" color="text.secondary">
          No recorded changes for this node.
        </Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {entries.map((entry) => (
            <Box
              key={entry.uuid}
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                gap: 1,
                px: 1,
                py: 0.5,
                borderRadius: 0.5,
                bgcolor: 'grey.100',
              }}
            >
              <Typography
                variant="caption"
                sx={{ fontFamily: 'monospace', fontSize: 11, color: 'text.primary' }}
              >
                {entry.action}
              </Typography>
              <Typography variant="caption" sx={{ fontSize: 10, color: 'text.secondary' }}>
                {formatTimestamp(entry.createdAt)}
              </Typography>
            </Box>
          ))}
        </Box>
      )}
    </CollapsibleSection>
  );
}
