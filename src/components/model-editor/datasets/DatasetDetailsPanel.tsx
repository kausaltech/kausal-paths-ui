import { useMemo, useState } from 'react';
import Link from 'next/link';

import {
  Box,
  Button,
  Chip,
  Collapse,
  IconButton,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';

import { useTranslations } from 'next-intl';
import {
  CaretDownFill,
  CaretRightFill,
  Link45deg,
  PencilSquare,
  Plus,
  Trash,
} from 'react-bootstrap-icons';

import type {
  CreateDataSourceInput,
  DataSourceFieldsFragment,
  DatasetConnectedNodesQuery,
  DatasetDetailFieldsFragment,
  DatasetSourceReferenceFieldsFragment,
} from '@/common/__generated__/graphql';
import { getNodeStyle } from '../ElkNode';
import { ConnectedNodeChip } from '../node-details/shared';
import { AttachSourceForm, SourceReferenceCard } from './shared';

type MetricRow = DatasetDetailFieldsFragment['metrics'][number];
type DimensionRow = DatasetDetailFieldsFragment['dimensions'][number];
type CategoryRow = DimensionRow['categories'][number];
type ConnectedNode = DatasetConnectedNodesQuery['instance']['nodes'][number];

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

type Props = {
  dataset: DatasetDetailFieldsFragment;
  sourceReferences: readonly DatasetSourceReferenceFieldsFragment[];
  availableDataSources: readonly DataSourceFieldsFragment[];
  connectedNodes: readonly ConnectedNode[];
  connectedNodeCount: number;
  usedCategoryUuids: Set<string>;
  sortedMetrics: readonly MetricRow[];
  modelEditorBase: string;
  onAttachToDataset: (dataSourceId: string) => Promise<void>;
  onDetachSource: (referenceId: string) => Promise<void>;
  onCreateDataSource: (input: CreateDataSourceInput) => Promise<DataSourceFieldsFragment>;
  onNotice: (message: string) => void;
  onNavigateToNode: (nodeId: string) => void;
};

export default function DatasetDetailsPanel({
  dataset,
  sourceReferences,
  availableDataSources,
  connectedNodes,
  connectedNodeCount,
  usedCategoryUuids,
  sortedMetrics,
  modelEditorBase,
  onAttachToDataset,
  onDetachSource,
  onCreateDataSource,
  onNotice,
  onNavigateToNode,
}: Props) {
  const t = useTranslations('model-editor');
  const isExternal = dataset.isExternalPlaceholder;

  // Local editable name, synced to the fetched dataset whenever it changes.
  const [name, setName] = useState(dataset.name);
  const [syncedName, setSyncedName] = useState(dataset.name);
  if (dataset.name !== syncedName) {
    setSyncedName(dataset.name);
    setName(dataset.name);
  }
  const nameDirty = name !== dataset.name;

  return (
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
                onClick={() => onNotice(t('datasets-saving-metadata-not-implemented'))}
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
        onAttachToDataset={onAttachToDataset}
        onDetach={onDetachSource}
        onCreateDataSource={onCreateDataSource}
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
              const isOutcome = node.__typename === 'Node' ? (node.isOutcome ?? false) : false;
              const style = getNodeStyle(node.kind ?? '', nodeClass, isOutcome);
              return (
                <ConnectedNodeChip
                  key={node.id}
                  nodeId={node.id}
                  label={node.name ?? node.id}
                  style={style}
                  onSelect={(id) => onNavigateToNode(id)}
                  onHover={() => {}}
                />
              );
            })}
          </Box>
        )}
      </Paper>

      {/* Dimensions */}
      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <Typography variant="subtitle1">{t('datasets-dimensions')}</Typography>
          <Button
            size="small"
            startIcon={<Plus />}
            onClick={() => onNotice(t('datasets-attaching-dimensions-not-implemented'))}
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
                            onNotice(t('datasets-detaching-dimensions-not-implemented'))
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
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <Typography variant="subtitle1">{t('datasets-metrics')}</Typography>
          <Button
            size="small"
            startIcon={<Plus />}
            onClick={() => onNotice(t('datasets-creating-metrics-not-implemented'))}
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
                            onClick={() => onNotice(t('datasets-editing-metrics-not-implemented'))}
                          >
                            <PencilSquare />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title={t('common-delete')}>
                        <span>
                          <IconButton
                            size="small"
                            onClick={() => onNotice(t('datasets-deleting-metrics-not-implemented'))}
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
  );
}
