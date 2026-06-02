import { Box, Chip } from '@mui/material';

import type { useTranslations } from 'next-intl';
import { Hash } from 'react-bootstrap-icons';

import type {
  DataPointCommentFieldsFragment,
  DatasetDetailFieldsFragment,
} from '@/common/__generated__/graphql';
import { extractYear } from './dataset-grid-data';

export type SelectedCell = {
  year: number;
  metricLabel: string;
  metricUnit: string;
  categoryLabels: readonly string[];
  value: number | null;
};

// A data point comment paired with the id of the data point it belongs to.
export type CommentWithDataPoint = DataPointCommentFieldsFragment & { dataPointId: string };

export type AddCommentInput = {
  text: string;
  isReview: boolean;
};

// Softer pastel backgrounds for the cell-identifier chips. Default text
// colour stays dark enough to be readable on all three.
const YEAR_CHIP_BG = '#dcfce7'; // light green
const METRIC_CHIP_BG = '#dbeafe'; // light blue
const CATEGORY_CHIP_BG = '#fee2e2'; // light salmon

export function SelectedDataPointChips({ cell }: { cell: SelectedCell }) {
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 2 }}>
      <Chip size="small" label={cell.year} sx={{ bgcolor: YEAR_CHIP_BG }} />
      <Chip
        size="small"
        label={cell.metricUnit ? `${cell.metricLabel} (${cell.metricUnit})` : cell.metricLabel}
        sx={{ bgcolor: METRIC_CHIP_BG }}
      />
      {cell.categoryLabels.map((label, i) => (
        <Chip key={`${i}-${label}`} size="small" label={label} sx={{ bgcolor: CATEGORY_CHIP_BG }} />
      ))}
      {cell.value != null && (
        <Chip
          size="small"
          icon={<Hash size={14} />}
          label={cell.value.toLocaleString(undefined, { maximumFractionDigits: 6 })}
          variant="outlined"
        />
      )}
    </Box>
  );
}

export function resolveSelectedCell(
  dataset: DatasetDetailFieldsFragment,
  dataPointId: string
): SelectedCell | null {
  const dp = dataset.dataPoints.find((d) => d.id === dataPointId);
  if (!dp) return null;
  const year = extractYear(dp.date);
  const metric = dataset.metrics.find((m) => m.id === dp.metric.id);
  const dpCatUuids = new Set(dp.dimensionCategories.map((c) => c.uuid));
  const categoryLabels: string[] = [];
  for (const dim of dataset.dimensions) {
    for (const cat of dim.categories) {
      if (dpCatUuids.has(cat.uuid)) {
        categoryLabels.push(cat.label);
        break;
      }
    }
  }
  return {
    year,
    metricLabel: metric?.label ?? dp.metric.id,
    metricUnit: metric?.unit ?? '',
    categoryLabels,
    value: dp.value,
  };
}

export function getUserName(
  user: { firstName: string; lastName: string; email: string } | null,
  t: ReturnType<typeof useTranslations>
): string {
  if (!user) return t('common-unknown');
  const full = `${user.firstName} ${user.lastName}`.trim();
  return full || user.email;
}

export function formatCommentDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Backend's UserModifiableModel sets `created_at` (auto_now_add) and
// `last_modified_at` (auto_now) on the same .save(), but each evaluates
// timezone.now() independently — so they always differ by microseconds.
// Only treat the comment as edited if the gap is at least one second.
export function isCommentEdited(createdAt: string, lastModifiedAt: string): boolean {
  return new Date(lastModifiedAt).getTime() - new Date(createdAt).getTime() >= 1000;
}
