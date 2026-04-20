import { Box, Chip, Typography } from '@mui/material';

import { useQuery } from '@apollo/client/react';
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
  // Mock filter: accept any metric when the port has no unit constraint,
  // otherwise match the short-unit string. Backend-side compatibility rules
  // (dimensions, quantities) aren't modeled on metrics yet.
  if (!port.unit?.short) return true;
  return metric.unit === port.unit.short;
}

export default function DatasetSelector({ port, onSelect }: Props) {
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

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {loading && candidates.length === 0 ? (
        <Typography variant="caption" sx={{ fontSize: 11, color: 'text.secondary', py: 1 }}>
          Loading…
        </Typography>
      ) : candidates.length === 0 ? (
        <Typography variant="caption" sx={{ fontSize: 11, color: 'text.secondary', py: 1 }}>
          No compatible datasets in this model.
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
            {candidates.map(({ dataset, metric }) => {
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
          </Box>
        </OverlayScrollbarsComponent>
      )}
      <Typography variant="caption" sx={{ fontSize: 10, color: 'text.secondary' }}>
        {candidates.length} compatible dataset metric{candidates.length === 1 ? '' : 's'}
      </Typography>
    </Box>
  );
}
