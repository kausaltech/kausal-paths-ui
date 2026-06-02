import { useEffect, useMemo, useState } from 'react';

import { Box, Chip, Paper, Typography } from '@mui/material';

import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';

// There's no per-datapoint `changeHistory` field on the backend (only Node /
// NodeEdge / DatasetPort implement EditableEntity), so we read the instance-
// wide audit trail and filter to the entries that target this data point. The
// match is exact: DataPoint.id === the data point's uuid === the log entry's
// `targetUuid`. Mirrors NodeChangeHistorySection's row style.
const INSTANCE_CHANGE_HISTORY = gql`
  query DataPointInstanceChangeHistory($limit: Int! = 100) {
    instance {
      id
      editor {
        changeHistory(limit: $limit) {
          uuid
          createdAt
          userEmail
          entries {
            uuid
            action
            targetUuid
            before
            after
            createdAt
          }
        }
      }
    }
  }
`;

type ChangeEntry = {
  uuid: string;
  action: string;
  targetUuid: string | null;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  createdAt: string;
};
type ChangeOperation = {
  uuid: string;
  createdAt: string;
  userEmail: string | null;
  entries: ChangeEntry[];
};
type InstanceChangeHistoryQuery = {
  instance: { id: string; editor: { changeHistory: ChangeOperation[] } | null };
};

type HistoryRowData = {
  key: string;
  action: string;
  changedFields: string[];
  createdAt: string;
  userEmail: string | null;
};

const ACTION_LABELS: Record<string, string> = {
  'dataset.datapoint.create': 'Created',
  'dataset.datapoint.update': 'Updated',
  'dataset.datapoint.delete': 'Deleted',
};

// Human-readable names for the snapshot keys in _data_point_snapshot.
const FIELD_LABELS: Record<string, string> = {
  value: 'value',
  date: 'year',
  dimension_category_uuids: 'categories',
  metric_uuid: 'metric',
};

// Snapshot bookkeeping keys — never user-meaningful as a "field changed".
const IGNORED_FIELDS = new Set(['uuid', 'dataset_uuid']);

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
  if (diffSec < 60 * 60) return `${Math.round(diffSec / 60)} min ago`;
  if (diffSec < 24 * 60 * 60) return `${Math.round(diffSec / 3600)} h ago`;
  return formatTimestamp(iso);
}

function computeChangedFields(before: unknown, after: unknown): string[] {
  const b = (before ?? {}) as Record<string, unknown>;
  const a = (after ?? {}) as Record<string, unknown>;
  const keys = new Set([...Object.keys(b), ...Object.keys(a)]);
  const changed: string[] = [];
  for (const key of keys) {
    if (IGNORED_FIELDS.has(key)) continue;
    if (JSON.stringify(b[key]) !== JSON.stringify(a[key])) {
      changed.push(FIELD_LABELS[key] ?? key);
    }
  }
  return changed;
}

function HistoryRow({ row, now }: { row: HistoryRowData; now: number }) {
  return (
    <Box sx={{ px: 1, py: 0.75, borderRadius: 0.5, bgcolor: 'grey.100' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography
          variant="caption"
          sx={{ fontSize: 11, fontWeight: 600, color: 'text.primary', minWidth: 64 }}
        >
          {actionLabel(row.action)}
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.25, flex: 1, minWidth: 0 }}>
          {row.changedFields.map((label) => (
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
          title={formatTimestamp(row.createdAt)}
        >
          {formatRelativeTime(row.createdAt, now)}
        </Typography>
      </Box>
      {row.userEmail && (
        <Typography
          variant="caption"
          sx={{ display: 'block', fontSize: 10, color: 'text.secondary' }}
        >
          by {row.userEmail}
        </Typography>
      )}
    </Box>
  );
}

export default function DataPointChangeHistorySection({ dataPointId }: { dataPointId: string }) {
  const { data, loading } = useQuery<InstanceChangeHistoryQuery>(INSTANCE_CHANGE_HISTORY, {
    variables: { limit: 100 },
    fetchPolicy: 'cache-and-network',
  });

  const rows = useMemo<HistoryRowData[]>(() => {
    const target = dataPointId.toLowerCase();
    const ops = data?.instance.editor?.changeHistory ?? [];
    const out: HistoryRowData[] = [];
    // changeHistory is newest-first; entries keep that order.
    for (const op of ops) {
      for (const e of op.entries) {
        if ((e.targetUuid ?? '').toLowerCase() !== target) continue;
        out.push({
          key: e.uuid,
          action: e.action,
          changedFields: e.action.endsWith('.update')
            ? computeChangedFields(e.before, e.after)
            : [],
          createdAt: e.createdAt,
          userEmail: op.userEmail,
        });
      }
    }
    return out;
  }, [data, dataPointId]);

  // Refresh "now" once a minute so relative timestamps don't go stale while the
  // panel stays open.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography variant="subtitle1" sx={{ mb: 2 }}>
        Edit history
      </Typography>
      {loading && rows.length === 0 ? (
        <Typography variant="caption" color="text.secondary">
          Loading…
        </Typography>
      ) : rows.length === 0 ? (
        <Typography variant="caption" color="text.secondary">
          No recorded changes for this data point.
        </Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {rows.map((row) => (
            <HistoryRow key={row.key} row={row} now={now} />
          ))}
        </Box>
      )}
    </Paper>
  );
}
