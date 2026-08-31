import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Tooltip,
  Typography,
} from '@mui/material';

import { CombinedGraphQLErrors } from '@apollo/client/errors';
import { useMutation, useQuery } from '@apollo/client/react';
import { useTranslations } from 'next-intl';
import { Box as BoxIcon, Pencil, Plus, Trash } from 'react-bootstrap-icons';

import { useInstance } from '@/common/instance';
import GraphQLError from '@/components/common/GraphQLError';
import { GET_INSTANCE_DATASETS } from '../datasets/queries';
import { CreateDimensionDialog } from './CreateDimensionDialog';
import { DELETE_DIMENSION, GET_INSTANCE_DIMENSIONS } from './queries';

function getDimensionsBase(pathname: string): string {
  const idx = pathname.indexOf('/model');
  return idx >= 0 ? pathname.slice(0, idx) + '/model/dimensions' : '/model/dimensions';
}

type SortKey = 'name' | 'categories' | 'datasets';
type SortOrder = 'asc' | 'desc';

export default function DimensionList() {
  const t = useTranslations('model-editor');
  const { data, loading, error } = useQuery(GET_INSTANCE_DIMENSIONS, {
    fetchPolicy: 'cache-and-network',
  });
  // Datasets are fetched only to show per-dimension usage counts; a failure
  // here should not break the page, so its error is ignored (counts show "—").
  const { data: datasetsData } = useQuery(GET_INSTANCE_DATASETS, {
    fetchPolicy: 'cache-and-network',
  });
  const router = useRouter();
  const pathname = usePathname();
  const base = getDimensionsBase(pathname);
  const [createOpen, setCreateOpen] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  const instance = useInstance();
  const [deleteDimension, { loading: deleting }] = useMutation(DELETE_DIMENSION);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleteError, setDeleteError] = useState('');

  const handleConfirmDelete = async () => {
    if (!deleteTarget || deleting) return;
    setDeleteError('');
    try {
      const result = await deleteDimension({
        variables: { instanceId: instance.id, dimensionId: deleteTarget.id },
        refetchQueries: [GET_INSTANCE_DIMENSIONS],
      });
      const payload = result.data?.instanceEditor.deleteDimension;
      if (payload?.__typename === 'ModelDeletePayload' && payload.ok) {
        setDeleteTarget(null);
      } else if (payload?.__typename === 'OperationInfo') {
        setDeleteError(payload.messages.map((m) => m.message).join(' '));
      } else {
        setDeleteError(t('common-failed'));
      }
    } catch (err) {
      // The backend refuses deletion while a dataset schema or a node still
      // references the dimension (extensions.code 'dimension_in_use').
      const inUse =
        CombinedGraphQLErrors.is(err) &&
        err.errors.some((e) => e.extensions?.code === 'dimension_in_use');
      if (inUse) {
        setDeleteError(t('dimensions-delete-in-use'));
      } else {
        setDeleteError(err instanceof Error ? err.message : t('common-failed'));
      }
    }
  };

  if (loading && !data) {
    return (
      <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }
  if (error) return <GraphQLError error={error} />;
  const dimensions = data?.instance.editor?.dimensions ?? [];

  // Names of the datasets using each dimension, keyed by dimension UUID
  // (Dataset.dimensions[].id and InstanceDimension.id share the id space).
  const datasetNamesByDimension = new Map<string, string[]>();
  for (const ds of datasetsData?.instance.editor?.datasets ?? []) {
    for (const dsDim of ds.dimensions) {
      const names = datasetNamesByDimension.get(dsDim.id) ?? [];
      names.push(ds.name ?? ds.id);
      datasetNamesByDimension.set(dsDim.id, names);
    }
  }

  const getSortValue = (dim: (typeof dimensions)[number]): string | number => {
    switch (sortKey) {
      case 'name':
        return dim.name.toLowerCase();
      case 'categories':
        return dim.categories.length;
      case 'datasets':
        return datasetNamesByDimension.get(dim.id)?.length ?? 0;
    }
  };
  const sortedDimensions = [...dimensions].sort((a, b) => {
    const av = getSortValue(a);
    const bv = getSortValue(b);
    if (av < bv) return sortOrder === 'asc' ? -1 : 1;
    if (av > bv) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  return (
    <Container maxWidth="lg" sx={{ pt: 20, pb: 3, mx: 0 }}>
      <Stack
        direction="row"
        sx={{
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2,
        }}
      >
        <Stack
          direction="row"
          spacing={1}
          sx={{
            alignItems: 'center',
          }}
        >
          <BoxIcon size={22} />
          <Typography variant="h5">{t('dimensions-title')}</Typography>
        </Stack>
        <Button variant="contained" startIcon={<Plus />} onClick={() => setCreateOpen(true)}>
          {t('dimensions-new-dimension')}
        </Button>
      </Stack>
      {data?.instance.editor === null && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {t('dimensions-editor-data-unavailable')}
        </Alert>
      )}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sortDirection={sortKey === 'name' ? sortOrder : false}>
                <TableSortLabel
                  active={sortKey === 'name'}
                  direction={sortKey === 'name' ? sortOrder : 'asc'}
                  onClick={() => handleSort('name')}
                >
                  {t('dimensions-name')}
                </TableSortLabel>
              </TableCell>
              <TableCell align="right" sortDirection={sortKey === 'categories' ? sortOrder : false}>
                <TableSortLabel
                  active={sortKey === 'categories'}
                  direction={sortKey === 'categories' ? sortOrder : 'asc'}
                  onClick={() => handleSort('categories')}
                >
                  {t('dimensions-categories')}
                </TableSortLabel>
              </TableCell>
              <TableCell align="right" sortDirection={sortKey === 'datasets' ? sortOrder : false}>
                <TableSortLabel
                  active={sortKey === 'datasets'}
                  direction={sortKey === 'datasets' ? sortOrder : 'asc'}
                  onClick={() => handleSort('datasets')}
                >
                  {t('dimensions-datasets')}
                </TableSortLabel>
              </TableCell>
              <TableCell align="right" sx={{ width: 120 }}>
                {t('dimensions-actions')}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {dimensions.length === 0 && (
              <TableRow>
                <TableCell colSpan={4}>
                  <Typography
                    sx={{
                      color: 'text.secondary',
                      py: 2,
                    }}
                  >
                    {t('dimensions-none-defined')}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
            {sortedDimensions.map((dim) => {
              const usingDatasets = datasetNamesByDimension.get(dim.id) ?? [];
              return (
                <TableRow
                  key={dim.id}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() => router.push(`${base}/${encodeURIComponent(dim.id)}`)}
                >
                  <TableCell>
                    <Box>
                      <Box component="span">{dim.name}</Box>
                      <Typography
                        variant="caption"
                        component="div"
                        sx={{
                          color: 'text.disabled',
                          fontFamily: 'monospace',
                          lineHeight: 1.2,
                        }}
                      >
                        {dim.identifier}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    {dim.categories.length > 0 ? (
                      <Tooltip title={dim.categories.map((c) => c.label).join(', ')}>
                        <Chip label={dim.categories.length} size="small" />
                      </Tooltip>
                    ) : (
                      <Typography
                        variant="body2"
                        sx={{
                          color: 'text.disabled',
                        }}
                      >
                        —
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    {usingDatasets.length > 0 ? (
                      <Tooltip title={usingDatasets.join(', ')}>
                        <Chip label={usingDatasets.length} size="small" />
                      </Tooltip>
                    ) : (
                      <Typography
                        variant="body2"
                        sx={{
                          color: 'text.disabled',
                        }}
                      >
                        —
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                    <Tooltip title={t('dimensions-edit')}>
                      <IconButton
                        size="small"
                        onClick={() => router.push(`${base}/${encodeURIComponent(dim.id)}`)}
                      >
                        <Pencil size={18} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={t('dimensions-delete')}>
                      <IconButton
                        size="small"
                        onClick={() => {
                          setDeleteError('');
                          setDeleteTarget({ id: dim.id, name: dim.name });
                        }}
                      >
                        <Trash size={18} />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      <CreateDimensionDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(dimensionId) => router.push(`${base}/${encodeURIComponent(dimensionId)}`)}
      />
      <Dialog
        open={deleteTarget !== null}
        onClose={deleting ? undefined : () => setDeleteTarget(null)}
      >
        <DialogTitle>{t('dimensions-delete-dimension')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('dimensions-delete-confirm', { name: deleteTarget?.name ?? '' })}
          </DialogContentText>
          {deleteError && (
            <Typography color="error" sx={{ mt: 1, fontSize: '0.9rem' }}>
              {deleteError}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)} disabled={deleting}>
            {t('common-cancel')}
          </Button>
          <Button
            onClick={() => void handleConfirmDelete()}
            color="error"
            variant="contained"
            disabled={deleting}
          >
            {deleting ? t('common-deleting') : t('common-delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
