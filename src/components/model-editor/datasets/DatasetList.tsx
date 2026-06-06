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
import { useTranslations } from 'next-intl';
import {
  ChatLeft,
  Database,
  Files,
  PencilSquare,
  Plus,
  ThreeDotsVertical,
  Trash,
} from 'react-bootstrap-icons';

import type { InstanceDatasetsQuery } from '@/common/__generated__/graphql';
import GraphQLError from '@/components/common/GraphQLError';
import { GET_INSTANCE_DATASETS } from './queries';
import { getUserName } from './shared';

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
  const t = useTranslations('model-editor');
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
      <Tooltip title={t('datasets-actions')}>
        <IconButton size="small" onClick={open} aria-label={t('datasets-actions-menu')}>
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
          <ListItemText>{t('datasets-edit')}</ListItemText>
        </MenuItem>
        <MenuItem onClick={wrap(onDuplicate)}>
          <ListItemIcon>
            <Files size={14} />
          </ListItemIcon>
          <ListItemText>{t('datasets-duplicate')}</ListItemText>
        </MenuItem>
        <MenuItem onClick={wrap(onDelete)}>
          <ListItemIcon>
            <Trash size={14} />
          </ListItemIcon>
          <ListItemText>{t('datasets-delete')}</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}

type SortKey = 'name' | 'dimensions' | 'metrics' | 'comments' | 'lastModified';
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
    case 'lastModified':
      return ds.lastModifiedAt ? new Date(ds.lastModifiedAt).getTime() : 0;
  }
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function formatRelativeTime(iso: string, t: ReturnType<typeof useTranslations>): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const diffSec = Math.max(0, Math.round((Date.now() - d.getTime()) / 1000));
  if (diffSec < 45) return t('editor-relative-just-now');
  if (diffSec < 60 * 60)
    return t('editor-relative-minutes-ago', { count: Math.round(diffSec / 60) });
  if (diffSec < 24 * 60 * 60)
    return t('editor-relative-hours-ago', { count: Math.round(diffSec / 3600) });
  return formatTimestamp(iso);
}

export default function DatasetList() {
  const t = useTranslations('model-editor');
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
          <Typography variant="h5">{t('datasets-title')}</Typography>
        </Stack>
        <Button
          variant="contained"
          startIcon={<Plus />}
          onClick={() => setNotice(t('datasets-creating-not-implemented'))}
        >
          {t('datasets-new-dataset')}
        </Button>
      </Stack>
      {data?.instance.editor === null && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {t('datasets-editor-data-unavailable')}
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
                  {t('datasets-name')}
                </TableSortLabel>
              </TableCell>
              <TableCell align="right" sortDirection={sortKey === 'dimensions' ? sortOrder : false}>
                <TableSortLabel
                  active={sortKey === 'dimensions'}
                  direction={sortKey === 'dimensions' ? sortOrder : 'asc'}
                  onClick={() => handleSort('dimensions')}
                >
                  {t('datasets-dimensions')}
                </TableSortLabel>
              </TableCell>
              <TableCell align="right" sortDirection={sortKey === 'metrics' ? sortOrder : false}>
                <TableSortLabel
                  active={sortKey === 'metrics'}
                  direction={sortKey === 'metrics' ? sortOrder : 'asc'}
                  onClick={() => handleSort('metrics')}
                >
                  {t('datasets-metrics')}
                </TableSortLabel>
              </TableCell>
              <TableCell align="right" sortDirection={sortKey === 'comments' ? sortOrder : false}>
                <TableSortLabel
                  active={sortKey === 'comments'}
                  direction={sortKey === 'comments' ? sortOrder : 'asc'}
                  onClick={() => handleSort('comments')}
                >
                  {t('datasets-comments')}
                </TableSortLabel>
              </TableCell>
              <TableCell
                align="right"
                sortDirection={sortKey === 'lastModified' ? sortOrder : false}
              >
                <TableSortLabel
                  active={sortKey === 'lastModified'}
                  direction={sortKey === 'lastModified' ? sortOrder : 'asc'}
                  onClick={() => handleSort('lastModified')}
                >
                  {t('datasets-last-edited')}
                </TableSortLabel>
              </TableCell>
              <TableCell align="right" sx={{ width: 120 }}>
                {t('datasets-actions')}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedDatasets.length === 0 && (
              <TableRow>
                <TableCell colSpan={6}>
                  <Typography color="text.secondary" sx={{ py: 2 }}>
                    {t('datasets-none-defined')}
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
                      <Chip
                        label={t('datasets-placeholder')}
                        size="small"
                        color="warning"
                        variant="outlined"
                      />
                    )}
                  </Stack>
                </TableCell>
                <TableCell align="right">
                  {ds.dimensions.length > 0 ? (
                    <Tooltip title={ds.dimensions.map((d) => d.name).join(', ')}>
                      <Chip label={ds.dimensions.length} size="small" />
                    </Tooltip>
                  ) : (
                    <Typography variant="body2" color="text.disabled">
                      —
                    </Typography>
                  )}
                </TableCell>
                <TableCell align="right">
                  {ds.metrics.length > 0 ? (
                    <Tooltip title={ds.metrics.map((m) => m.unit || m.label).join(', ')}>
                      <Chip label={ds.metrics.length} size="small" />
                    </Tooltip>
                  ) : (
                    <Typography variant="body2" color="text.disabled">
                      —
                    </Typography>
                  )}
                </TableCell>
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
                <TableCell align="right">
                  {ds.lastModifiedAt ? (
                    <Tooltip
                      title={
                        ds.lastModifiedBy
                          ? `${formatTimestamp(ds.lastModifiedAt)} · ${getUserName(ds.lastModifiedBy, t)}`
                          : formatTimestamp(ds.lastModifiedAt)
                      }
                    >
                      <Typography variant="body2" color="text.secondary" component="span">
                        {formatRelativeTime(ds.lastModifiedAt, t)}
                      </Typography>
                    </Tooltip>
                  ) : (
                    <Typography variant="body2" color="text.disabled">
                      —
                    </Typography>
                  )}
                </TableCell>
                <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                  <DatasetRowActions
                    onEdit={() => router.push(`${base}/${encodeURIComponent(ds.id)}`)}
                    onDuplicate={() =>
                      setNotice(t('datasets-duplicating-not-implemented', { name: ds.name }))
                    }
                    onDelete={() =>
                      setNotice(t('datasets-deleting-not-implemented', { name: ds.name }))
                    }
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
