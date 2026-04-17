import { Suspense, lazy, useEffect } from 'react';

import CloseIcon from '@mui/icons-material/Close';
import LinkIcon from '@mui/icons-material/Link';
import StorageIcon from '@mui/icons-material/Storage';
import {
  Box,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
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

import { type DatasetInfo, type DatasetPortData, useDatasetData } from './useDatasetData';

const MetricDataViewer = lazy(() => import('../metric-viewer/MetricDataViewer'));

type DatasetViewerModalProps = {
  open: boolean;
  onClose: () => void;
  nodeId: string;
  /** Pre-filter to a specific dataset binding ID, or null to show all for the node */
  bindingId: string | null;
};

function DatasetMetadata({ dataset }: { dataset: DatasetInfo }) {
  return (
    <Box sx={{ mb: 2 }}>
      {dataset.externalRef && (
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1 }}>
          <Chip
            icon={<LinkIcon sx={{ fontSize: 14 }} />}
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

      {dataset.dimensions.length > 0 && (
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
                {dataset.dimensions.map((dim) => (
                  <TableRow key={dim.id}>
                    <TableCell sx={{ py: 0.5 }}>{dim.name}</TableCell>
                    <TableCell sx={{ py: 0.5 }}>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {dim.categories.map((cat) => (
                          <Chip key={cat.uuid} label={cat.label} size="small" variant="outlined" />
                        ))}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
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

function DatasetPortView({ port }: { port: DatasetPortData }) {
  return (
    <Box>
      {port.boundMetric && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Bound metric: <strong>{port.boundMetric.label}</strong>
        </Typography>
      )}

      <DatasetMetadata dataset={port.dataset} />

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

export default function DatasetViewerModal({
  open,
  onClose,
  nodeId,
  bindingId,
}: DatasetViewerModalProps) {
  const { datasetPorts, loading, error, fetch } = useDatasetData(nodeId);

  useEffect(() => {
    if (open) {
      fetch();
    }
  }, [open, fetch]);

  const filtered = bindingId ? datasetPorts.filter((p) => p.bindingId === bindingId) : datasetPorts;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{ sx: { maxHeight: '85vh' } }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pr: 6 }}>
        <StorageIcon />
        {filtered.length === 1 ? filtered[0].dataset.name : 'Dataset Viewer'}
        <Box sx={{ flex: 1 }} />
        <IconButton onClick={onClose} sx={{ position: 'absolute', right: 8, top: 8 }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {loading && (
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
            <DatasetPortView port={port} />
            {idx < filtered.length - 1 && <Divider sx={{ my: 2 }} />}
          </Box>
        ))}
      </DialogContent>
    </Dialog>
  );
}
