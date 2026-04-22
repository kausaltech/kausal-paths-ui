import { useEffect, useState } from 'react';

import { Box, Chip, Typography } from '@mui/material';

import { useQuery } from '@apollo/client/react';

import type {
  NodeChangeHistoryQuery,
  NodeChangeHistoryQueryVariables,
  NodeHistoryEntryFragment,
} from '@/common/__generated__/graphql';
import { CollapsibleSection } from './node-details/shared';
import { NODE_CHANGE_HISTORY } from './queries';

type Props = {
  nodeId: string;
  open: boolean;
  onToggle: () => void;
};

const ACTION_LABELS: Record<string, string> = {
  'node.create': 'Created',
  'node.update': 'Updated',
  'node.delete': 'Deleted',
};

// Human-readable field names for snapshot keys that appear in before/after
// payloads. Unknown keys render as-is.
const FIELD_LABELS: Record<string, string> = {
  name: 'name',
  short_description: 'short name',
  description: 'description',
  goal: 'goal',
  color: 'color',
  order: 'order',
  is_visible: 'visibility',
  is_outcome: 'outcome',
  indicator_node: 'indicator',
  spec: 'configuration',
};

function actionLabel(action: string): string {
  return ACTION_LABELS[action] ?? action;
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function formatRelativeTime(iso: string, now: number): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const diffSec = Math.max(0, Math.round((now - d.getTime()) / 1000));
  if (diffSec < 45) return 'just now';
  if (diffSec < 60 * 60) {
    const mins = Math.round(diffSec / 60);
    return `${mins} min ago`;
  }
  if (diffSec < 24 * 60 * 60) {
    const hours = Math.round(diffSec / 3600);
    return `${hours} h ago`;
  }
  return formatTimestamp(iso);
}

function computeChangedFields(before: unknown, after: unknown): string[] {
  const b = (before ?? {}) as Record<string, unknown>;
  const a = (after ?? {}) as Record<string, unknown>;
  const keys = new Set([...Object.keys(b), ...Object.keys(a)]);
  // Snapshot bookkeeping — never user-meaningful as a "field changed".
  keys.delete('identifier');
  const changed: string[] = [];
  for (const key of keys) {
    if (JSON.stringify(b[key]) !== JSON.stringify(a[key])) {
      changed.push(FIELD_LABELS[key] ?? key);
    }
  }
  return changed;
}

function HistoryRow({ entry, now }: { entry: NodeHistoryEntryFragment; now: number }) {
  const isUpdate = entry.action === 'node.update';
  const changedFields = isUpdate ? computeChangedFields(entry.before, entry.after) : [];

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        px: 1,
        py: 0.75,
        borderRadius: 0.5,
        bgcolor: 'grey.100',
      }}
    >
      <Typography
        variant="caption"
        sx={{ fontSize: 11, fontWeight: 600, color: 'text.primary', minWidth: 64 }}
      >
        {actionLabel(entry.action)}
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.25, flex: 1, minWidth: 0 }}>
        {changedFields.map((label) => (
          <Chip
            key={label}
            label={label}
            size="small"
            variant="outlined"
            sx={{ height: 18, '& .MuiChip-label': { px: 0.75, fontSize: 10 } }}
          />
        ))}
      </Box>
      <Typography
        variant="caption"
        sx={{ fontSize: 10, color: 'text.secondary', whiteSpace: 'nowrap' }}
        title={formatTimestamp(entry.createdAt)}
      >
        {formatRelativeTime(entry.createdAt, now)}
      </Typography>
    </Box>
  );
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

  // Refresh "now" once per minute so relative timestamps don't go stale while
  // the panel stays open. Initial value captured via useState initializer so
  // the reference on first render is pure.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);

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
            <HistoryRow key={entry.uuid} entry={entry} now={now} />
          ))}
        </Box>
      )}
    </CollapsibleSection>
  );
}
