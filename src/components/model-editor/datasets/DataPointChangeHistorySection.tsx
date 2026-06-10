import { useEffect, useMemo, useState } from 'react';

import { Box, Chip, Paper, Typography } from '@mui/material';

import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { useTranslations } from 'next-intl';

import { useEditorDateFormat } from '../useEditorDateFormat';

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

type ActionLabelKey =
  | 'datasets-history-created'
  | 'datasets-history-updated'
  | 'datasets-history-deleted';

const ACTION_LABEL_KEY: Record<string, ActionLabelKey> = {
  'dataset.datapoint.create': 'datasets-history-created',
  'dataset.datapoint.update': 'datasets-history-updated',
  'dataset.datapoint.delete': 'datasets-history-deleted',
};

type FieldLabelKey =
  | 'datasets-history-field-value'
  | 'datasets-history-field-year'
  | 'datasets-history-field-categories'
  | 'datasets-history-field-metric';

// Translation keys for the snapshot keys in _data_point_snapshot.
const FIELD_LABEL_KEY: Record<string, FieldLabelKey> = {
  value: 'datasets-history-field-value',
  date: 'datasets-history-field-year',
  dimension_category_uuids: 'datasets-history-field-categories',
  metric_uuid: 'datasets-history-field-metric',
};

// Snapshot bookkeeping keys — never user-meaningful as a "field changed".
const IGNORED_FIELDS = new Set(['uuid', 'dataset_uuid']);

// Returns the raw snapshot keys that changed; the row maps them to translated
// labels (FIELD_LABEL_KEY) at render time, falling back to the raw key.
function computeChangedFields(before: unknown, after: unknown): string[] {
  const b = (before ?? {}) as Record<string, unknown>;
  const a = (after ?? {}) as Record<string, unknown>;
  const keys = new Set([...Object.keys(b), ...Object.keys(a)]);
  const changed: string[] = [];
  for (const key of keys) {
    if (IGNORED_FIELDS.has(key)) continue;
    if (JSON.stringify(b[key]) !== JSON.stringify(a[key])) {
      changed.push(key);
    }
  }
  return changed;
}

function HistoryRow({ row, now }: { row: HistoryRowData; now: number }) {
  const t = useTranslations('model-editor');
  const df = useEditorDateFormat();
  const actionKey = ACTION_LABEL_KEY[row.action];
  return (
    <Box sx={{ px: 1, py: 0.75, borderRadius: 0.5, bgcolor: 'grey.100' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography
          variant="caption"
          sx={{ fontSize: 11, fontWeight: 600, color: 'text.primary', minWidth: 64 }}
        >
          {actionKey ? t(actionKey) : row.action}
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.25, flex: 1, minWidth: 0 }}>
          {row.changedFields.map((field) => {
            const fieldKey = FIELD_LABEL_KEY[field];
            return (
              <Chip
                key={field}
                label={fieldKey ? t(fieldKey) : field}
                size="small"
                variant="outlined"
                sx={{ height: 18, '& .MuiChip-label': { px: 0.75, fontSize: 10 } }}
              />
            );
          })}
        </Box>
        <Typography
          variant="caption"
          sx={{ fontSize: 10, color: 'text.secondary', whiteSpace: 'nowrap' }}
          title={df.dateTime(row.createdAt)}
        >
          {df.relativeTime(row.createdAt, now)}
        </Typography>
      </Box>
      {row.userEmail && (
        <Typography
          variant="caption"
          sx={{ display: 'block', fontSize: 10, color: 'text.secondary' }}
        >
          {t('datasets-history-by', { email: row.userEmail })}
        </Typography>
      )}
    </Box>
  );
}

export default function DataPointChangeHistorySection({ dataPointId }: { dataPointId: string }) {
  const t = useTranslations('model-editor');
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
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography variant="subtitle1" sx={{ mb: 2 }}>
        {t('datasets-edit-history')}
      </Typography>
      {loading && rows.length === 0 ? (
        <Typography variant="caption" color="text.secondary">
          {t('common-loading')}
        </Typography>
      ) : rows.length === 0 ? (
        <Typography variant="caption" color="text.secondary">
          {t('datasets-no-change-history')}
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
