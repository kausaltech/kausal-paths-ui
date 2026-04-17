import { useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  IconButton,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';

import { useQuery } from '@apollo/client/react';
import { ArrowLeft, Link45deg, Plus, Trash } from 'react-bootstrap-icons';

import type {
  DatasetDetailFieldsFragment,
  InstanceDatasetQuery,
} from '@/common/__generated__/graphql';
import GraphQLError from '@/components/common/GraphQLError';
import DatasetDataGrid from './DatasetDataGrid';
import { GET_INSTANCE_DATASET } from './queries';

type Props = {
  datasetId: string;
};

type MetricRow = DatasetDetailFieldsFragment['metrics'][number];

function getListBase(pathname: string): string {
  const idx = pathname.indexOf('/model-editor');
  return idx >= 0 ? pathname.slice(0, idx) + '/model-editor/datasets' : '/model-editor/datasets';
}

/** Topologically sort metrics by previousSibling/nextSibling linked list. */
function sortMetricsBySiblings(metrics: readonly MetricRow[]): MetricRow[] {
  if (metrics.length === 0) return [];
  const byId = new Map(metrics.map((m) => [m.id, m]));
  // Find the head: a metric no other metric points to as its nextSibling.
  const pointedToAsNext = new Set(
    metrics.map((m) => m.previousSibling).filter((id): id is string => id !== null)
  );
  const heads = metrics.filter((m) => m.previousSibling === null || !byId.has(m.previousSibling));
  const head = heads.find((m) => !pointedToAsNext.has(m.id)) ?? heads[0] ?? metrics[0];

  const sorted: MetricRow[] = [];
  const visited = new Set<string>();
  let current: MetricRow | undefined = head;
  while (current && !visited.has(current.id)) {
    visited.add(current.id);
    sorted.push(current);
    current = current.nextSibling ? byId.get(current.nextSibling) : undefined;
  }
  // Any metrics not reached by the walk (orphans / broken links) — append in insertion order.
  for (const m of metrics) {
    if (!visited.has(m.id)) sorted.push(m);
  }
  return sorted;
}

export default function DatasetEditor({ datasetId }: Props) {
  const { data, loading, error, refetch } = useQuery<InstanceDatasetQuery>(GET_INSTANCE_DATASET, {
    fetchPolicy: 'cache-and-network',
  });
  const router = useRouter();
  const pathname = usePathname();
  const listBase = getListBase(pathname);

  const dataset = useMemo(
    () => data?.instance.editor?.datasets.find((d) => d.id === datasetId) ?? null,
    [data, datasetId]
  );

  const [name, setName] = useState('');
  const [syncedName, setSyncedName] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Sync local editable name with the fetched dataset whenever it changes.
  if (dataset && dataset.name !== syncedName) {
    setSyncedName(dataset.name);
    setName(dataset.name);
  }

  const sortedMetrics = useMemo(
    () => (dataset ? sortMetricsBySiblings(dataset.metrics) : []),
    [dataset]
  );

  if (loading && !data) {
    return (
      <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }
  if (error) return <GraphQLError error={error} />;
  if (!dataset) {
    return (
      <Container maxWidth="md" sx={{ py: 3 }}>
        <Button startIcon={<ArrowLeft />} onClick={() => router.push(listBase)}>
          Back to datasets
        </Button>
        <Alert severity="warning" sx={{ mt: 2 }}>
          Dataset not found.
        </Alert>
      </Container>
    );
  }

  const isExternal = dataset.isExternalPlaceholder;
  const nameDirty = name !== dataset.name;

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Button startIcon={<ArrowLeft />} onClick={() => router.push(listBase)} sx={{ mb: 2 }}>
        Back to datasets
      </Button>

      {/* Metadata */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Dataset
        </Typography>
        <Stack spacing={2}>
          <TextField
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
          />
          <TextField
            label="Identifier"
            value={dataset.identifier ?? ''}
            disabled
            helperText="The identifier cannot be changed."
            fullWidth
          />
          {dataset.externalRef && (
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                <Link45deg />
                <Typography variant="subtitle2">External source</Typography>
                {isExternal && <Chip label="Placeholder" size="small" color="warning" />}
              </Stack>
              <Stack spacing={1}>
                <TextField
                  label="Repository URL"
                  value={dataset.externalRef.repoUrl}
                  disabled
                  fullWidth
                  size="small"
                />
                <TextField
                  label="Dataset path"
                  value={dataset.externalRef.datasetId}
                  disabled
                  fullWidth
                  size="small"
                />
                {dataset.externalRef.commit && (
                  <TextField
                    label="Commit"
                    value={dataset.externalRef.commit}
                    disabled
                    fullWidth
                    size="small"
                    slotProps={{ input: { sx: { fontFamily: 'monospace' } } }}
                  />
                )}
              </Stack>
            </Paper>
          )}
          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button variant="outlined" disabled={!nameDirty} onClick={() => setName(dataset.name)}>
              Discard
            </Button>
            <Button
              variant="contained"
              disabled={!nameDirty}
              onClick={() =>
                setNotice('Saving dataset metadata is not yet implemented on the backend.')
              }
            >
              Save changes
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {/* Dimensions */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <Typography variant="h6">Dimensions</Typography>
          <Button
            startIcon={<Plus />}
            onClick={() => setNotice('Attaching dimensions is not yet implemented on the backend.')}
          >
            Add dimension
          </Button>
        </Stack>
        {dataset.dimensions.length === 0 ? (
          <Typography color="text.secondary">No dimensions attached.</Typography>
        ) : (
          <Stack spacing={2}>
            {dataset.dimensions.map((dim) => (
              <Paper key={dim.id} variant="outlined" sx={{ p: 2 }}>
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  sx={{ mb: 1 }}
                >
                  <Typography variant="subtitle2">{dim.name}</Typography>
                  <Tooltip title="Detach dimension">
                    <span>
                      <IconButton
                        size="small"
                        onClick={() =>
                          setNotice('Detaching dimensions is not yet implemented on the backend.')
                        }
                      >
                        <Trash />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Stack>
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                  {dim.categories.map((cat) => (
                    <Chip key={cat.uuid} label={cat.label} size="small" variant="outlined" />
                  ))}
                </Box>
              </Paper>
            ))}
          </Stack>
        )}
      </Paper>

      {/* Metrics */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <Typography variant="h6">Metrics</Typography>
          <Button
            startIcon={<Plus />}
            onClick={() => setNotice('Creating metrics is not yet implemented on the backend.')}
          >
            Add metric
          </Button>
        </Stack>
        {sortedMetrics.length === 0 ? (
          <Typography color="text.secondary">No metrics defined.</Typography>
        ) : (
          <Stack spacing={1}>
            {sortedMetrics.map((m) => (
              <Paper key={m.id} variant="outlined" sx={{ p: 2 }}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Box sx={{ flex: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Label
                    </Typography>
                    <Typography>{m.label}</Typography>
                  </Box>
                  <Box sx={{ flex: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Column
                    </Typography>
                    <Typography sx={{ fontFamily: 'monospace' }}>{m.name ?? '—'}</Typography>
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Unit
                    </Typography>
                    <Typography>{m.unit}</Typography>
                  </Box>
                  <Tooltip title="Edit">
                    <span>
                      <IconButton
                        size="small"
                        onClick={() =>
                          setNotice('Editing metrics is not yet implemented on the backend.')
                        }
                      >
                        <Plus style={{ transform: 'rotate(45deg)' }} />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <span>
                      <IconButton
                        size="small"
                        onClick={() =>
                          setNotice('Deleting metrics is not yet implemented on the backend.')
                        }
                      >
                        <Trash />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Stack>
              </Paper>
            ))}
          </Stack>
        )}
      </Paper>

      {/* Data points */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Data points
        </Typography>
        {isExternal ? (
          <Alert severity="info">
            This is an external placeholder dataset. Data points are stored in the external
            repository and are not editable here.
          </Alert>
        ) : (
          <DatasetDataGrid
            dataset={dataset}
            onMutated={() => {
              void refetch();
            }}
          />
        )}
      </Paper>

      <Snackbar
        open={notice !== null}
        autoHideDuration={4000}
        onClose={() => setNotice(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="info" onClose={() => setNotice(null)}>
          {notice}
        </Alert>
      </Snackbar>
    </Container>
  );
}
