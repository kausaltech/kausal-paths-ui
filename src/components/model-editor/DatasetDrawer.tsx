import { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Drawer,
  IconButton,
  Paper,
  Tooltip,
  Typography,
} from '@mui/material';

import { useTranslations } from 'next-intl';
import { PencilSquare, Sliders, X } from 'react-bootstrap-icons';

import {
  type DatasetInfo,
  type DatasetPortData,
  useDatasetData,
} from './dataset-viewer/useDatasetData';
import BindingEditor from './node-details/BindingEditor';
import { useDeleteBinding } from './usePortBindings';

const MetricDataViewer = lazy(() => import('./metric-viewer/MetricDataViewer'));

type DimmableChipItem = {
  key: string;
  label: string;
  /** Shown as a tooltip on the chip when set. */
  tooltip?: string;
  /** True when the binding doesn't use this entry. */
  dimmed: boolean;
};

/**
 * A wrapping chip row where the entries the binding uses are always shown and
 * the unused (dimmed) ones collapse behind a "+N unused" toggle. `items` is
 * expected to be sorted used-first.
 */
function DimmableChipRow({ items }: { items: readonly DimmableChipItem[] }) {
  const t = useTranslations('model-editor');
  const [expanded, setExpanded] = useState(false);
  const unusedCount = items.filter((item) => item.dimmed).length;
  const visible = expanded ? items : items.filter((item) => !item.dimmed);
  return (
    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
      {visible.map(({ key, label, tooltip, dimmed }) => {
        const chip = (
          <Chip
            key={key}
            label={label}
            size="small"
            variant="outlined"
            sx={dimmed ? { color: 'text.disabled', borderColor: 'divider' } : undefined}
          />
        );
        return tooltip ? (
          <Tooltip key={key} title={tooltip}>
            {chip}
          </Tooltip>
        ) : (
          chip
        );
      })}
      {unusedCount > 0 && (
        <Chip
          label={
            expanded
              ? t('datasets-categories-show-less')
              : t('datasets-categories-show-unused', { count: unusedCount })
          }
          size="small"
          variant="outlined"
          onClick={() => setExpanded((v) => !v)}
          sx={{ color: 'text.secondary', borderStyle: 'dashed' }}
        />
      )}
    </Box>
  );
}

function DatasetMetadata({
  dataset,
  usedDimensionKeys,
  usedCategoryKeysByDimension,
  boundMetric,
}: {
  dataset: DatasetInfo;
  usedDimensionKeys?: ReadonlySet<string>;
  usedCategoryKeysByDimension?: ReadonlyMap<string, ReadonlySet<string>>;
  /** The metric this binding carries; the rest of the dataset's metrics are collapsed. */
  boundMetric?: { id: string; name: string | null } | null;
}) {
  const t = useTranslations('model-editor');
  // The full dataset schema, with anything the binding's transformations
  // filter out shown dimmed (like the unused metrics) rather than hidden.
  // Used entries sort first; the sorts are stable so dataset order holds
  // within each group. Without usage info, everything renders normally.
  const dimensionItems = dataset.dimensions
    .map((dim) => {
      const dimUsed = usedDimensionKeys
        ? usedDimensionKeys.has(dim.id) || usedDimensionKeys.has(dim.name)
        : true;
      const catKeys = usedCategoryKeysByDimension?.get(dim.name);
      const items: DimmableChipItem[] = dim.categories
        .map((category) => ({
          key: category.uuid,
          label: category.label,
          dimmed:
            !dimUsed ||
            (catKeys != null &&
              !(
                catKeys.has(category.label) ||
                (category.identifier != null && catKeys.has(category.identifier))
              )),
        }))
        .sort((a, b) => Number(a.dimmed) - Number(b.dimmed));
      return { dim, dimUsed, items };
    })
    .sort((a, b) => Number(b.dimUsed) - Number(a.dimUsed));
  // Fall back to showing all metrics equally when the bound metric can't be
  // matched (whole-frame bindings, or a stale metric reference).
  const boundMetricRow = boundMetric
    ? (dataset.metrics.find(
        (m) => m.id === boundMetric.id || (boundMetric.name !== null && m.name === boundMetric.name)
      ) ?? null)
    : null;
  // Bound metric first; the stable sort keeps the rest in dataset order.
  const metricItems: DimmableChipItem[] = dataset.metrics
    .map((m) => ({
      key: m.id,
      label: `${m.name ?? m.label} (${m.unitInfo?.standard ?? '—'})`,
      tooltip: m.label ?? undefined,
      dimmed: boundMetricRow != null && m.id !== boundMetricRow.id,
    }))
    .sort((a, b) => Number(a.dimmed) - Number(b.dimmed));
  return (
    <Box sx={{ mb: 2 }}>
      {dataset.isExternalPlaceholder && (
        <Chip
          label={t('datasets-external-placeholder')}
          size="small"
          color="warning"
          variant="outlined"
          sx={{ mb: 1 }}
        />
      )}

      {dataset.metrics.length > 0 && (
        <Paper variant="outlined" sx={{ p: 1.5, mb: 1.5 }}>
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
              fontWeight: 600,
              display: 'block',
              mb: 1,
            }}
          >
            {t('datasets-metrics')}
          </Typography>
          <DimmableChipRow items={metricItems} />
        </Paper>
      )}

      {dimensionItems.length > 0 && (
        <Paper variant="outlined" sx={{ p: 1.5 }}>
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
              fontWeight: 600,
              display: 'block',
              mb: 1,
            }}
          >
            {t('datasets-categories')}
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {dimensionItems.map(({ dim, dimUsed, items }) => (
              <Box key={dim.id}>
                <Typography
                  variant="caption"
                  color={dimUsed ? 'text.secondary' : 'text.disabled'}
                  sx={{ display: 'block', mb: 0.5 }}
                >
                  {dim.name}
                </Typography>
                <DimmableChipRow items={items} />
              </Box>
            ))}
          </Box>
        </Paper>
      )}
    </Box>
  );
}

function DatasetPortView({
  port,
  editHref,
  onEditBinding,
}: {
  port: DatasetPortData;
  editHref: string | null;
  onEditBinding: () => void;
}) {
  const t = useTranslations('model-editor');
  // Show the bound metric's data first; DimensionalMetric names are the
  // dataset's metric column names, so match on the binding's metric name.
  const boundMetricName = port.boundMetric?.name ?? null;
  const orderedMetrics = boundMetricName
    ? [...port.metrics].sort(
        (a, b) => Number(b.name === boundMetricName) - Number(a.name === boundMetricName)
      )
    : port.metrics;
  // A metric-named binding without a select-metric step passes all metric
  // columns through to the node — usually a misconfiguration worth flagging.
  const missingSelectMetric =
    port.boundMetric != null &&
    port.dataset.metrics.length > 1 &&
    !port.transformations.some((tr) => tr.__typename === 'SelectMetricType');
  const usedDimensionKeys = new Set<string>();
  const usedCategoryKeysByDimension = new Map<string, Set<string>>();
  for (const metric of port.metrics) {
    for (const dim of metric.dimensions) {
      usedDimensionKeys.add(dim.id);
      if (dim.originalId) usedDimensionKeys.add(dim.originalId);
      if (dim.label) usedDimensionKeys.add(dim.label);

      const catKeys = usedCategoryKeysByDimension.get(dim.label) ?? new Set<string>();
      for (const cat of dim.categories) {
        if (cat.label) catKeys.add(cat.label);
        if (cat.originalId) catKeys.add(cat.originalId);
      }
      usedCategoryKeysByDimension.set(dim.label, catKeys);
    }
  }

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: 1,
          mb: 1,
        }}
      >
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<Sliders size={12} />}
            onClick={onEditBinding}
            sx={{ textTransform: 'none', py: 0.25, fontSize: 12 }}
          >
            {t('bindings-edit')}
          </Button>
          {editHref && (
            <Button
              component={Link}
              href={editHref}
              size="small"
              variant="outlined"
              startIcon={<PencilSquare size={12} />}
              sx={{ textTransform: 'none', py: 0.25, fontSize: 12 }}
            >
              {t('datasets-edit-dataset')}
            </Button>
          )}
        </Box>
      </Box>

      {missingSelectMetric && (
        <Alert severity="warning" sx={{ mb: 1.5, fontSize: 12 }}>
          {t('datasets-missing-select-metric', {
            metric: port.boundMetric?.label ?? port.boundMetric?.name ?? '',
          })}
        </Alert>
      )}

      <DatasetMetadata
        dataset={port.dataset}
        usedDimensionKeys={usedDimensionKeys}
        usedCategoryKeysByDimension={usedCategoryKeysByDimension}
        boundMetric={port.boundMetric}
      />

      <Typography
        variant="caption"
        sx={{
          color: 'text.secondary',
          fontWeight: 600,
          display: 'block',
          mb: 1,
        }}
      >
        {t('datasets-input-data-header')}
      </Typography>
      {orderedMetrics.length > 0 ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {orderedMetrics.map((metric) => (
            <Suspense key={metric.id} fallback={<CircularProgress size={20} />}>
              <MetricDataViewer metric={metric} />
            </Suspense>
          ))}
        </Box>
      ) : (
        <Typography
          variant="body2"
          sx={{
            color: 'text.disabled',
          }}
        >
          {t('datasets-no-data-points')}
        </Typography>
      )}
    </Box>
  );
}

type Props = {
  nodeId: string | null;
  bindingId: string | null;
  open: boolean;
  onClose: () => void;
  width: number;
  zIndex?: number;
};

export default function DatasetDrawer({ nodeId, bindingId, open, onClose, width, zIndex }: Props) {
  const t = useTranslations('model-editor');
  const { datasetPorts, loading, error, fetch } = useDatasetData(nodeId);
  const pathname = usePathname();
  const deleteBinding = useDeleteBinding();
  const [editingPort, setEditingPort] = useState<DatasetPortData | null>(null);

  useEffect(() => {
    if (open && nodeId) fetch();
    // fetch on open and when node/binding changes while open
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, nodeId, bindingId]);

  const filtered = bindingId ? datasetPorts.filter((p) => p.bindingId === bindingId) : datasetPorts;
  const title = t('datasets-input-dataset', {
    name: filtered.length === 1 ? `: ${filtered[0].dataset.name}` : '',
  });

  // Model-editor base URL (locale + instance prefix) derived from the current
  // pathname so edit links land on the same instance the user is editing.
  const editorBase = useMemo(() => {
    const idx = pathname.indexOf('/model');
    return idx >= 0 ? pathname.slice(0, idx) + '/model' : null;
  }, [pathname]);

  return (
    <Drawer
      variant="persistent"
      anchor="right"
      open={open}
      slotProps={{
        paper: {
          sx: {
            width,
            maxWidth: '100vw',
            boxShadow: 14,
            zIndex: zIndex ?? ((theme) => theme.zIndex.drawer + 1),
            display: 'flex',
            flexDirection: 'column',
          },
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 1.5,
          borderBottom: '1px solid',
          borderColor: 'divider',
          flexShrink: 0,
        }}
      >
        <Typography variant="h6" sx={{ fontSize: 16, fontWeight: 600 }}>
          {title}
        </Typography>
        <IconButton size="small" onClick={onClose}>
          <X size={20} />
        </IconButton>
      </Box>
      <Box sx={{ p: 2, flex: 1, minHeight: 0, overflowY: 'auto' }}>
        {loading && filtered.length === 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}
        {error && (
          <Typography color="error" sx={{ py: 2 }}>
            {t('datasets-failed-to-load-dataset', { error: error.message })}
          </Typography>
        )}
        {!loading && filtered.length === 0 && !error && (
          <Typography
            sx={{
              color: 'text.secondary',
              py: 2,
            }}
          >
            {t('datasets-no-bindings')}
          </Typography>
        )}
        {filtered.map((port, idx) => (
          <Box key={port.bindingId}>
            {filtered.length > 1 && (
              <Typography variant="h6" sx={{ fontSize: 15, fontWeight: 600, mb: 1 }}>
                {port.dataset.name}
                {port.boundMetric && ` → ${port.boundMetric.label}`}
              </Typography>
            )}
            <DatasetPortView
              port={port}
              onEditBinding={() => setEditingPort(port)}
              editHref={
                editorBase ? `${editorBase}/datasets/${encodeURIComponent(port.dataset.id)}` : null
              }
            />
            {idx < filtered.length - 1 && <Divider sx={{ my: 2 }} />}
          </Box>
        ))}
      </Box>
      <Dialog
        open={editingPort !== null}
        onClose={() => setEditingPort(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ pr: 6 }}>
          {t('bindings-edit')}
          <IconButton
            aria-label={t('common-close')}
            onClick={() => setEditingPort(null)}
            sx={{ position: 'absolute', right: 8, top: 8, color: 'text.secondary' }}
          >
            <X size={20} />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {editingPort && (
            <BindingEditor
              binding={{
                id: editingPort.bindingId,
                kind: 'dataset',
                tags: editingPort.tags,
                transformations: editingPort.transformations,
                metricId: editingPort.boundMetric?.id,
                metrics: editingPort.dataset.metrics,
              }}
              onSaved={() => {
                setEditingPort(null);
                fetch();
              }}
              onDelete={() => deleteBinding(editingPort.bindingId)}
            />
          )}
        </DialogContent>
      </Dialog>
    </Drawer>
  );
}
