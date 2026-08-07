import { useState } from 'react';

import { Box, Chip, Typography } from '@mui/material';

import { useQuery } from '@apollo/client/react';
import { useTranslations } from 'next-intl';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import 'overlayscrollbars/styles/overlayscrollbars.css';
import { Database } from 'react-bootstrap-icons';

import type {
  AvailableDatasetsQuery,
  AvailableDatasetsQueryVariables,
} from '@/common/__generated__/graphql';
import type { getNodeSpec } from '../nodeHelpers';
import { AVAILABLE_DATASETS } from '../queries';

type NodeSpec = NonNullable<ReturnType<typeof getNodeSpec>>;
type InputPort = NodeSpec['inputPorts'][number];

type Dataset = NonNullable<AvailableDatasetsQuery['instance']['editor']>['datasets'][number];
type Metric = Dataset['metrics'][number];

type Candidate = {
  dataset: Dataset;
  metric: Metric;
};

type Props = {
  port: InputPort;
  onSelect?: (datasetId: string, metricId: string) => void;
};

function metricMatches(port: InputPort, metric: Metric): boolean {
  if (!port.unit) return true;
  if (!metric.unitInfo) return false;

  const portDimensions = new Map(
    port.unit.dimensionality.map(({ dimension, value }) => [dimension, value])
  );
  const metricDimensions = metric.unitInfo.dimensionality;
  return (
    portDimensions.size === metricDimensions.length &&
    metricDimensions.every(({ dimension, value }) => portDimensions.get(dimension) === value)
  );
}

const normalizeQuantityName = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');

/**
 * Whether the metric's column name/label matches the port's quantity.
 *
 * Dataset metrics don't declare a quantity, so this is a naming-convention
 * heuristic: dataset columns are conventionally named after quantities
 * ("emissions", "emission_factor", …). Callers must treat it as a soft
 * signal — datasets that don't follow the convention still hold compatible
 * data — hence the collapsed "other metrics" escape hatch in the list below.
 */
function metricNameMatchesQuantity(port: InputPort, metric: Metric): boolean {
  if (!port.quantity) return true;
  const quantity = normalizeQuantityName(port.quantity);
  // `name` cast: codegen is blocked by unrelated schema drift; the query
  // fetches `name` (the DataFrame column name) at runtime.
  const columnName = (metric as Metric & { name?: string | null }).name;
  return [columnName, metric.label].some(
    (name) => name != null && normalizeQuantityName(name) === quantity
  );
}

export default function DatasetSelector({ port, onSelect }: Props) {
  const t = useTranslations('model-editor');
  const [showAll, setShowAll] = useState(false);
  const { data, loading } = useQuery<AvailableDatasetsQuery, AvailableDatasetsQueryVariables>(
    AVAILABLE_DATASETS,
    { fetchPolicy: 'cache-and-network' }
  );

  const datasets = data?.instance.editor?.datasets ?? [];
  const candidates: Candidate[] = [];
  for (const dataset of datasets) {
    for (const metric of dataset.metrics) {
      if (metricMatches(port, metric)) {
        candidates.push({ dataset, metric });
      }
    }
  }
  candidates.sort((a, b) => {
    const byName = a.dataset.name.localeCompare(b.dataset.name);
    if (byName !== 0) return byName;
    return a.metric.label.localeCompare(b.metric.label);
  });

  // Quantity is a soft signal (see metricNameMatchesQuantity): candidates
  // whose name matches the port's quantity show first; the rest collapse
  // behind a toggle. When nothing matches the naming convention, the split
  // would hide everything useful, so it's skipped entirely.
  const preferred = candidates.filter((c) => metricNameMatchesQuantity(port, c.metric));
  const split = preferred.length > 0 && preferred.length < candidates.length;
  const visible = split && !showAll ? preferred : candidates;
  const hiddenCount = candidates.length - preferred.length;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {loading && candidates.length === 0 ? (
        <Typography variant="caption" sx={{ fontSize: 11, color: 'text.secondary', py: 1 }}>
          {t('common-loading')}
        </Typography>
      ) : candidates.length === 0 ? (
        <Typography variant="caption" sx={{ fontSize: 11, color: 'text.secondary', py: 1 }}>
          {t('nodes-no-compatible-datasets')}
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
            {visible.map(({ dataset, metric }) => {
              const label = `${dataset.name} → ${metric.label}`;
              return (
                <Chip
                  key={`${dataset.id}:${metric.id}`}
                  icon={<Database size={14} />}
                  label={label}
                  title={label}
                  variant="outlined"
                  onClick={() => onSelect?.(dataset.id, metric.id)}
                  sx={{
                    maxWidth: '100%',
                    cursor: 'pointer',
                    height: 28,
                    fontSize: 12,
                    borderRadius: 1,
                    '& .MuiChip-label': { px: 1 },
                  }}
                />
              );
            })}
            {split && (
              <Chip
                label={
                  showAll
                    ? t('datasets-categories-show-less')
                    : t('nodes-datasets-show-other', { count: hiddenCount })
                }
                variant="outlined"
                onClick={() => setShowAll((v) => !v)}
                sx={{
                  height: 28,
                  fontSize: 12,
                  borderRadius: 1,
                  borderStyle: 'dashed',
                  color: 'text.secondary',
                  cursor: 'pointer',
                  '& .MuiChip-label': { px: 1 },
                }}
              />
            )}
          </Box>
        </OverlayScrollbarsComponent>
      )}
      <Typography variant="caption" sx={{ fontSize: 10, color: 'text.secondary' }}>
        {t('nodes-compatible-dataset-metrics', { count: candidates.length })}
      </Typography>
    </Box>
  );
}
