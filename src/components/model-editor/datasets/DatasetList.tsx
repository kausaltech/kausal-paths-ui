import { useState } from 'react';
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';

import { useQuery } from '@apollo/client/react';
import { Database, Link45deg, PencilSquare, Plus, Trash } from 'react-bootstrap-icons';

import type { InstanceDatasetsQuery } from '@/common/__generated__/graphql';
import GraphQLError from '@/components/common/GraphQLError';
import { GET_INSTANCE_DATASETS } from './queries';

function getDatasetsBase(pathname: string): string {
  const idx = pathname.indexOf('/model-editor');
  return idx >= 0 ? pathname.slice(0, idx) + '/model-editor/datasets' : '/model-editor/datasets';
}

export default function DatasetList() {
  const { data, loading, error } = useQuery<InstanceDatasetsQuery>(GET_INSTANCE_DATASETS, {
    fetchPolicy: 'cache-and-network',
  });
  const router = useRouter();
  const pathname = usePathname();
  const base = getDatasetsBase(pathname);
  const [notice, setNotice] = useState<string | null>(null);

  if (loading && !data) {
    return (
      <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }
  if (error) return <GraphQLError error={error} />;
  const datasets = data?.instance.editor?.datasets ?? [];

  return (
    <Container maxWidth="lg" sx={{ pt: 8, pb: 3, mx: 0 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Database size={22} />
          <Typography variant="h5">Datasets</Typography>
        </Stack>
        <Button
          variant="contained"
          startIcon={<Plus />}
          onClick={() => setNotice('Creating datasets is not yet implemented.')}
        >
          New dataset
        </Button>
      </Stack>
      {data?.instance.editor === null && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Model editor data is not available for this instance.
        </Alert>
      )}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Identifier</TableCell>
              <TableCell>Source</TableCell>
              <TableCell align="right">Dimensions</TableCell>
              <TableCell align="right">Metrics</TableCell>
              <TableCell align="right">Data points</TableCell>
              <TableCell align="right" sx={{ width: 120 }}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {datasets.length === 0 && (
              <TableRow>
                <TableCell colSpan={7}>
                  <Typography color="text.secondary" sx={{ py: 2 }}>
                    No datasets defined.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
            {datasets.map((ds) => (
              <TableRow
                key={ds.id}
                hover
                sx={{ cursor: 'pointer' }}
                onClick={() => router.push(`${base}/${encodeURIComponent(ds.id)}`)}
              >
                <TableCell>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <span>{ds.name}</span>
                    {ds.isExternalPlaceholder && (
                      <Chip label="Placeholder" size="small" color="warning" variant="outlined" />
                    )}
                  </Stack>
                </TableCell>
                <TableCell>
                  <code>{ds.identifier ?? '—'}</code>
                </TableCell>
                <TableCell>
                  {ds.externalRef ? (
                    <Tooltip title={ds.externalRef.repoUrl}>
                      <Chip
                        icon={<Link45deg size={14} />}
                        label={ds.externalRef.datasetId}
                        size="small"
                        variant="outlined"
                      />
                    </Tooltip>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Internal
                    </Typography>
                  )}
                </TableCell>
                <TableCell align="right">{ds.dimensions.length}</TableCell>
                <TableCell align="right">{ds.metrics.length}</TableCell>
                <TableCell align="right">{ds.dataPoints.length}</TableCell>
                <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                  <Tooltip title="Edit">
                    <IconButton
                      size="small"
                      onClick={() => router.push(`${base}/${encodeURIComponent(ds.id)}`)}
                    >
                      <PencilSquare />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton
                      size="small"
                      onClick={() => setNotice(`Deleting "${ds.name}" is not yet implemented.`)}
                    >
                      <Trash />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
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
