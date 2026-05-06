import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';

import {
  Alert,
  Box,
  Button,
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
import { Pencil, Plus, Trash } from 'react-bootstrap-icons';

import type { InstanceDimensionsQuery } from '@/common/__generated__/graphql';
import GraphQLError from '@/components/common/GraphQLError';
import { GET_INSTANCE_DIMENSIONS } from './queries';

function getDimensionsBase(pathname: string): string {
  const idx = pathname.indexOf('/model');
  return idx >= 0 ? pathname.slice(0, idx) + '/model/dimensions' : '/model/dimensions';
}

export default function DimensionList() {
  const { data, loading, error } = useQuery<InstanceDimensionsQuery>(GET_INSTANCE_DIMENSIONS, {
    fetchPolicy: 'cache-and-network',
  });
  const router = useRouter();
  const pathname = usePathname();
  const base = getDimensionsBase(pathname);
  const [notice, setNotice] = useState<string | null>(null);

  if (loading && !data) {
    return (
      <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }
  if (error) return <GraphQLError error={error} />;
  const dimensions = data?.instance.editor?.dimensions ?? [];

  return (
    <Container maxWidth="lg" sx={{ pt: 20, pb: 3, mx: 0 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h5">Dimensions</Typography>
        <Button
          variant="contained"
          startIcon={<Plus />}
          onClick={() => setNotice('Creating dimensions is not yet implemented.')}
        >
          New dimension
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
              <TableCell align="right">Categories</TableCell>
              <TableCell align="right" sx={{ width: 120 }}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {dimensions.length === 0 && (
              <TableRow>
                <TableCell colSpan={4}>
                  <Typography color="text.secondary" sx={{ py: 2 }}>
                    No dimensions defined.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
            {dimensions.map((dim) => (
              <TableRow
                key={dim.id}
                hover
                sx={{ cursor: 'pointer' }}
                onClick={() => router.push(`${base}/${encodeURIComponent(dim.id)}`)}
              >
                <TableCell>{dim.name}</TableCell>
                <TableCell>
                  <code>{dim.identifier}</code>
                </TableCell>
                <TableCell align="right">{dim.categories.length}</TableCell>
                <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                  <Tooltip title="Edit">
                    <IconButton
                      size="small"
                      onClick={() => router.push(`${base}/${encodeURIComponent(dim.id)}`)}
                    >
                      <Pencil size={18} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton
                      size="small"
                      onClick={() => setNotice(`Deleting "${dim.name}" is not yet implemented.`)}
                    >
                      <Trash size={18} />
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
