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
  Typography,
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

/**
 * Discriminated cell shape — each column in a row renders one of these. Kept
 * minimal compared to the reference implementation in kausal-extensions;
 * `ComputedValue` / reference tracking / dirty-batching are not in scope yet.
 */
type MetricHeaderCell = {
  type: 'MetricHeader';
  metricId: string;
  label: string;
  unit: string;
};
type DimensionCategoryCell = {
  type: 'DimensionCategory';
  dimensionId: string;
  categoryUuid: string | null;
  label: string;
};
type ValueCell = {
  type: 'Value';
  dataPointId: string | null;
  value: number | null;
  year: number;
};
type RowCell = MetricHeaderCell | DimensionCategoryCell | ValueCell;

type GridRow = {
  id: string;
  metricId: string;
  categoryByDim: Record<string, string | null>;
  cells: Record<string, RowCell>;
};

type Dataset = DatasetDetailFieldsFragment;
type DataPoint = Dataset['dataPoints'][number];

const METRIC_COL = 'col_metric';
const ACTIONS_COL = 'col_actions';
const dimColId = (dimensionId: string) => `col_dim_${dimensionId}`;
const yearColId = (year: number) => `col_year_${year}`;

function extractYear(date: DataPoint['date']): number {
  // GraphQL `Date` scalar comes through as `YYYY-MM-DD`. Parse as UTC to
  // avoid timezone drift pushing dates into the previous year.
  const s = typeof date === 'string' ? date : String(date);
  const m = /^(\d{4})/.exec(s);
  return m ? Number(m[1]) : new Date(s).getUTCFullYear();
}

/** Stable row key from metric + (dim.id → category.uuid). */
function rowKey(metricId: string, categoryByDim: Record<string, string | null>): string {
  const parts = Object.entries(categoryByDim)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dimId, catUuid]) => `${dimId}:${catUuid ?? '∅'}`);
  return [metricId, ...parts].join('|');
}

/**
 * Fold data points into wide rows keyed by (metric, category-combination).
 * Year columns come from the union of all years present.
 */
function buildGridData(dataset: Dataset): {
  rows: GridRow[];
  years: number[];
} {
  const metricById = new Map(dataset.metrics.map((m) => [m.id, m]));
  const catLabelByUuid = new Map<string, { label: string; dimensionId: string }>();
  for (const dim of dataset.dimensions) {
    for (const cat of dim.categories) {
      catLabelByUuid.set(cat.uuid, { label: cat.label, dimensionId: dim.id });
    }
  }

  const rowsByKey = new Map<string, GridRow>();
  const yearSet = new Set<number>();

  for (const dp of dataset.dataPoints) {
    const dpCatUuids = new Set(dp.dimensionCategories.map((c) => c.uuid));
    const categoryByDim: Record<string, string | null> = {};
    for (const dim of dataset.dimensions) {
      const found = dim.categories.find((c) => dpCatUuids.has(c.uuid));
      categoryByDim[dim.id] = found?.uuid ?? null;
    }

    const year = extractYear(dp.date);
    yearSet.add(year);

    const key = rowKey(dp.metric.id, categoryByDim);
    let row = rowsByKey.get(key);
    if (!row) {
      const metric = metricById.get(dp.metric.id);
      const cells: Record<string, RowCell> = {
        [METRIC_COL]: {
          type: 'MetricHeader',
          metricId: dp.metric.id,
          label: metric?.label ?? dp.metric.id,
          unit: metric?.unit ?? '',
        },
      };
      for (const dim of dataset.dimensions) {
        const catUuid = categoryByDim[dim.id];
        cells[dimColId(dim.id)] = {
          type: 'DimensionCategory',
          dimensionId: dim.id,
          categoryUuid: catUuid,
          label: catUuid ? (catLabelByUuid.get(catUuid)?.label ?? catUuid) : '—',
        };
      }
      row = { id: key, metricId: dp.metric.id, categoryByDim, cells };
      rowsByKey.set(key, row);
    }

    // If two data points share (metric, categories, year) we keep the one with
    // the later date — a concession to the year-granular wide view. The skipped
    // one stays in the DB; switching back to long view would surface it.
    const colId = yearColId(year);
    const existing = row.cells[colId];
    if (!existing || (existing.type === 'Value' && existing.dataPointId === null)) {
      row.cells[colId] = {
        type: 'Value',
        dataPointId: dp.id,
        value: dp.value,
        year,
      };
    }
  }

  // Ensure every row has a ValueCell for every known year (empty = null dp).
  const sortedYears = [...yearSet].sort((a, b) => a - b);
  for (const row of rowsByKey.values()) {
    for (const year of sortedYears) {
      const colId = yearColId(year);
      if (!row.cells[colId]) {
        row.cells[colId] = { type: 'Value', dataPointId: null, value: null, year };
      }
    }
  }

  return { rows: [...rowsByKey.values()], years: sortedYears };
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
  const [deleteDataPoint] = useMutation<DeleteDataPointMutation, DeleteDataPointMutationVariables>(
    DELETE_DATA_POINT
  );

  // Generated input types require all fields (avoidOptionals). Backend rejects
  // explicit null on Maybe fields, so we build partial inputs and cast.
  type UpdateInput = UpdateDataPointMutationVariables['input'];
  const asUpdateInput = (partial: Partial<Record<keyof UpdateInput, unknown>>) =>
    partial as unknown as UpdateInput;

  const { rows, years } = useMemo(() => buildGridData(dataset), [dataset]);

  const handleRowDelete = useCallback(
    async (row: GridRow) => {
      const ids = Object.values(row.cells)
        .filter((c): c is ValueCell => c.type === 'Value' && c.dataPointId !== null)
        .map((c) => c.dataPointId as string);
      if (ids.length === 0) return;
      try {
        // Sequential is fine at this scale and keeps error attribution simple.
        for (const id of ids) {
          const result = await deleteDataPoint({
            variables: { instanceId: instance.id, datasetId: dataset.id, dataPointId: id },
          });
          const msgs = result.data?.instanceEditor.datasetEditor.deleteDataPoint?.messages ?? [];
          if (msgs.length > 0) {
            setError(msgs.map((m) => m.message).join('; '));
            break;
          }
        }
      } finally {
        onMutated();
      }
    },
    [deleteDataPoint, instance.id, dataset.id, onMutated]
  );

  const columnDefs = useMemo<ColDef<GridRow>[]>(() => {
    const cols: ColDef<GridRow>[] = [
      {
        colId: METRIC_COL,
        headerName: 'Metric',
        width: 180,
        pinned: 'left',
        valueGetter: (p) => {
          const c = p.data?.cells[METRIC_COL];
          return c?.type === 'MetricHeader' ? c.label : '';
        },
        cellRenderer: (p: ICellRendererParams<GridRow>) => {
          const c = p.data?.cells[METRIC_COL];
          if (c?.type !== 'MetricHeader') return null;
          return (
            <Box sx={{ lineHeight: 1.2 }}>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {c.label}
              </Typography>
              {c.unit && (
                <Typography variant="caption" color="text.secondary">
                  {c.unit}
                </Typography>
              )}
            </Box>
          );
        },
      },
    ];
    for (const dim of dataset.dimensions) {
      cols.push({
        colId: dimColId(dim.id),
        headerName: dim.name,
        width: 160,
        pinned: 'left',
        valueGetter: (p) => {
          const c = p.data?.cells[dimColId(dim.id)];
          return c?.type === 'DimensionCategory' ? c.label : '';
        },
      });
    }
    for (const year of years) {
      cols.push({
        colId: yearColId(year),
        headerName: String(year),
        width: 110,
        editable: true,
        type: 'numericColumn',
        valueGetter: (p) => {
          const c = p.data?.cells[yearColId(year)];
          return c?.type === 'Value' ? c.value : null;
        },
        valueSetter: (p) => {
          if (!p.data) return false;
          const raw: unknown = p.newValue;
          const next = raw === null || raw === '' ? null : Number(raw);
          if (next !== null && !Number.isFinite(next)) return false;
          const prev = p.data.cells[yearColId(year)];
          const dataPointId = prev?.type === 'Value' ? prev.dataPointId : null;
          p.data.cells[yearColId(year)] = {
            type: 'Value',
            dataPointId,
            value: next,
            year,
          };
          return true;
        },
        valueFormatter: (p: { value: number | null }) =>
          p.value != null ? p.value.toLocaleString(undefined, { maximumFractionDigits: 6 }) : '',
      });
    }
    cols.push({
      colId: ACTIONS_COL,
      headerName: '',
      width: 60,
      pinned: 'right',
      lockPinned: true,
      resizable: false,
      sortable: false,
      filter: false,
      editable: false,
      cellRenderer: (p: ICellRendererParams<GridRow>) => (
        <Tooltip title="Delete all values in this row">
          <IconButton
            size="small"
            onClick={() => {
              if (p.data) void handleRowDelete(p.data);
            }}
          >
            <Trash />
          </IconButton>
        </Tooltip>
      ),
    });
    return cols;
  }, [dataset.dimensions, years, handleRowDelete]);

  const handleCellChange = useCallback(
    async (event: CellValueChangedEvent<GridRow>) => {
      if (!event.data) return;
      const row = event.data;
      const colId = event.colDef.colId ?? '';
      if (!colId.startsWith('col_year_')) return;

      const year = Number(colId.slice('col_year_'.length));
      const cell = row.cells[colId];
      if (cell?.type !== 'Value') return;

      const baseVars = { instanceId: instance.id, datasetId: dataset.id };

      try {
        if (cell.dataPointId === null) {
          if (cell.value === null) return; // empty → empty
          const result = await createDataPoint({
            variables: {
              ...baseVars,
              input: {
                date: `${year}-01-01`,
                value: cell.value,
                metricId: row.metricId,
                dimensionCategoryIds: Object.values(row.categoryByDim).filter(
                  (v): v is string => v !== null
                ),
              },
            },
          });
          const payload = result.data?.instanceEditor.datasetEditor.createDataPoint;
          if (payload?.__typename === 'OperationInfo') {
            setError(payload.messages.map((m) => m.message).join('; '));
          }
        } else if (cell.value === null) {
          const result = await deleteDataPoint({
            variables: { ...baseVars, dataPointId: cell.dataPointId },
          });
          const msgs = result.data?.instanceEditor.datasetEditor.deleteDataPoint?.messages ?? [];
          if (msgs.length > 0) {
            setError(msgs.map((m) => m.message).join('; '));
          }
        } else {
          await updateDataPoint({
            variables: {
              ...baseVars,
              dataPointId: cell.dataPointId,
              input: asUpdateInput({ value: cell.value }),
            },
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        onMutated();
      }
    },
    [instance.id, dataset.id, createDataPoint, updateDataPoint, deleteDataPoint, onMutated]
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
