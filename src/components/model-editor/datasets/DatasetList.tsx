import { type MouseEvent, useState } from 'react';
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

export default function DatasetList() {
  const { data, loading, error } = useQuery<InstanceDatasetsQuery>(GET_INSTANCE_DATASETS, {
    fetchPolicy: 'cache-and-network',
  });
  const router = useRouter();
  const pathname = usePathname();
  const base = getDatasetsBase(pathname);
  const [notice, setNotice] = useState<string | null>(null);
  const [openMenuRowId, setOpenMenuRowId] = useState<string | null>(null);

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
              <TableCell>Name</TableCell>
              <TableCell align="right">Dimensions</TableCell>
              <TableCell align="right">Metrics</TableCell>
              <TableCell align="right">Comments</TableCell>
              <TableCell>Source</TableCell>
              <TableCell align="right" sx={{ width: 120 }}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {datasets.length === 0 && (
              <TableRow>
                <TableCell colSpan={6}>
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
