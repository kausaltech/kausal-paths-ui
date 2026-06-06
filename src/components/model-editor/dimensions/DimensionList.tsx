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
import { useTranslations } from 'next-intl';
import { Pencil, Plus, Trash } from 'react-bootstrap-icons';

import type { InstanceDimensionsQuery } from '@/common/__generated__/graphql';
import GraphQLError from '@/components/common/GraphQLError';
import { GET_INSTANCE_DIMENSIONS } from './queries';

function getDimensionsBase(pathname: string): string {
  const idx = pathname.indexOf('/model');
  return idx >= 0 ? pathname.slice(0, idx) + '/model/dimensions' : '/model/dimensions';
}

export default function DimensionList() {
  const t = useTranslations('model-editor');
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
        <Typography variant="h5">{t('dimensions-title')}</Typography>
        <Button
          variant="contained"
          startIcon={<Plus />}
          onClick={() => setNotice(t('dimensions-creating-not-implemented'))}
        >
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
              <TableCell>{t('dimensions-name')}</TableCell>
              <TableCell>{t('dimensions-identifier')}</TableCell>
              <TableCell align="right">{t('dimensions-categories')}</TableCell>
              <TableCell align="right" sx={{ width: 120 }}>
                {t('dimensions-actions')}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {dimensions.length === 0 && (
              <TableRow>
                <TableCell colSpan={4}>
                  <Typography color="text.secondary" sx={{ py: 2 }}>
                    {t('dimensions-none-defined')}
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
                      onClick={() =>
                        setNotice(t('dimensions-deleting-not-implemented', { name: dim.name }))
                      }
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
