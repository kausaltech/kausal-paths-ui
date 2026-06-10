import { useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Drawer,
  Paper,
  Snackbar,
  Stack,
  Typography,
} from '@mui/material';

import { useFragment, useMutation, useQuery } from '@apollo/client/react';
import { useTranslations } from 'next-intl';
import { ArrowLeft, InfoCircle, Sliders } from 'react-bootstrap-icons';

import type {
  CreateDataSourceInput,
  CreateDataSourceMutation,
  CreateDataSourceMutationVariables,
  CreateSourceReferenceMutation,
  CreateSourceReferenceMutationVariables,
  DataSourceFieldsFragment,
  DatasetConnectedNodesQuery,
  DatasetConnectedNodesQueryVariables,
  DatasetSourceReferenceFieldsFragment,
  DatasetSummaryFieldsFragment,
  DeleteSourceReferenceMutation,
  DeleteSourceReferenceMutationVariables,
  InstanceDatasetQuery,
} from '@/common/__generated__/graphql';
import { useInstance } from '@/common/instance';
import GraphQLError from '@/components/common/GraphQLError';
import { getModelEditorBase, getModelEditorSection } from '../paths';
import DataPointDetailsPanel from './DataPointDetailsPanel';
import DatasetDataGrid from './DatasetDataGrid';
import DatasetDetailsPanel from './DatasetDetailsPanel';
import { sortMetricsBySiblings } from './dataset-editor-utils';
import {
  CREATE_DATA_SOURCE,
  CREATE_SOURCE_REFERENCE,
  DATASET_SUMMARY_FIELDS,
  DELETE_SOURCE_REFERENCE,
  GET_DATASET_CONNECTED_NODES,
  GET_INSTANCE_DATASET,
} from './queries';
import { type CommentWithDataPoint, type SelectedCell } from './shared';
import { useDataPointComments } from './useDataPointComments';

type Props = {
  datasetId: string;
};

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
  const { submitComment, setResolved } = useDataPointComments({
    instanceId: instance.id,
    datasetId,
    onRefetch: refetch,
  });
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
  const listBase = getModelEditorSection(pathname, 'datasets');
  const modelEditorBase = getModelEditorBase(pathname);

  const dataset = data?.instance.editor?.dataset ?? null;

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
              onSubmitComment={submitComment}
              onSetResolved={setResolved}
            />
          ) : (
            <DatasetDetailsPanel
              dataset={dataset}
              sourceReferences={sourceReferences}
              availableDataSources={availableDataSources}
              connectedNodes={connectedNodes}
              connectedNodeCount={connectedNodeCount}
              usedCategoryUuids={usedCategoryUuids}
              sortedMetrics={sortedMetrics}
              modelEditorBase={modelEditorBase}
              onAttachToDataset={(dataSourceId) => handleAttachSource(dataSourceId, null)}
              onDetachSource={handleDetachSource}
              onCreateDataSource={handleCreateDataSource}
              onNotice={setNotice}
              onNavigateToNode={(id) =>
                router.push(`${modelEditorBase}/nodes?node=${encodeURIComponent(id)}`)
              }
            />
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
