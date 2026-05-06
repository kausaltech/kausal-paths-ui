import { Suspense, lazy, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Drawer,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';

import { Link45deg, PencilSquare, X } from 'react-bootstrap-icons';

import {
  type DatasetInfo,
  type DatasetPortData,
  useDatasetData,
} from './dataset-viewer/useDatasetData';

const MetricDataViewer = lazy(() => import('./metric-viewer/MetricDataViewer'));

function DatasetMetadata({
  dataset,
  usedDimensionKeys,
  usedCategoryKeysByDimension,
}: {
  dataset: DatasetInfo;
  usedDimensionKeys?: ReadonlySet<string>;
  usedCategoryKeysByDimension?: ReadonlyMap<string, ReadonlySet<string>>;
}) {
  const visibleDimensions = usedDimensionKeys
    ? dataset.dimensions.filter(
        (dim) => usedDimensionKeys.has(dim.id) || usedDimensionKeys.has(dim.name)
      )
    : dataset.dimensions;
  return (
    <Box sx={{ mb: 2 }}>
      {dataset.externalRef && (
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1 }}>
          <Chip
            icon={<Link45deg size={14} />}
            label={dataset.externalRef.datasetId}
            size="small"
            variant="outlined"
          />
          {dataset.externalRef.commit && (
            <Tooltip title="Repo commit">
              <Chip
                label={dataset.externalRef.commit.slice(0, 8)}
                size="small"
                variant="outlined"
                sx={{ fontFamily: 'monospace' }}
              />
            </Tooltip>
          )}
        </Box>
      )}
      {dataset.isExternalPlaceholder && (
        <Chip
          label="External placeholder (no local data)"
          size="small"
          color="warning"
          variant="outlined"
          sx={{ mb: 1 }}
        />
      )}

      {visibleDimensions.length > 0 && (
        <Box sx={{ mb: 1.5 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
            Dimensions
          </Typography>
          <TableContainer sx={{ mt: 0.5 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, py: 0.5 }}>Dimension</TableCell>
                  <TableCell sx={{ fontWeight: 600, py: 0.5 }}>Categories</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {visibleDimensions.map((dim) => {
                  const catKeys = usedCategoryKeysByDimension?.get(dim.name);
                  const visibleCategories = catKeys
                    ? dim.categories.filter(
                        (c) =>
                          catKeys.has(c.label) ||
                          (c.identifier != null && catKeys.has(c.identifier))
                      )
                    : dim.categories;
                  return (
                    <TableRow key={dim.id}>
                      <TableCell sx={{ py: 0.5 }}>{dim.name}</TableCell>
                      <TableCell sx={{ py: 0.5 }}>
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                          {visibleCategories.map((cat) => (
                            <Chip
                              key={cat.uuid}
                              label={cat.label}
                              size="small"
                              variant="outlined"
                            />
                          ))}
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {dataset.metrics.length > 0 && (
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
            Metrics
          </Typography>
          <TableContainer sx={{ mt: 0.5 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, py: 0.5 }}>Label</TableCell>
                  <TableCell sx={{ fontWeight: 600, py: 0.5 }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 600, py: 0.5 }}>Unit</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {dataset.metrics.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell sx={{ py: 0.5 }}>{m.label}</TableCell>
                    <TableCell sx={{ py: 0.5, fontFamily: 'monospace', fontSize: 12 }}>
                      {m.name ?? '–'}
                    </TableCell>
                    <TableCell sx={{ py: 0.5 }}>{m.unit}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
    </Box>
  );
}

function DatasetPortView({ port, editHref }: { port: DatasetPortData; editHref: string | null }) {
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
          justifyContent: 'space-between',
          gap: 1,
          mb: 1,
        }}
      >
        {port.boundMetric ? (
          <Typography variant="body2" color="text.secondary">
            Bound metric: <strong>{port.boundMetric.label}</strong>
          </Typography>
        ) : (
          <Box />
        )}
        {editHref && (
          <Button
            component={Link}
            href={editHref}
            size="small"
            variant="outlined"
            startIcon={<PencilSquare size={12} />}
            sx={{ textTransform: 'none', py: 0.25, fontSize: 12 }}
          >
            Edit dataset
          </Button>
        )}
      </Box>

      <DatasetMetadata
        dataset={port.dataset}
        usedDimensionKeys={usedDimensionKeys}
        usedCategoryKeysByDimension={usedCategoryKeysByDimension}
      />

      {port.metrics.length > 0 ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {port.metrics.map((metric) => (
            <Suspense key={metric.id} fallback={<CircularProgress size={20} />}>
              <MetricDataViewer metric={metric} />
            </Suspense>
          ))}
        </Box>
      ) : (
        <Typography variant="body2" color="text.disabled">
          No data points available
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
  const { datasetPorts, loading, error, fetch } = useDatasetData(nodeId);
  const pathname = usePathname();

  useEffect(() => {
    if (open && nodeId) fetch();
    // fetch on open and when node/binding changes while open
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, nodeId, bindingId]);

  const filtered = bindingId ? datasetPorts.filter((p) => p.bindingId === bindingId) : datasetPorts;
  const title = `Input dataset${filtered.length === 1 ? `: ${filtered[0].dataset.name}` : ''}`;

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
            Failed to load dataset: {error.message}
          </Typography>
        )}
        {!loading && filtered.length === 0 && !error && (
          <Typography color="text.secondary" sx={{ py: 2 }}>
            No dataset bindings found.
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
              editHref={
                editorBase ? `${editorBase}/datasets/${encodeURIComponent(port.dataset.id)}` : null
              }
            />
            {idx < filtered.length - 1 && <Divider sx={{ my: 2 }} />}
          </Box>
        ))}
      </Box>
    </Drawer>
  );
}
