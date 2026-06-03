import { Button, Stack, Typography } from '@mui/material';

import { Plus, Trash } from 'react-bootstrap-icons';

type Props = {
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
  return (
    <Stack direction="row" alignItems="center" justifyContent="flex-end" spacing={1} sx={{ mb: 1 }}>
      {hasPending && (
        <Typography variant="body2" color="warning.main" sx={{ mr: 'auto' }}>
          {pendingCount} unsaved change{pendingCount === 1 ? '' : 's'}
        </Typography>
      )}
      {selectedRowCount > 0 && (
        <Button
          size="small"
          color="error"
          variant="outlined"
          startIcon={<Trash />}
          onClick={onDeleteSelectedRows}
          disabled={isMutating}
          sx={!hasPending ? { mr: 'auto' } : undefined}
        >
          Delete {selectedRowCount} row{selectedRowCount === 1 ? '' : 's'}
        </Button>
      )}
      {selectedYearCount > 0 && (
        <Button
          size="small"
          color="error"
          variant="outlined"
          startIcon={<Trash />}
          onClick={onDeleteSelectedYears}
          disabled={isMutating}
          sx={!hasPending && selectedRowCount === 0 ? { mr: 'auto' } : undefined}
        >
          Delete {selectedYearCount} year{selectedYearCount === 1 ? '' : 's'}
        </Button>
      )}
      {hasPending && (
        <>
          <Button size="small" onClick={onDiscard} disabled={isMutating} color="inherit">
            Discard
          </Button>
          <Button size="small" variant="contained" onClick={onSave} disabled={isMutating}>
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
        </>
      )}
      <Button size="small" startIcon={<Plus />} onClick={onAddYears} disabled={isMutating}>
        Add years
      </Button>
      <Button
        size="small"
        startIcon={<Plus />}
        onClick={onAddRows}
        disabled={isMutating || disableAddRows}
      >
        Add rows
      </Button>
    </Stack>
  );
}
