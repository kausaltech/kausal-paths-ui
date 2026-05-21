import { type MouseEvent, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Snackbar,
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

import { useQuery } from '@apollo/client/react';
import {
  ChatLeft,
  Database,
  Files,
  Link45deg,
  PencilSquare,
  Plus,
  ThreeDotsVertical,
  Trash,
} from 'react-bootstrap-icons';

import type { InstanceDatasetsQuery } from '@/common/__generated__/graphql';
import GraphQLError from '@/components/common/GraphQLError';
import { GET_INSTANCE_DATASETS } from './queries';

function getDatasetsBase(pathname: string): string {
  const idx = pathname.indexOf('/model');
  return idx >= 0 ? pathname.slice(0, idx) + '/model/datasets' : '/model/datasets';
}

type DatasetRowActionsProps = {
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onOpenChange?: (open: boolean) => void;
};

function DatasetRowActions({
  onEdit,
  onDuplicate,
  onDelete,
  onOpenChange,
}: DatasetRowActionsProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = (e: MouseEvent<HTMLElement>) => {
    setAnchorEl(e.currentTarget);
    onOpenChange?.(true);
  };
  const close = () => {
    setAnchorEl(null);
    onOpenChange?.(false);
  };
  const wrap = (handler: () => void) => () => {
    close();
    handler();
  };
  return (
    <>
      <Tooltip title="Actions">
        <IconButton size="small" onClick={open} aria-label="Dataset actions">
          <ThreeDotsVertical />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={anchorEl !== null}
        onClose={close}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ list: { dense: true } }}
      >
        <MenuItem onClick={wrap(onEdit)}>
          <ListItemIcon>
            <PencilSquare size={14} />
          </ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <MenuItem onClick={wrap(onDuplicate)}>
          <ListItemIcon>
            <Files size={14} />
          </ListItemIcon>
          <ListItemText>Duplicate</ListItemText>
        </MenuItem>
        <MenuItem onClick={wrap(onDelete)}>
          <ListItemIcon>
            <Trash size={14} />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}

type SortKey = 'name' | 'dimensions' | 'metrics' | 'comments' | 'source';
type SortOrder = 'asc' | 'desc';

type DatasetRow = NonNullable<
  NonNullable<InstanceDatasetsQuery['instance']['editor']>['datasets']
>[number];

function getSortValue(ds: DatasetRow, key: SortKey): string | number {
  switch (key) {
    case 'name':
      return ds.name?.toLowerCase() ?? '';
    case 'dimensions':
      return ds.dimensions.length;
    case 'metrics':
      return ds.metrics.length;
    case 'comments':
      return ds.dataPointComments.length;
    case 'source':
      return ds.externalRef?.datasetId?.toLowerCase() ?? '';
  }
}

export default function DatasetList() {
  const { data, loading, error } = useQuery<InstanceDatasetsQuery>(GET_INSTANCE_DATASETS, {
    fetchPolicy: 'cache-and-network',
  });
  const router = useRouter();
  const pathname = usePathname();
  const base = getDatasetsBase(pathname);
  const [notice, setNotice] = useState<string | null>(null);
  const [openMenuRowId, setOpenMenuRowId] = useState<string | null>(null);
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

  const datasets = useMemo(
    () => data?.instance.editor?.datasets ?? [],
    [data?.instance.editor?.datasets]
  );
  const sortedDatasets = useMemo(() => {
    const arr = [...datasets];
    arr.sort((a, b) => {
      const av = getSortValue(a, sortKey);
      const bv = getSortValue(b, sortKey);
      if (av < bv) return sortOrder === 'asc' ? -1 : 1;
      if (av > bv) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    return arr;
  }, [datasets, sortKey, sortOrder]);

  if (loading && !data) {
    return (
      <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }
  if (error) return <GraphQLError error={error} />;

  return (
    <Container maxWidth="lg" sx={{ pt: 20, pb: 3, mx: 0 }}>
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
              <TableCell sortDirection={sortKey === 'name' ? sortOrder : false}>
                <TableSortLabel
                  active={sortKey === 'name'}
                  direction={sortKey === 'name' ? sortOrder : 'asc'}
                  onClick={() => handleSort('name')}
                >
                  Name
                </TableSortLabel>
              </TableCell>
              <TableCell align="right" sortDirection={sortKey === 'dimensions' ? sortOrder : false}>
                <TableSortLabel
                  active={sortKey === 'dimensions'}
                  direction={sortKey === 'dimensions' ? sortOrder : 'asc'}
                  onClick={() => handleSort('dimensions')}
                >
                  Dimensions
                </TableSortLabel>
              </TableCell>
              <TableCell align="right" sortDirection={sortKey === 'metrics' ? sortOrder : false}>
                <TableSortLabel
                  active={sortKey === 'metrics'}
                  direction={sortKey === 'metrics' ? sortOrder : 'asc'}
                  onClick={() => handleSort('metrics')}
                >
                  Metrics
                </TableSortLabel>
              </TableCell>
              <TableCell align="right" sortDirection={sortKey === 'comments' ? sortOrder : false}>
                <TableSortLabel
                  active={sortKey === 'comments'}
                  direction={sortKey === 'comments' ? sortOrder : 'asc'}
                  onClick={() => handleSort('comments')}
                >
                  Comments
                </TableSortLabel>
              </TableCell>
              <TableCell sortDirection={sortKey === 'source' ? sortOrder : false}>
                <TableSortLabel
                  active={sortKey === 'source'}
                  direction={sortKey === 'source' ? sortOrder : 'asc'}
                  onClick={() => handleSort('source')}
                >
                  Source
                </TableSortLabel>
              </TableCell>
              <TableCell align="right" sx={{ width: 120 }}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedDatasets.length === 0 && (
              <TableRow>
                <TableCell colSpan={6}>
                  <Typography color="text.secondary" sx={{ py: 2 }}>
                    No datasets defined.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
            {sortedDatasets.map((ds) => (
              <TableRow
                key={ds.id}
                hover
                selected={openMenuRowId === ds.id}
                sx={{ cursor: 'pointer' }}
                onClick={() => router.push(`${base}/${encodeURIComponent(ds.id)}`)}
              >
                <TableCell>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Box>
                      <Box component="span">{ds.name}</Box>
                      {ds.identifier && (
                        <Typography
                          variant="caption"
                          component="div"
                          color="text.disabled"
                          sx={{ fontFamily: 'monospace', lineHeight: 1.2 }}
                        >
                          {ds.identifier}
                        </Typography>
                      )}
                    </Box>
                    {ds.isExternalPlaceholder && (
                      <Chip label="Placeholder" size="small" color="warning" variant="outlined" />
                    )}
                  </Stack>
                </TableCell>
                <TableCell align="right">{ds.dimensions.length}</TableCell>
                <TableCell align="right">{ds.metrics.length}</TableCell>
                <TableCell align="right">
                  {ds.dataPointComments.length > 0 ? (
                    <Stack
                      direction="row"
                      spacing={0.5}
                      alignItems="center"
                      justifyContent="flex-end"
                    >
                      <ChatLeft size={12} />
                      <span>{ds.dataPointComments.length}</span>
                    </Stack>
                  ) : (
                    <Typography variant="body2" color="text.disabled">
                      —
                    </Typography>
                  )}
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
                <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                  <DatasetRowActions
                    onEdit={() => router.push(`${base}/${encodeURIComponent(ds.id)}`)}
                    onDuplicate={() =>
                      setNotice(`Duplicating "${ds.name}" is not yet implemented.`)
                    }
                    onDelete={() => setNotice(`Deleting "${ds.name}" is not yet implemented.`)}
                    onOpenChange={(open) => setOpenMenuRowId(open ? ds.id : null)}
                  />
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
