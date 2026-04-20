import { useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Drawer,
  IconButton,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';

import { useQuery } from '@apollo/client/react';
import { ArrowLeft, Link45deg, Plus, Sliders, Trash, X } from 'react-bootstrap-icons';

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
  const [detailsOpen, setDetailsOpen] = useState(false);
  const DETAILS_WIDTH = 420;

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
      <Box sx={{ pt: 20, pb: 3, px: 3 }}>
        <Button startIcon={<ArrowLeft />} onClick={() => router.push(listBase)}>
          Back to datasets
        </Button>
        <Alert severity="warning" sx={{ mt: 2 }}>
          Dataset not found.
        </Alert>
      </Box>
    );
  }

  const isExternal = dataset.isExternalPlaceholder;
  const nameDirty = name !== dataset.name;

  return (
    <Box sx={{ display: 'flex', width: '100%' }}>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0,
          height: '100vh',
          pt: 20,
          pb: 3,
          px: 3,
          display: 'flex',
          flexDirection: 'column',
          transition: (theme) =>
            theme.transitions.create('margin', {
              easing: detailsOpen
                ? theme.transitions.easing.easeOut
                : theme.transitions.easing.sharp,
              duration: detailsOpen
                ? theme.transitions.duration.enteringScreen
                : theme.transitions.duration.leavingScreen,
            }),
          marginRight: detailsOpen ? `${DETAILS_WIDTH}px` : 0,
        }}
      >
        <Button
          startIcon={<ArrowLeft />}
          onClick={() => router.push(listBase)}
          sx={{ mb: 2, alignSelf: 'flex-start' }}
        >
          Back to datasets
        </Button>

        {/* Data points */}
        <Paper
          sx={{
            p: 3,
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
            <Typography variant="h6">{dataset.name}</Typography>
            <Button
              startIcon={<Sliders />}
              variant={detailsOpen ? 'contained' : 'text'}
              onClick={() => setDetailsOpen((v) => !v)}
            >
              Dataset details
            </Button>
          </Stack>
          {isExternal ? (
            <Alert severity="info">
              This is an external placeholder dataset. Data points are stored in the external
              repository and are not editable here.
            </Alert>
          ) : (
            <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
              <DatasetDataGrid
                dataset={dataset}
                onMutated={() => {
                  void refetch();
                }}
              />
            </Box>
          )}
        </Paper>
      </Box>

      <Drawer
        variant="persistent"
        anchor="right"
        open={detailsOpen}
        sx={{
          '& .MuiDrawer-paper': {
            width: DETAILS_WIDTH,
            boxSizing: 'border-box',
            height: '100vh',
          },
        }}
      >
        <Box sx={{ p: 3, height: '100%', overflowY: 'auto' }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
            <Typography variant="h6">Dataset details</Typography>
            <IconButton size="small" onClick={() => setDetailsOpen(false)}>
              <X />
            </IconButton>
          </Stack>

          {/* Metadata */}
          <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
            <Typography variant="subtitle1" sx={{ mb: 2 }}>
              Dataset
            </Typography>
            <Stack spacing={2}>
              <TextField
                label="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                fullWidth
                size="small"
              />
              <TextField
                label="Identifier"
                value={dataset.identifier ?? ''}
                disabled
                helperText="The identifier cannot be changed."
                fullWidth
                size="small"
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
              <Stack direction="row" spacing={1} justifyContent="flex-end">
                <Button
                  size="small"
                  variant="outlined"
                  disabled={!nameDirty}
                  onClick={() => setName(dataset.name)}
                >
                  Discard
                </Button>
                <Button
                  size="small"
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
          <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{ mb: 2 }}
            >
              <Typography variant="subtitle1">Dimensions</Typography>
              <Button
                size="small"
                startIcon={<Plus />}
                onClick={() =>
                  setNotice('Attaching dimensions is not yet implemented on the backend.')
                }
              >
                Add
              </Button>
            </Stack>
            {dataset.dimensions.length === 0 ? (
              <Typography color="text.secondary" variant="body2">
                No dimensions attached.
              </Typography>
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
                              setNotice(
                                'Detaching dimensions is not yet implemented on the backend.'
                              )
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
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{ mb: 2 }}
            >
              <Typography variant="subtitle1">Metrics</Typography>
              <Button
                size="small"
                startIcon={<Plus />}
                onClick={() => setNotice('Creating metrics is not yet implemented on the backend.')}
              >
                Add
              </Button>
            </Stack>
            {sortedMetrics.length === 0 ? (
              <Typography color="text.secondary" variant="body2">
                No metrics defined.
              </Typography>
            ) : (
              <Stack spacing={1}>
                {sortedMetrics.map((m) => (
                  <Paper key={m.id} variant="outlined" sx={{ p: 1.5 }}>
                    <Stack spacing={0.5}>
                      <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Typography variant="subtitle2">{m.label}</Typography>
                        <Stack direction="row">
                          <Tooltip title="Edit">
                            <span>
                              <IconButton
                                size="small"
                                onClick={() =>
                                  setNotice(
                                    'Editing metrics is not yet implemented on the backend.'
                                  )
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
                                  setNotice(
                                    'Deleting metrics is not yet implemented on the backend.'
                                  )
                                }
                              >
                                <Trash />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </Stack>
                      </Stack>
                      <Stack direction="row" spacing={2}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ fontFamily: 'monospace' }}
                        >
                          {m.name ?? '—'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {m.unit}
                        </Typography>
                      </Stack>
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            )}
          </Paper>
        </Box>
      </Drawer>

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
    </Box>
  );
}
