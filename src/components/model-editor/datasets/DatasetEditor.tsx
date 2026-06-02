import { useMemo, useState } from 'react';
import Link from 'next/link';
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

import { useFragment, useMutation, useQuery } from '@apollo/client/react';
import { useTranslations } from 'next-intl';
import {
  ArrowLeft,
  CaretDownFill,
  CaretRightFill,
  InfoCircle,
  Link45deg,
  PencilSquare,
  Plus,
  Sliders,
  Trash,
} from 'react-bootstrap-icons';

import type {
  CreateDataPointCommentMutation,
  CreateDataPointCommentMutationVariables,
  CreateDataSourceInput,
  CreateDataSourceMutation,
  CreateDataSourceMutationVariables,
  CreateSourceReferenceMutation,
  CreateSourceReferenceMutationVariables,
  DataSourceFieldsFragment,
  DatasetConnectedNodesQuery,
  DatasetConnectedNodesQueryVariables,
  DatasetDetailFieldsFragment,
  DatasetSourceReferenceFieldsFragment,
  DatasetSummaryFieldsFragment,
  DeleteSourceReferenceMutation,
  DeleteSourceReferenceMutationVariables,
  InstanceDatasetQuery,
  ResolveDataPointCommentMutation,
  ResolveDataPointCommentMutationVariables,
  UnresolveDataPointCommentMutation,
  UnresolveDataPointCommentMutationVariables,
} from '@/common/__generated__/graphql';
import { DataPointCommentReviewState } from '@/common/__generated__/graphql';
import { useInstance } from '@/common/instance';
import GraphQLError from '@/components/common/GraphQLError';
import { getNodeStyle } from '../ElkNode';
import { ConnectedNodeChip } from '../node-details/shared';
import DataPointDetailsPanel from './DataPointDetailsPanel';
import DatasetDataGrid from './DatasetDataGrid';
import {
  CREATE_DATA_POINT_COMMENT,
  CREATE_DATA_SOURCE,
  CREATE_SOURCE_REFERENCE,
  DATASET_SUMMARY_FIELDS,
  DATA_POINT_COMMENT_FIELDS,
  DELETE_SOURCE_REFERENCE,
  GET_DATASET_CONNECTED_NODES,
  GET_INSTANCE_DATASET,
  RESOLVE_DATA_POINT_COMMENT,
  UNRESOLVE_DATA_POINT_COMMENT,
} from './queries';
import {
  AttachSourceForm,
  type CommentWithDataPoint,
  type SelectedCell,
  SourceReferenceCard,
} from './shared';

type Props = {
  datasetId: string;
};

type MetricRow = DatasetDetailFieldsFragment['metrics'][number];
type DimensionRow = DatasetDetailFieldsFragment['dimensions'][number];
type CategoryRow = DimensionRow['categories'][number];

function CategoryChip({ cat, used }: { cat: CategoryRow; used: boolean }) {
  const t = useTranslations('model-editor');
  return (
    <Tooltip title={used ? t('datasets-category-used') : t('datasets-category-not-used')}>
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
  const t = useTranslations('model-editor');
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
          {t('datasets-no-categories')}
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
            {showUnused
              ? t('datasets-hide-unused-with-count', { count: unused.length })
              : t('datasets-show-unused-with-count', { count: unused.length })}
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

// Dataset-scoped data sources section in the dataset details panel (references
// not tied to a specific data point). Per-data-point sources live in the data
// point details panel.
function DatasetSourcesSection({
  refs,
  availableDataSources,
  onAttachToDataset,
  onDetach,
  onCreateDataSource,
}: {
  refs: readonly DatasetSourceReferenceFieldsFragment[];
  availableDataSources: readonly DataSourceFieldsFragment[];
  onAttachToDataset: (dataSourceId: string) => Promise<void>;
  onDetach: (referenceId: string) => Promise<void>;
  onCreateDataSource: (input: CreateDataSourceInput) => Promise<DataSourceFieldsFragment>;
}) {
  const t = useTranslations('model-editor');
  const datasetScopeRefs = refs.filter((r) => r.dataPoint === null);
  // Grey out sources already attached at dataset scope so the picker only
  // offers new ones.
  const attachedIds = useMemo(
    () => new Set(datasetScopeRefs.map((r) => r.dataSource.id)),
    [datasetScopeRefs]
  );

  // Per-ref busy state so multiple detach actions can be in flight.
  const [detachingIds, setDetachingIds] = useState<Set<string>>(() => new Set());
  const handleDetach = async (referenceId: string) => {
    if (detachingIds.has(referenceId)) return;
    setDetachingIds((prev) => new Set(prev).add(referenceId));
    try {
      await onDetach(referenceId);
    } catch {
      // Swallow — the card stays until the cache/refetch updates.
    } finally {
      setDetachingIds((prev) => {
        const next = new Set(prev);
        next.delete(referenceId);
        return next;
      });
    }
  };

  return (
    <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
      <Typography variant="subtitle1" sx={{ mb: 2 }}>
        {t('datasets-data-sources')}{' '}
        <Typography component="span" variant="body2" color="text.secondary">
          ({datasetScopeRefs.length})
        </Typography>
      </Typography>
      <AttachSourceForm
        availableDataSources={availableDataSources}
        attachedIds={attachedIds}
        onAttach={onAttachToDataset}
        onCreateDataSource={onCreateDataSource}
      />
      {datasetScopeRefs.length === 0 ? (
        <Typography color="text.secondary" variant="body2">
          {t('datasets-no-sources-attached-dataset')}
        </Typography>
      ) : (
        <Stack spacing={1.5}>
          {datasetScopeRefs.map((r) => (
            <SourceReferenceCard
              key={r.id}
              reference={r}
              onDetach={() => void handleDetach(r.id)}
              detaching={detachingIds.has(r.id)}
            />
          ))}
        </Stack>
      )}
    </Paper>
  );
}

function getListBase(pathname: string): string {
  const idx = pathname.indexOf('/model');
  return idx >= 0 ? pathname.slice(0, idx) + '/model/datasets' : '/model/datasets';
}

function getModelEditorBase(pathname: string): string {
  const idx = pathname.indexOf('/model');
  return idx >= 0 ? pathname.slice(0, idx) + '/model' : '/model';
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
  const t = useTranslations('model-editor');
  const { data, loading, error, refetch } = useQuery<InstanceDatasetQuery>(GET_INSTANCE_DATASET, {
    variables: { datasetId },
    fetchPolicy: 'cache-and-network',
  });
  // Read whatever the list query already cached for this dataset, so we can
  // render the page chrome (name, identifier, dimensions, etc.) immediately
  // while the detail query is still in flight. `complete` is false until every
  // field in DatasetSummaryFields is present.
  const { data: cachedSummary, complete: cachedSummaryComplete } =
    useFragment<DatasetSummaryFieldsFragment>({
      fragment: DATASET_SUMMARY_FIELDS,
      fragmentName: 'DatasetSummaryFields',
      from: { __typename: 'Dataset', id: datasetId },
    });
  const summaryFromCache = cachedSummaryComplete ? cachedSummary : null;
  const instance = useInstance();
  const [createComment] = useMutation<
    CreateDataPointCommentMutation,
    CreateDataPointCommentMutationVariables
  >(CREATE_DATA_POINT_COMMENT);
  const [resolveComment] = useMutation<
    ResolveDataPointCommentMutation,
    ResolveDataPointCommentMutationVariables
  >(RESOLVE_DATA_POINT_COMMENT);
  const [unresolveComment] = useMutation<
    UnresolveDataPointCommentMutation,
    UnresolveDataPointCommentMutationVariables
  >(UNRESOLVE_DATA_POINT_COMMENT);
  const [createSourceReference] = useMutation<
    CreateSourceReferenceMutation,
    CreateSourceReferenceMutationVariables
  >(CREATE_SOURCE_REFERENCE);
  const [deleteSourceReference] = useMutation<
    DeleteSourceReferenceMutation,
    DeleteSourceReferenceMutationVariables
  >(DELETE_SOURCE_REFERENCE);
  const [createDataSource] = useMutation<
    CreateDataSourceMutation,
    CreateDataSourceMutationVariables
  >(CREATE_DATA_SOURCE);
  const router = useRouter();
  const pathname = usePathname();
  const listBase = getListBase(pathname);
  const modelEditorBase = getModelEditorBase(pathname);

  const dataset = data?.instance.editor?.dataset ?? null;

  const [name, setName] = useState('');
  const [syncedName, setSyncedName] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [openPanel, setOpenPanel] = useState<'details' | 'datapoint' | null>(null);
  const [selectedDataPointId, setSelectedDataPointId] = useState<string | null>(null);
  // Identifying details of the focused data cell (year / metric / categories /
  // value), reported by the grid. Set for empty cells too — those have no
  // dataPointId, so the panel shows the chips with a "no value" hint.
  const [selectedCell, setSelectedCell] = useState<SelectedCell | null>(null);
  const drawerOpen = openPanel !== null;
  const DETAILS_WIDTH = 420;

  const commentsWithDataPoint = useMemo<CommentWithDataPoint[]>(() => {
    if (!dataset) return [];
    const all: CommentWithDataPoint[] = [];
    for (const dp of dataset.dataPoints) {
      for (const c of dp.comments) all.push({ ...c, dataPointId: dp.id });
    }
    all.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return all;
  }, [dataset]);

  const sourceReferences = useMemo<readonly DatasetSourceReferenceFieldsFragment[]>(
    () => dataset?.sourceReferences ?? [],
    [dataset]
  );
  const availableDataSources = useMemo<readonly DataSourceFieldsFragment[]>(
    () => data?.instance.editor?.dataSources ?? [],
    [data]
  );
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
      <Box sx={{ pt: 20, pb: 3, px: 3, height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Button
          startIcon={<ArrowLeft />}
          onClick={() => router.push(listBase)}
          sx={{ mb: 2, alignSelf: 'flex-start' }}
        >
          {t('datasets-back-to-datasets')}
        </Button>
        <Paper sx={{ p: 3, flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          {summaryFromCache && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="h3">{summaryFromCache.name}</Typography>
              {summaryFromCache.identifier && (
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  sx={{ fontFamily: 'monospace' }}
                >
                  {summaryFromCache.identifier}
                </Typography>
              )}
            </Box>
          )}
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CircularProgress />
          </Box>
        </Paper>
      </Box>
    );
  }
  if (error) return <GraphQLError error={error} />;
  if (!dataset) {
    return (
      <Box sx={{ pt: 20, pb: 3, px: 3 }}>
        <Button startIcon={<ArrowLeft />} onClick={() => router.push(listBase)}>
          {t('datasets-back-to-datasets')}
        </Button>
        <Alert severity="warning" sx={{ mt: 2 }}>
          {t('datasets-dataset-not-found')}
        </Alert>
      </Box>
    );
  }

  const isExternal = dataset.isExternalPlaceholder;
  const nameDirty = name !== dataset.name;

  // Source-reference handlers shared by the dataset-scope sources panel and the
  // per-data-point sources section. Pass dataPointId=null to attach at dataset
  // scope. Each refetches afterwards because, as with comments, the SSR-hydrated
  // InstanceDataset observer doesn't re-render from a passive cache broadcast in
  // this runtime (the cache.modify is kept for the instant case where it does).
  const handleAttachSource = async (dataSourceId: string, dataPointId: string | null) => {
    const result = await createSourceReference({
      variables: {
        instanceId: instance.id,
        datasetId: dataset.id,
        input: { dataSourceId, toDataset: dataPointId === null, dataPointId },
      },
      // Optimistically append the new ref to Dataset.sourceReferences(target: ALL).
      update: (cache, { data: muData }) => {
        const payload = muData?.instanceEditor.datasetEditor.createSourceReference;
        if (payload?.__typename !== 'DatasetSourceReference') return;
        const dsId = cache.identify({ __typename: 'Dataset', id: dataset.id });
        const refId = cache.identify(payload);
        if (!dsId || !refId) return;
        cache.modify({
          id: dsId,
          fields: {
            sourceReferences: (existing: readonly { __ref: string }[] = [], { storeFieldName }) => {
              if (!storeFieldName.includes('"ALL"')) return existing;
              return [...existing, { __ref: refId }];
            },
          },
        });
      },
    });
    const payload = result.data?.instanceEditor.datasetEditor.createSourceReference;
    if (payload?.__typename === 'OperationInfo') {
      throw new Error(payload.messages.map((m) => m.message).join('; '));
    }
    await refetch();
  };

  const handleDetachSource = async (referenceId: string) => {
    const result = await deleteSourceReference({
      variables: { instanceId: instance.id, datasetId: dataset.id, referenceId },
      // Evict the normalised entity so Apollo drops dangling refs everywhere.
      update: (cache, { data: muData }) => {
        const messages = muData?.instanceEditor.datasetEditor.deleteSourceReference?.messages ?? [];
        if (messages.length > 0) return;
        cache.evict({
          id: cache.identify({ __typename: 'DatasetSourceReference', id: referenceId }),
        });
        cache.gc();
      },
    });
    const messages =
      result.data?.instanceEditor.datasetEditor.deleteSourceReference?.messages ?? [];
    if (messages.length > 0) {
      throw new Error(messages.map((m) => m.message).join('; '));
    }
    await refetch();
  };

  const handleCreateDataSource = async (
    input: CreateDataSourceInput
  ): Promise<DataSourceFieldsFragment> => {
    const result = await createDataSource({
      variables: { instanceId: instance.id, input },
      // Append to instance.editor.dataSources so the picker lists it; the
      // caller preselects it, so no refetch is needed for the immediate flow.
      update: (cache, { data: muData }) => {
        const payload = muData?.instanceEditor.createDataSource;
        if (payload?.__typename !== 'DataSource') return;
        cache.updateQuery<InstanceDatasetQuery>(
          { query: GET_INSTANCE_DATASET, variables: { datasetId } },
          (existing) => {
            if (!existing?.instance.editor) return existing;
            return {
              ...existing,
              instance: {
                ...existing.instance,
                editor: {
                  ...existing.instance.editor,
                  dataSources: [...existing.instance.editor.dataSources, payload],
                },
              },
            };
          }
        );
      },
    });
    const payload = result.data?.instanceEditor.createDataSource;
    if (!payload) {
      throw new Error(t('datasets-create-data-source-no-payload'));
    }
    if (payload.__typename === 'OperationInfo') {
      throw new Error(payload.messages.map((m) => m.message).join('; '));
    }
    return payload;
  };

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
              easing: drawerOpen
                ? theme.transitions.easing.easeOut
                : theme.transitions.easing.sharp,
              duration: drawerOpen
                ? theme.transitions.duration.enteringScreen
                : theme.transitions.duration.leavingScreen,
            }),
          marginRight: drawerOpen ? `${DETAILS_WIDTH}px` : 0,
        }}
      >
        <Button
          startIcon={<ArrowLeft />}
          onClick={() => router.push(listBase)}
          sx={{ mb: 2, alignSelf: 'flex-start' }}
        >
          {t('datasets-back-to-datasets')}
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
            <Stack direction="row" spacing={1}>
              <Button
                startIcon={<InfoCircle />}
                variant={openPanel === 'datapoint' ? 'contained' : 'text'}
                onClick={() => setOpenPanel((p) => (p === 'datapoint' ? null : 'datapoint'))}
              >
                {t('datasets-datapoint-details')}
              </Button>
              <Button
                startIcon={<Sliders />}
                variant={openPanel === 'details' ? 'contained' : 'text'}
                onClick={() => setOpenPanel((p) => (p === 'details' ? null : 'details'))}
              >
                {t('datasets-dataset-details')}
              </Button>
            </Stack>
          </Stack>
          {isExternal ? (
            <Alert severity="info">{t('datasets-external-source-info')}</Alert>
          ) : (
            <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
              <DatasetDataGrid
                dataset={dataset}
                onMutated={() => refetch()}
                onSelectedDataPointChange={setSelectedDataPointId}
                onSelectedCellChange={setSelectedCell}
                onOpenPanel={setOpenPanel}
              />
            </Box>
          )}
        </Paper>
      </Box>

      <Drawer
        variant="persistent"
        anchor="right"
        open={drawerOpen}
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
          {openPanel === 'datapoint' ? (
            <DataPointDetailsPanel
              dataPointId={selectedDataPointId}
              selectedCell={selectedCell}
              comments={commentsWithDataPoint}
              sourceReferences={sourceReferences}
              availableDataSources={availableDataSources}
              onAttachSource={handleAttachSource}
              onDetachSource={handleDetachSource}
              onCreateDataSource={handleCreateDataSource}
              onSubmitComment={async (dataPointId, input) => {
                const result = await createComment({
                  variables: {
                    instanceId: instance.id,
                    datasetId: dataset.id,
                    dataPointId,
                    input: {
                      text: input.text,
                      isReview: input.isReview,
                      isSticky: false,
                      reviewState: input.isReview ? DataPointCommentReviewState.Unresolved : null,
                    },
                  },
                  // Append the new comment to its DataPoint's `comments` field
                  // directly in the normalised cache. Avoids refetching the
                  // whole InstanceDataset query (~48s on slow connections).
                  update: (cache, { data }) => {
                    const payload = data?.instanceEditor.datasetEditor.createDataPointComment;
                    if (payload?.__typename !== 'DataPointComment') return;
                    const dpId = cache.identify({
                      __typename: 'DataPoint',
                      id: dataPointId,
                    });
                    if (!dpId) return;
                    cache.modify({
                      id: dpId,
                      fields: {
                        // writeFragment guarantees the comment entity is fully
                        // written (so the InstanceDataset read stays complete and
                        // re-broadcasts) and returns a ref we can append. The
                        // dedupe guard keeps a re-run from inserting twice.
                        comments: (existing: readonly { __ref: string }[] = [], { readField }) => {
                          const ref = cache.writeFragment({
                            fragment: DATA_POINT_COMMENT_FIELDS,
                            fragmentName: 'DataPointCommentFields',
                            data: payload,
                          });
                          if (!ref) return existing;
                          if (existing.some((e) => readField('id', e) === payload.id)) {
                            return existing;
                          }
                          return [...existing, ref];
                        },
                      },
                    });
                  },
                });
                const payload = result.data?.instanceEditor.datasetEditor.createDataPointComment;
                if (payload?.__typename === 'OperationInfo') {
                  throw new Error(payload.messages.map((m) => m.message).join('; '));
                }
                // The cache.modify above updates the normalised cache, but the
                // SSR-hydrated InstanceDataset observer doesn't re-render from a
                // passive cache broadcast in this runtime (only from its own
                // fetch — same reason the grid refetches after every edit). So
                // refetch to make the new comment show in both the panel and the
                // grid's per-cell comment indicator without a manual reload.
                await refetch();
              }}
              onSetResolved={async (commentId, resolved) => {
                const variables = {
                  instanceId: instance.id,
                  datasetId: dataset.id,
                  commentId,
                };
                const payload = resolved
                  ? (await resolveComment({ variables })).data?.instanceEditor.datasetEditor
                      .resolveDataPointComment
                  : (await unresolveComment({ variables })).data?.instanceEditor.datasetEditor
                      .unresolveDataPointComment;
                if (payload?.__typename === 'OperationInfo') {
                  throw new Error(payload.messages.map((m) => m.message).join('; '));
                }
                // Same reactivity caveat as comment creation: refetch so the
                // resolved/unresolved state (and the cell's needs-review tint)
                // updates without a manual reload.
                await refetch();
              }}
            />
          ) : (
            <>
              <Typography variant="h6" sx={{ mb: 2 }}>
                {t('datasets-dataset-details')}
              </Typography>

              {/* Metadata */}
              <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                <Typography variant="subtitle1" sx={{ mb: 2 }}>
                  {t('datasets-dataset')}
                </Typography>
                <Stack spacing={2}>
                  <TextField
                    label={t('datasets-name')}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    fullWidth
                    size="small"
                  />
                  <TextField
                    label={t('datasets-identifier')}
                    value={dataset.identifier ?? ''}
                    disabled
                    helperText={t('datasets-identifier-helper')}
                    fullWidth
                    size="small"
                  />
                  {dataset.externalRef && (
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                        <Link45deg />
                        <Typography variant="subtitle2">{t('datasets-external-source')}</Typography>
                        {isExternal && (
                          <Chip label={t('datasets-placeholder')} size="small" color="warning" />
                        )}
                      </Stack>
                      <Stack spacing={1}>
                        <TextField
                          label={t('datasets-repository-url')}
                          value={dataset.externalRef.repoUrl}
                          disabled
                          fullWidth
                          size="small"
                        />
                        <TextField
                          label={t('datasets-dataset-path')}
                          value={dataset.externalRef.datasetId}
                          disabled
                          fullWidth
                          size="small"
                        />
                        {dataset.externalRef.commit && (
                          <TextField
                            label={t('datasets-commit')}
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
                  {nameDirty && (
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Button size="small" variant="outlined" onClick={() => setName(dataset.name)}>
                        {t('common-discard')}
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => setNotice(t('datasets-saving-metadata-not-implemented'))}
                      >
                        {t('common-save-changes')}
                      </Button>
                    </Stack>
                  )}
                </Stack>
              </Paper>

              {/* Data sources */}
              <DatasetSourcesSection
                refs={sourceReferences}
                availableDataSources={availableDataSources}
                onAttachToDataset={(dataSourceId) => handleAttachSource(dataSourceId, null)}
                onDetach={handleDetachSource}
                onCreateDataSource={handleCreateDataSource}
              />

              {/* Connected nodes */}
              <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                <Typography variant="subtitle1" sx={{ mb: 2 }}>
                  {t('datasets-connected-nodes')}{' '}
                  <Typography component="span" variant="body2" color="text.secondary">
                    ({connectedNodeCount})
                  </Typography>
                </Typography>
                {connectedNodeCount === 0 ? (
                  <Typography color="text.secondary" variant="body2">
                    {t('datasets-no-nodes-bound')}
                  </Typography>
                ) : (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                    {connectedNodes.map((node) => {
                      const nodeClass =
                        node.editor?.spec?.typeConfig && 'nodeClass' in node.editor.spec.typeConfig
                          ? node.editor.spec.typeConfig.nodeClass
                          : (node.editor?.nodeType ?? '');
                      const isOutcome =
                        node.__typename === 'Node' ? (node.isOutcome ?? false) : false;
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
                  <Typography variant="subtitle1">{t('datasets-dimensions')}</Typography>
                  <Button
                    size="small"
                    startIcon={<Plus />}
                    onClick={() => setNotice(t('datasets-attaching-dimensions-not-implemented'))}
                  >
                    {t('common-add')}
                  </Button>
                </Stack>
                {dataset.dimensions.length === 0 ? (
                  <Typography color="text.secondary" variant="body2">
                    {t('datasets-no-dimensions-attached')}
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
                          <Stack direction="row">
                            <Tooltip title={t('common-edit')}>
                              <IconButton
                                size="small"
                                component={Link}
                                href={`${modelEditorBase}/dimensions/${encodeURIComponent(dim.id)}`}
                              >
                                <PencilSquare />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title={t('datasets-detach-dimension')}>
                              <span>
                                <IconButton
                                  size="small"
                                  onClick={() =>
                                    setNotice(t('datasets-detaching-dimensions-not-implemented'))
                                  }
                                >
                                  <Trash />
                                </IconButton>
                              </span>
                            </Tooltip>
                          </Stack>
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
                  <Typography variant="subtitle1">{t('datasets-metrics')}</Typography>
                  <Button
                    size="small"
                    startIcon={<Plus />}
                    onClick={() => setNotice(t('datasets-creating-metrics-not-implemented'))}
                  >
                    {t('common-add')}
                  </Button>
                </Stack>
                {sortedMetrics.length === 0 ? (
                  <Typography color="text.secondary" variant="body2">
                    {t('datasets-no-metrics-defined')}
                  </Typography>
                ) : (
                  <Stack spacing={1}>
                    {sortedMetrics.map((m) => (
                      <Paper key={m.id} variant="outlined" sx={{ p: 1.5 }}>
                        <Stack spacing={0.5}>
                          <Stack direction="row" alignItems="center" justifyContent="space-between">
                            <Typography variant="subtitle2">{m.label}</Typography>
                            <Stack direction="row">
                              <Tooltip title={t('common-edit')}>
                                <span>
                                  <IconButton
                                    size="small"
                                    onClick={() =>
                                      setNotice(t('datasets-editing-metrics-not-implemented'))
                                    }
                                  >
                                    <PencilSquare />
                                  </IconButton>
                                </span>
                              </Tooltip>
                              <Tooltip title={t('common-delete')}>
                                <span>
                                  <IconButton
                                    size="small"
                                    onClick={() =>
                                      setNotice(t('datasets-deleting-metrics-not-implemented'))
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
            </>
          )}
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
