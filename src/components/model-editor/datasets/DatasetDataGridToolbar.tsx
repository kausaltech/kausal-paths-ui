import { Button, Stack, Typography } from '@mui/material';

import { useTranslations } from 'next-intl';
import { Plus, Trash } from 'react-bootstrap-icons';

type Props = {
  readOnly: boolean;
  hasPending: boolean;
  pendingCount: number;
  selectedRowCount: number;
  selectedYearCount: number;
  isMutating: boolean;
  saving: boolean;
  disableAddRows: boolean;
  onDeleteSelectedRows: () => void;
  onDeleteSelectedYears: () => void;
  onDiscard: () => void;
  onSave: () => void;
  onAddYears: () => void;
  onAddRows: () => void;
};

export function DatasetDataGridToolbar({
  readOnly,
  hasPending,
  pendingCount,
  selectedRowCount,
  selectedYearCount,
  isMutating,
  saving,
  disableAddRows,
  onDeleteSelectedRows,
  onDeleteSelectedYears,
  onDiscard,
  onSave,
  onAddYears,
  onAddRows,
}: Props) {
  const t = useTranslations('model-editor');
  return (
    <Stack
      direction="row"
      spacing={1}
      sx={{
        alignItems: 'center',
        justifyContent: 'flex-end',
        mb: 1,
      }}
    >
      {!readOnly && hasPending && (
        <Typography
          variant="body2"
          sx={{
            color: 'warning.main',
            mr: 'auto',
          }}
        >
          {t('datasets-unsaved-changes', { count: pendingCount })}
        </Typography>
      )}
      {!readOnly && selectedRowCount > 0 && (
        <Button
          size="small"
          color="error"
          variant="outlined"
          startIcon={<Trash />}
          onClick={onDeleteSelectedRows}
          disabled={isMutating}
          sx={!hasPending ? { mr: 'auto' } : undefined}
        >
          {t('datasets-delete-rows', { count: selectedRowCount })}
        </Button>
      )}
      {!readOnly && selectedYearCount > 0 && (
        <Button
          size="small"
          color="error"
          variant="outlined"
          startIcon={<Trash />}
          onClick={onDeleteSelectedYears}
          disabled={isMutating}
          sx={!hasPending && selectedRowCount === 0 ? { mr: 'auto' } : undefined}
        >
          {t('datasets-delete-years', { count: selectedYearCount })}
        </Button>
      )}
      {!readOnly && hasPending && (
        <>
          <Button size="small" onClick={onDiscard} disabled={isMutating} color="inherit">
            {t('common-discard')}
          </Button>
          <Button size="small" variant="contained" onClick={onSave} disabled={isMutating}>
            {saving ? t('common-saving') : t('common-save-changes')}
          </Button>
        </>
      )}
      {!readOnly && (
        <Button size="small" startIcon={<Plus />} onClick={onAddYears} disabled={isMutating}>
          {t('datasets-add-years')}
        </Button>
      )}
      {!readOnly && (
        <Button
          size="small"
          startIcon={<Plus />}
          onClick={onAddRows}
          disabled={isMutating || disableAddRows}
        >
          {t('datasets-add-rows')}
        </Button>
      )}
    </Stack>
  );
}
