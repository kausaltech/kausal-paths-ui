import { useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
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
import {
  ArrowLeft,
  CaretDownFill,
  CaretRightFill,
  Link45deg,
  Plus,
  Sliders,
  Trash,
} from 'react-bootstrap-icons';

import type {
  DatasetConnectedNodesQuery,
  DatasetConnectedNodesQueryVariables,
  DatasetDetailFieldsFragment,
  InstanceDatasetQuery,
} from '@/common/__generated__/graphql';
import GraphQLError from '@/components/common/GraphQLError';
import { getNodeStyle } from '../ElkNode';
import { ConnectedNodeChip } from '../node-details/shared';
import DatasetDataGrid from './DatasetDataGrid';
import { GET_DATASET_CONNECTED_NODES, GET_INSTANCE_DATASET } from './queries';

type Props = {
  datasetId: string;
};

type MetricRow = DatasetDetailFieldsFragment['metrics'][number];
type DimensionRow = DatasetDetailFieldsFragment['dimensions'][number];
type CategoryRow = DimensionRow['categories'][number];

function CategoryChip({ cat, used }: { cat: CategoryRow; used: boolean }) {
  return (
    <Tooltip title={used ? 'Used by data points' : 'Not used by any data point'}>
      <Chip
        label={cat.label}
        size="small"
        variant={used ? 'filled' : 'outlined'}
        color={used ? 'primary' : 'default'}
        sx={used ? undefined : { opacity: 0.6 }}
      />
    </Tooltip>
  );
}

function DimensionCategories({
  dim,
  usedCategoryUuids,
}: {
  dim: DimensionRow;
  usedCategoryUuids: Set<string>;
}) {
  const [showUnused, setShowUnused] = useState(false);
  const used = dim.categories.filter((c) => usedCategoryUuids.has(c.uuid));
  const unused = dim.categories.filter((c) => !usedCategoryUuids.has(c.uuid));

  return (
    <Stack spacing={1}>
      {used.length > 0 ? (
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
          {used.map((cat) => (
            <CategoryChip key={cat.uuid} cat={cat} used />
          ))}
        </Box>
      ) : (
        <Typography variant="caption" color="text.secondary">
          No categories used by any data point.
        </Typography>
      )}
      {unused.length > 0 && (
        <>
          <Button
            size="small"
            onClick={() => setShowUnused((v) => !v)}
            startIcon={showUnused ? <CaretDownFill /> : <CaretRightFill />}
            sx={{ alignSelf: 'flex-start', textTransform: 'none' }}
          >
            {showUnused ? 'Hide' : 'Show'} unused ({unused.length})
          </Button>
          <Collapse in={showUnused} unmountOnExit>
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
              {unused.map((cat) => (
                <CategoryChip key={cat.uuid} cat={cat} used={false} />
              ))}
            </Box>
          </Collapse>
        </>
      )}
    </Stack>
  );
}

function getListBase(pathname: string): string {
  const idx = pathname.indexOf('/model-editor');
  return idx >= 0 ? pathname.slice(0, idx) + '/model-editor/datasets' : '/model-editor/datasets';
}

function getModelEditorBase(pathname: string): string {
  const idx = pathname.indexOf('/model-editor');
  return idx >= 0 ? pathname.slice(0, idx) + '/model-editor' : '/model-editor';
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
  const modelEditorBase = getModelEditorBase(pathname);

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

  const usedCategoryUuids = useMemo(() => {
    const used = new Set<string>();
    if (!dataset) return used;
    for (const dp of dataset.dataPoints) {
      for (const cat of dp.dimensionCategories) used.add(cat.uuid);
    }
    return used;
  }, [dataset]);

  const connectedNodeIds = useMemo(() => {
    if (!dataset) return [] as string[];
    const ids = new Set<string>();
    for (const binding of dataset.portBindings) ids.add(binding.nodeRef.nodeId);
    return [...ids];
  }, [dataset]);
  const connectedNodeCount = connectedNodeIds.length;

  const { data: connectedNodesData } = useQuery<
    DatasetConnectedNodesQuery,
    DatasetConnectedNodesQueryVariables
  >(GET_DATASET_CONNECTED_NODES, {
    variables: { ids: connectedNodeIds },
    skip: connectedNodeIds.length === 0,
    fetchPolicy: 'cache-and-network',
  });
  const connectedNodes = connectedNodesData?.instance.nodes ?? [];

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
            <Box>
              <Typography variant="h3">{dataset.name}</Typography>
              {dataset.identifier && (
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  sx={{ fontFamily: 'monospace' }}
                >
                  {dataset.identifier}
                </Typography>
              )}
            </Box>
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
            boxShadow: (theme) => theme.shadows[4],
          },
        }}
      >
        <Box sx={{ p: 3, height: '100%', overflowY: 'auto' }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Dataset details
          </Typography>

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

          {/* Connected nodes */}
          <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
            <Typography variant="subtitle1" sx={{ mb: 2 }}>
              Connected nodes{' '}
              <Typography component="span" variant="body2" color="text.secondary">
                ({connectedNodeCount})
              </Typography>
            </Typography>
            {connectedNodeCount === 0 ? (
              <Typography color="text.secondary" variant="body2">
                No nodes are bound to this dataset.
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                {connectedNodes.map((node) => {
                  const nodeClass =
                    node.editor?.spec?.typeConfig && 'nodeClass' in node.editor.spec.typeConfig
                      ? node.editor.spec.typeConfig.nodeClass
                      : (node.editor?.nodeType ?? '');
                  const isOutcome = node.__typename === 'Node' ? (node.isOutcome ?? false) : false;
                  const style = getNodeStyle(node.kind ?? '', nodeClass, isOutcome);
                  return (
                    <ConnectedNodeChip
                      key={node.id}
                      nodeId={node.id}
                      label={node.name ?? node.id}
                      style={style}
                      onSelect={(id) =>
                        router.push(`${modelEditorBase}/nodes?node=${encodeURIComponent(id)}`)
                      }
                      onHover={() => {}}
                    />
                  );
                })}
              </Box>
            )}
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
                    <DimensionCategories dim={dim} usedCategoryUuids={usedCategoryUuids} />
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
