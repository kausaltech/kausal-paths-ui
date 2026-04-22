import { useCallback, useMemo, useState } from 'react';

import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  TextField,
  Tooltip,
} from '@mui/material';

import { useMutation } from '@apollo/client/react';
import type { CellValueChangedEvent, ColDef, ICellRendererParams } from 'ag-grid-community';
import { Plus, Trash } from 'react-bootstrap-icons';

import type {
  CreateDataPointMutation,
  CreateDataPointMutationVariables,
  DatasetDetailFieldsFragment,
  DeleteDataPointMutation,
  DeleteDataPointMutationVariables,
  UpdateDataPointMutation,
  UpdateDataPointMutationVariables,
} from '@/common/__generated__/graphql';
import { useInstance } from '@/common/instance';
import AgGridReact from '../GridEditor';
import { CREATE_DATA_POINT, DELETE_DATA_POINT, UPDATE_DATA_POINT } from './queries';

type Props = {
  dataset: DatasetDetailFieldsFragment;
  onMutated: () => void;
};

type Row = {
  id: string;
  date: string;
  value: number | null;
  metricId: string;
  /** Map of dimension.id → category.uuid */
  categoryByDim: Record<string, string>;
};

function buildRow(
  dp: DatasetDetailFieldsFragment['dataPoints'][number],
  dimensions: DatasetDetailFieldsFragment['dimensions']
): Row {
  const dpCatUuids = new Set(dp.dimensionCategories.map((c) => c.uuid));
  const categoryByDim: Record<string, string> = {};
  for (const dim of dimensions) {
    const found = dim.categories.find((c) => dpCatUuids.has(c.uuid));
    if (found) categoryByDim[dim.id] = found.uuid;
  }
  return {
    id: dp.id,
    date: typeof dp.date === 'string' ? dp.date : String(dp.date),
    value: dp.value,
    metricId: dp.metric.id,
    categoryByDim,
  };
}

export default function DatasetDataGrid({ dataset, onMutated }: Props) {
  const instance = useInstance();
  const [addOpen, setAddOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [createDataPoint] = useMutation<CreateDataPointMutation, CreateDataPointMutationVariables>(
    CREATE_DATA_POINT
  );
  const [updateDataPoint] = useMutation<UpdateDataPointMutation, UpdateDataPointMutationVariables>(
    UPDATE_DATA_POINT
  );

  // Generated input types require all fields (avoidOptionals). The backend rejects
  // explicit null on Maybe fields, so we build partial inputs and cast.
  type UpdateInput = UpdateDataPointMutationVariables['input'];
  const asUpdateInput = (partial: Partial<Record<keyof UpdateInput, unknown>>) =>
    partial as unknown as UpdateInput;
  const [deleteDataPoint] = useMutation<DeleteDataPointMutation, DeleteDataPointMutationVariables>(
    DELETE_DATA_POINT
  );

  const rows = useMemo<Row[]>(
    () => dataset.dataPoints.map((dp) => buildRow(dp, dataset.dimensions)),
    [dataset]
  );

  const metricById = useMemo(
    () => new Map(dataset.metrics.map((m) => [m.id, m])),
    [dataset.metrics]
  );

  const handleDelete = useCallback(
    async (dataPointId: string) => {
      const result = await deleteDataPoint({
        variables: { instanceId: instance.id, datasetId: dataset.id, dataPointId },
      });
      const msgs = result.data?.instanceEditor.datasetEditor.deleteDataPoint?.messages ?? [];
      if (msgs.length > 0) {
        setError(msgs.map((m) => m.message).join('; '));
      } else {
        onMutated();
      }
    },
    [deleteDataPoint, instance.id, dataset.id, onMutated]
  );

  const columnDefs = useMemo<ColDef<Row>[]>(() => {
    const cols: ColDef<Row>[] = [
      {
        field: 'date',
        headerName: 'Date',
        width: 130,
        editable: true,
        sortable: true,
      },
      {
        field: 'metricId',
        headerName: 'Metric',
        width: 180,
        editable: true,
        cellEditor: 'agSelectCellEditor',
        cellEditorParams: { values: dataset.metrics.map((m) => m.id) },
        valueFormatter: (p: { value: string }) => metricById.get(p.value)?.label ?? p.value,
      },
    ];
    for (const dim of dataset.dimensions) {
      const catLabel = new Map(dim.categories.map((c) => [c.uuid, c.label]));
      cols.push({
        colId: `dim-${dim.id}`,
        headerName: dim.name,
        width: 160,
        editable: true,
        cellEditor: 'agSelectCellEditor',
        cellEditorParams: { values: dim.categories.map((c) => c.uuid) },
        valueGetter: (p) => p.data?.categoryByDim[dim.id] ?? '',
        valueSetter: (p) => {
          if (!p.data) return false;
          p.data.categoryByDim = { ...p.data.categoryByDim, [dim.id]: p.newValue as string };
          return true;
        },
        valueFormatter: (p: { value: string }) => catLabel.get(p.value) ?? p.value,
      });
    }
    cols.push({
      field: 'value',
      headerName: 'Value',
      width: 130,
      editable: true,
      type: 'numericColumn',
      valueParser: (p: { newValue: string }) => {
        const n = Number(p.newValue);
        return Number.isFinite(n) ? n : null;
      },
      valueFormatter: (p: { value: number | null }) =>
        p.value != null ? p.value.toLocaleString(undefined, { maximumFractionDigits: 6 }) : '',
    });
    cols.push({
      colId: 'actions',
      headerName: '',
      width: 60,
      sortable: false,
      filter: false,
      editable: false,
      cellRenderer: (p: ICellRendererParams<Row>) => (
        <Tooltip title="Delete">
          <IconButton
            size="small"
            onClick={() => {
              if (p.data) void handleDelete(p.data.id);
            }}
          >
            <Trash />
          </IconButton>
        </Tooltip>
      ),
    });
    return cols;
  }, [dataset.dimensions, dataset.metrics, metricById, handleDelete]);

  const handleCellChange = useCallback(
    async (event: CellValueChangedEvent<Row>) => {
      if (!event.data) return;
      const row = event.data;
      const colField = event.colDef.field;
      const colId = event.colDef.colId ?? '';

      const baseVars = {
        instanceId: instance.id,
        datasetId: dataset.id,
        dataPointId: row.id,
      };

      try {
        if (colField === 'date') {
          await updateDataPoint({
            variables: { ...baseVars, input: asUpdateInput({ date: row.date }) },
          });
        } else if (colField === 'value') {
          await updateDataPoint({
            variables: { ...baseVars, input: asUpdateInput({ value: row.value }) },
          });
        } else if (colField === 'metricId') {
          await updateDataPoint({
            variables: { ...baseVars, input: asUpdateInput({ metricId: row.metricId }) },
          });
        } else if (colId.startsWith('dim-')) {
          await updateDataPoint({
            variables: {
              ...baseVars,
              input: asUpdateInput({
                dimensionCategoryIds: Object.values(row.categoryByDim),
              }),
            },
          });
        }
        onMutated();
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        onMutated(); // refetch to revert optimistic row
      }
    },
    [instance.id, dataset.id, updateDataPoint, onMutated]
  );

  return (
    <Box>
      <Stack direction="row" justifyContent="flex-end" sx={{ mb: 1 }}>
        <Button
          size="small"
          startIcon={<Plus />}
          onClick={() => setAddOpen(true)}
          disabled={dataset.metrics.length === 0}
        >
          Add data point
        </Button>
      </Stack>
      <Box className="ag-theme-alpine" sx={{ height: 500, width: '100%' }}>
        <AgGridReact
          rowData={rows}
          columnDefs={columnDefs}
          defaultColDef={{ resizable: true, sortable: true }}
          onCellValueChanged={(e) => {
            void handleCellChange(e);
          }}
          getRowId={(p) => p.data.id}
          singleClickEdit
          stopEditingWhenCellsLoseFocus
        />
      </Box>
      <AddDataPointDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        dataset={dataset}
        onCreate={async (input) => {
          const result = await createDataPoint({
            variables: { instanceId: instance.id, datasetId: dataset.id, input },
          });
          const payload = result.data?.instanceEditor.datasetEditor.createDataPoint;
          if (payload?.__typename === 'OperationInfo') {
            setError(payload.messages.map((m) => m.message).join('; '));
            return false;
          }
          onMutated();
          return true;
        }}
      />
      <Snackbar
        open={error !== null}
        autoHideDuration={5000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
}

type AddDialogProps = {
  open: boolean;
  onClose: () => void;
  dataset: DatasetDetailFieldsFragment;
  onCreate: (input: {
    date: string;
    value: number | null;
    metricId: string;
    dimensionCategoryIds: string[];
  }) => Promise<boolean>;
};

function AddDataPointDialog({ open, onClose, dataset, onCreate }: AddDialogProps) {
  const defaultDate = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(defaultDate);
  const [value, setValue] = useState('');
  const [metricId, setMetricId] = useState(dataset.metrics[0]?.id ?? '');
  const [categoryByDim, setCategoryByDim] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const dim of dataset.dimensions) {
      if (dim.categories[0]) init[dim.id] = dim.categories[0].uuid;
    }
    return init;
  });
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setDate(defaultDate);
    setValue('');
    setMetricId(dataset.metrics[0]?.id ?? '');
    const init: Record<string, string> = {};
    for (const dim of dataset.dimensions) {
      if (dim.categories[0]) init[dim.id] = dim.categories[0].uuid;
    }
    setCategoryByDim(init);
  };

  const handleSubmit = async () => {
    if (!metricId) return;
    const parsed = value.trim() === '' ? null : Number(value);
    if (parsed !== null && !Number.isFinite(parsed)) return;
    setSubmitting(true);
    const ok = await onCreate({
      date,
      value: parsed,
      metricId,
      dimensionCategoryIds: Object.values(categoryByDim),
    });
    setSubmitting(false);
    if (ok) {
      reset();
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add data point</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            fullWidth
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <FormControl fullWidth>
            <InputLabel id="metric-select-label">Metric</InputLabel>
            <Select
              labelId="metric-select-label"
              label="Metric"
              value={metricId}
              onChange={(e) => setMetricId(e.target.value)}
            >
              {dataset.metrics.map((m) => (
                <MenuItem key={m.id} value={m.id}>
                  {m.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {dataset.dimensions.map((dim) => (
            <FormControl key={dim.id} fullWidth>
              <InputLabel id={`dim-select-${dim.id}`}>{dim.name}</InputLabel>
              <Select
                labelId={`dim-select-${dim.id}`}
                label={dim.name}
                value={categoryByDim[dim.id] ?? ''}
                onChange={(e) =>
                  setCategoryByDim((prev) => ({ ...prev, [dim.id]: e.target.value }))
                }
              >
                {dim.categories.map((cat) => (
                  <MenuItem key={cat.uuid} value={cat.uuid}>
                    {cat.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          ))}
          <TextField
            label="Value"
            type="number"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            fullWidth
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          disabled={submitting || !metricId}
          onClick={() => {
            void handleSubmit();
          }}
        >
          {submitting ? 'Adding…' : 'Add'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
