import { useEffect, useState } from 'react';

import { Box, Chip, Typography } from '@mui/material';

import { useQuery } from '@apollo/client/react';
import { useTranslations } from 'next-intl';

import type {
  NodeChangeHistoryQuery,
  NodeChangeHistoryQueryVariables,
  NodeHistoryEntryFragment,
} from '@/common/__generated__/graphql';
import { CollapsibleSection } from './node-details/shared';
import { NODE_CHANGE_HISTORY } from './queries';
import { useEditorDateFormat } from './useEditorDateFormat';

type Props = {
  nodeId: string;
  open: boolean;
  onToggle: () => void;
};

type ActionLabelKey = 'nodes-history-created' | 'nodes-history-updated' | 'nodes-history-deleted';

const ACTION_LABEL_KEY: Record<string, ActionLabelKey> = {
  'node.create': 'nodes-history-created',
  'node.update': 'nodes-history-updated',
  'node.delete': 'nodes-history-deleted',
};

type FieldLabelKey =
  | 'nodes-history-field-name'
  | 'nodes-history-field-short-name'
  | 'nodes-history-field-description'
  | 'nodes-history-field-goal'
  | 'nodes-history-field-color'
  | 'nodes-history-field-order'
  | 'nodes-history-field-visibility'
  | 'nodes-history-field-outcome'
  | 'nodes-history-field-indicator'
  | 'nodes-history-field-configuration';

// Translation keys for the snapshot keys that appear in before/after payloads.
// Unknown keys render as their raw snapshot key.
const FIELD_LABEL_KEY: Record<string, FieldLabelKey> = {
  name: 'nodes-history-field-name',
  short_description: 'nodes-history-field-short-name',
  description: 'nodes-history-field-description',
  goal: 'nodes-history-field-goal',
  color: 'nodes-history-field-color',
  order: 'nodes-history-field-order',
  is_visible: 'nodes-history-field-visibility',
  is_outcome: 'nodes-history-field-outcome',
  indicator_node: 'nodes-history-field-indicator',
  spec: 'nodes-history-field-configuration',
};

// Returns the raw snapshot keys that changed; the row maps them to translated
// labels (FIELD_LABEL_KEY) at render time, falling back to the raw key.
function computeChangedFields(before: unknown, after: unknown): string[] {
  const b = (before ?? {}) as Record<string, unknown>;
  const a = (after ?? {}) as Record<string, unknown>;
  const keys = new Set([...Object.keys(b), ...Object.keys(a)]);
  // Snapshot bookkeeping — never user-meaningful as a "field changed".
  keys.delete('identifier');
  const changed: string[] = [];
  for (const key of keys) {
    if (JSON.stringify(b[key]) !== JSON.stringify(a[key])) {
      changed.push(key);
    }
  }
  return changed;
}

function HistoryRow({ entry, now }: { entry: NodeHistoryEntryFragment; now: number }) {
  const t = useTranslations('model-editor');
  const df = useEditorDateFormat();
  const isUpdate = entry.action === 'node.update';
  const changedFields = isUpdate ? computeChangedFields(entry.before, entry.after) : [];
  const actionKey = ACTION_LABEL_KEY[entry.action];

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
        {actionKey ? t(actionKey) : entry.action}
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.25, flex: 1, minWidth: 0 }}>
        {changedFields.map((field) => {
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
        title={df.dateTime(entry.createdAt)}
      >
        {df.relativeTime(entry.createdAt, now)}
      </Typography>
    </Box>
  );
}

export default function NodeChangeHistorySection({ nodeId, open, onToggle }: Props) {
  const t = useTranslations('model-editor');
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
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  return (
    <CollapsibleSection title={t('nodes-recent-changes')} open={open} onToggle={onToggle}>
      {loading && entries.length === 0 ? (
        <Typography variant="caption" color="text.secondary">
          {t('common-loading')}
        </Typography>
      ) : entries.length === 0 ? (
        <Typography variant="caption" color="text.secondary">
          {t('nodes-no-change-history')}
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
