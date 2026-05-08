import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  Alert,
  Box,
  Button,
  IconButton,
  Snackbar,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';

import { useMutation } from '@apollo/client/react';
import type {
  CellValueChangedEvent,
  ColDef,
  ColumnState,
  GridApi,
  GridReadyEvent,
  ICellRendererParams,
} from 'ag-grid-community';
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
import { type AddProgress, AddRowsModal } from './AddRowsModal';
import { AddYearsModal } from './AddYearsModal';
import { NOT_APPLICABLE } from './DimensionCategoryList';
import { CREATE_DATA_POINT, DELETE_DATA_POINT, UPDATE_DATA_POINT } from './queries';

type Props = {
  dataset: DatasetDetailFieldsFragment;
  onMutated: () => void;
};

/**
 * Discriminated cell shape — each column in a row renders one of these. Kept
 * minimal compared to the reference implementation in kausal-extensions;
 * `ComputedValue` / reference tracking are not in scope yet.
 *
 * Dirty-tracking lives in `pendingEdits` on the component (keyed by
 * `${rowId}|${colId}`) rather than inside the cell so committed state stays
 * pristine until `onMutated` refetches.
 */
export type MetricHeaderCell = {
  type: 'MetricHeader';
  metricId: string;
  label: string;
  unit: string;
};
export type DimensionCategoryCell = {
  type: 'DimensionCategory';
  dimensionId: string;
  categoryUuid: string | null;
  label: string;
};
export type ValueCell = {
  type: 'Value';
  dataPointId: string | null;
  value: number | null;
  year: number;
};
export type RowCell = MetricHeaderCell | DimensionCategoryCell | ValueCell;

export type GridRow = {
  id: string;
  metricId: string;
  categoryByDim: Record<string, string | null>;
  cells: Record<string, RowCell>;
};

export type PendingEdit = {
  rowId: string;
  colId: string;
  year: number;
  /** Data-point id if the cell was already persisted when the edit started. */
  dataPointId: string | null;
  /** New value the user entered (null = clear / delete). */
  nextValue: number | null;
  /** Committed value at edit time — what "Discard" restores. */
  originalValue: number | null;
  /** Set when the previous commit attempt failed; drives the red tint. */
  error?: string;
};

export type Dataset = DatasetDetailFieldsFragment;
export type DataPoint = Dataset['dataPoints'][number];

export type UpdateInput = UpdateDataPointMutationVariables['input'];
export const asUpdateInput = (partial: Partial<Record<keyof UpdateInput, unknown>>) =>
  partial as unknown as UpdateInput;

export const METRIC_COL = 'col_metric';
const ACTIONS_COL = 'col_actions';
// Row-level delete is hidden for now — editing happens through cell commits.
// Flip to re-enable the trash column + row delete button.
const SHOW_ACTIONS_COLUMN = false;
export const dimColId = (dimensionId: string) => `col_dim_${dimensionId}`;
export const yearColId = (year: number) => `col_year_${year}`;
export const pendingKey = (rowId: string, colId: string) => `${rowId}|${colId}`;

export function extractYear(date: DataPoint['date']): number {
  const s = typeof date === 'string' ? date : String(date);
  const m = /^(\d{4})/.exec(s);
  return m ? Number(m[1]) : new Date(s).getUTCFullYear();
}

export function rowKey(metricId: string, categoryByDim: Record<string, string | null>): string {
  const parts = Object.entries(categoryByDim)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dimId, catUuid]) => `${dimId}:${catUuid ?? '∅'}`);
  return [metricId, ...parts].join('|');
}

export function buildGridData(
  dataset: Dataset,
  extraYears: ReadonlySet<number>
): {
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

  // User-added empty year columns are merged in so they render alongside
  // data-derived years, sorted together.
  for (const y of extraYears) yearSet.add(y);
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

export function diffKind(
  dataPointId: string | null,
  nextValue: number | null
): 'create' | 'update' | 'delete' {
  if (dataPointId === null) return 'create';
  if (nextValue === null) return 'delete';
  return 'update';
}

export default function DatasetDataGrid({ dataset, onMutated }: Props) {
  const instance = useInstance();
  const [addOpen, setAddOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [pendingEdits, setPendingEdits] = useState<Map<string, PendingEdit>>(() => new Map());
  const [extraYears, setExtraYears] = useState<Set<number>>(() => new Set());
  const [addYearOpen, setAddYearOpen] = useState(false);
  const [addProgress, setAddProgress] = useState<AddProgress | null>(null);
  // Ref mirror so long-lived AG Grid column callbacks (valueGetter, cellStyle,
  // tooltipValueGetter) always see the latest pending state without forcing
  // columnDefs to rebuild — a rebuild resets user-adjusted column widths.
  const pendingEditsRef = useRef(pendingEdits);
  pendingEditsRef.current = pendingEdits;
  const gridApiRef = useRef<GridApi<GridRow> | null>(null);
  const columnStateRef = useRef<ColumnState[] | null>(null);

  const [createDataPoint] = useMutation<CreateDataPointMutation, CreateDataPointMutationVariables>(
    CREATE_DATA_POINT
  );
  const [updateDataPoint] = useMutation<UpdateDataPointMutation, UpdateDataPointMutationVariables>(
    UPDATE_DATA_POINT
  );
  const [deleteDataPoint] = useMutation<DeleteDataPointMutation, DeleteDataPointMutationVariables>(
    DELETE_DATA_POINT
  );

  const { rows, years } = useMemo(() => buildGridData(dataset, extraYears), [dataset, extraYears]);
  const rowById = useMemo(() => new Map(rows.map((r) => [r.id, r])), [rows]);

  // Flat list per existing row: [metricId, ...nonNullDimCategoryUuids]. Lets
  // AddRowsModal grey out combinations that would duplicate an existing row.
  const existingCombinations = useMemo<string[][]>(
    () =>
      rows.map((r) => [
        r.metricId,
        ...Object.values(r.categoryByDim).filter((v): v is string => v !== null),
      ]),
    [rows]
  );

  const handleAddRows = useCallback(
    async (selectedMetricIds: string[], newRows: string[][]) => {
      if (newRows.length === 0) return;
      const metricIdSet = new Set(selectedMetricIds);
      // One anchor DataPoint per new row: enough to make the row render. Other
      // year cells stay backed by no DataPoint and are created lazily as the
      // user edits them. Earliest existing year is the anchor; current year if
      // the dataset is brand-new.
      const anchorYear = years.length > 0 ? years[0] : new Date().getUTCFullYear();
      setAddProgress({ current: 0, total: newRows.length });

      let failureCount = 0;
      let firstError: string | null = null;

      for (const row of newRows) {
        const metricId = row.find((id) => metricIdSet.has(id));
        if (metricId) {
          const dimensionCategoryIds = row.filter((id) => id !== metricId && id !== NOT_APPLICABLE);
          try {
            const result = await createDataPoint({
              variables: {
                instanceId: instance.id,
                datasetId: dataset.id,
                input: {
                  date: `${anchorYear}-01-01`,
                  metricId,
                  dimensionCategoryIds,
                  value: null,
                },
              },
            });
            const payload = result.data?.instanceEditor.datasetEditor.createDataPoint;
            if (payload?.__typename === 'OperationInfo') {
              failureCount += 1;
              firstError ??= payload.messages.map((m) => m.message).join('; ');
            }
          } catch (err) {
            failureCount += 1;
            firstError ??= err instanceof Error ? err.message : String(err);
          }
        }
        setAddProgress((prev) => (prev ? { ...prev, current: prev.current + 1 } : prev));
      }

      setAddProgress(null);
      setAddOpen(false);
      if (failureCount > 0) {
        setError(firstError ?? `Failed to add ${failureCount} row${failureCount === 1 ? '' : 's'}`);
      }
      onMutated();
    },
    [createDataPoint, instance.id, dataset.id, years, onMutated]
  );

  const handleAddYears = useCallback(
    async (newYears: number[]) => {
      if (newYears.length === 0) return;

      // Update extraYears immediately for visual feedback while mutations are
      // in flight. After refetch, the year is in dataset.dataPoints; the
      // extraYears entry then merges in as a no-op.
      setExtraYears((prev) => {
        const next = new Set(prev);
        for (const y of newYears) next.add(y);
        return next;
      });

      // No row to anchor against — column is ephemeral until rows exist.
      if (rows.length === 0) return;

      const anchorRow = rows[0];
      const dimensionCategoryIds = Object.values(anchorRow.categoryByDim).filter(
        (v): v is string => v !== null
      );

      let firstError: string | null = null;
      let failureCount = 0;
      for (const year of newYears) {
        try {
          const result = await createDataPoint({
            variables: {
              instanceId: instance.id,
              datasetId: dataset.id,
              input: {
                date: `${year}-01-01`,
                metricId: anchorRow.metricId,
                dimensionCategoryIds,
                value: null,
              },
            },
          });
          const payload = result.data?.instanceEditor.datasetEditor.createDataPoint;
          if (payload?.__typename === 'OperationInfo') {
            failureCount += 1;
            firstError ??= payload.messages.map((m) => m.message).join('; ');
          }
        } catch (err) {
          failureCount += 1;
          firstError ??= err instanceof Error ? err.message : String(err);
        }
      }
      if (failureCount > 0) {
        setError(
          firstError ?? `Failed to add ${failureCount} year${failureCount === 1 ? '' : 's'}`
        );
      }
      onMutated();
    },
    [createDataPoint, instance.id, dataset.id, rows, onMutated]
  );

  const handleRowDelete = useCallback(
    async (row: GridRow) => {
      const ids = Object.values(row.cells)
        .filter((c): c is ValueCell => c.type === 'Value' && c.dataPointId !== null)
        .map((c) => c.dataPointId as string);
      if (ids.length === 0) return;
      try {
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
        // Drop any pending edits on this row — they refer to rows that no
        // longer exist after the delete.
        setPendingEdits((prev) => {
          if (prev.size === 0) return prev;
          const next = new Map(prev);
          for (const key of next.keys()) {
            if (key.startsWith(`${row.id}|`)) next.delete(key);
          }
          return next;
        });
      } finally {
        onMutated();
      }
    },
    [deleteDataPoint, instance.id, dataset.id, onMutated]
  );

  const columnDefs = useMemo<ColDef<GridRow>[]>(() => {
    const cols: ColDef<GridRow>[] = [];
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
    // Metric sits *last* in the pinned block so the number column flows
    // directly into its year cells without a dimension-break in between.
    cols.push({
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
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              lineHeight: 1.2,
              height: '100%',
            }}
          >
            <Typography sx={{ fontSize: 11, fontWeight: 500, lineHeight: 1.2 }}>
              {c.label}
            </Typography>
            {c.unit && (
              <Typography sx={{ fontSize: 10, lineHeight: 1.2 }} color="text.secondary">
                {c.unit}
              </Typography>
            )}
          </Box>
        );
      },
    });
    for (const year of years) {
      const colId = yearColId(year);
      cols.push({
        colId,
        headerName: String(year),
        width: 84,
        editable: true,
        type: 'numericColumn',
        valueGetter: (p) => {
          if (!p.data) return null;
          const pending = pendingEditsRef.current.get(pendingKey(p.data.id, colId));
          if (pending) return pending.nextValue;
          const c = p.data.cells[colId];
          return c?.type === 'Value' ? c.value : null;
        },
        valueSetter: (p) => {
          if (!p.data) return false;
          const raw: unknown = p.newValue;
          const next =
            raw === null || raw === '' || typeof raw === 'undefined' ? null : Number(raw);
          if (next !== null && !Number.isFinite(next)) return false;
          const committed = p.data.cells[colId];
          if (committed?.type !== 'Value') return false;

          setPendingEdits((prev) => {
            const map = new Map(prev);
            const key = pendingKey(p.data.id, colId);
            const existing = map.get(key);
            // The baseline we compare against is what was persisted when the
            // user first touched this cell — preserved across keystrokes so
            // a round-trip (A → B → A) clears the pending entry.
            const originalValue = existing ? existing.originalValue : committed.value;
            if (next === originalValue) {
              map.delete(key);
            } else {
              map.set(key, {
                rowId: p.data.id,
                colId,
                year,
                dataPointId: committed.dataPointId,
                nextValue: next,
                originalValue,
              });
            }
            return map;
          });
          return true;
        },
        valueFormatter: (p: { value: number | null }) =>
          p.value != null ? p.value.toLocaleString(undefined, { maximumFractionDigits: 6 }) : '',
        // Using cellClassRules (not cellStyle) because AG Grid doesn't clear
        // previously applied inline styles when cellStyle transitions back to
        // null — classes are toggled cleanly on refresh.
        cellClassRules: {
          'dsg-cell-dirty': (p) => {
            if (!p.data) return false;
            const pending = pendingEditsRef.current.get(pendingKey(p.data.id, colId));
            return !!pending && !pending.error;
          },
          'dsg-cell-error': (p) => {
            if (!p.data) return false;
            const pending = pendingEditsRef.current.get(pendingKey(p.data.id, colId));
            return !!pending?.error;
          },
        },
        tooltipValueGetter: (p) => {
          if (!p.data) return undefined;
          const pending = pendingEditsRef.current.get(pendingKey(p.data.id, colId));
          if (!pending) return undefined;
          if (pending.error) return `Save failed: ${pending.error}`;
          const original =
            pending.originalValue != null
              ? pending.originalValue.toLocaleString(undefined, { maximumFractionDigits: 6 })
              : '(empty)';
          return `Unsaved · was ${original}`;
        },
      });
    }
    if (SHOW_ACTIONS_COLUMN) {
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
    }
    return cols;
  }, [dataset.dimensions, years, handleRowDelete]);

  const handleCellChange = useCallback((_event: CellValueChangedEvent<GridRow>) => {
    // Value commits happen in valueSetter (pendingEdits state). Nothing to do
    // on the post-commit event — kept as a seam if we later want to log edits.
  }, []);

  const handleDiscard = useCallback(() => {
    setPendingEdits(new Map());
  }, []);

  const handleSave = useCallback(async () => {
    if (pendingEdits.size === 0 || saving) return;
    setSaving(true);

    const baseVars = { instanceId: instance.id, datasetId: dataset.id };
    // Snapshot the queue at save start — entries the user adds mid-commit
    // stay in `pendingEdits` and get their own run next time.
    const queued = [...pendingEdits];

    const clearPending = (key: string) => {
      setPendingEdits((prev) => {
        if (!prev.has(key)) return prev;
        const next = new Map(prev);
        next.delete(key);
        return next;
      });
    };
    const markFailure = (key: string, edit: PendingEdit, error: string) => {
      setPendingEdits((prev) => {
        const next = new Map(prev);
        next.set(key, { ...edit, error });
        return next;
      });
    };

    let failureCount = 0;
    let unexpected: string | null = null;

    // Sequential commits — kausal-extensions does it this way too. Simpler
    // error attribution than Promise.allSettled, acceptable latency at the
    // scale of a single grid view. Highlight clears per-cell as each
    // mutation resolves.
    for (const [key, edit] of queued) {
      const row = rowById.get(edit.rowId);
      if (!row) {
        clearPending(key);
        continue;
      }
      const kind = diffKind(edit.dataPointId, edit.nextValue);

      try {
        if (kind === 'create') {
          if (edit.nextValue === null) {
            clearPending(key);
            continue;
          }
          const result = await createDataPoint({
            variables: {
              ...baseVars,
              input: {
                date: `${edit.year}-01-01`,
                value: edit.nextValue,
                metricId: row.metricId,
                dimensionCategoryIds: Object.values(row.categoryByDim).filter(
                  (v): v is string => v !== null
                ),
              },
            },
          });
          const payload = result.data?.instanceEditor.datasetEditor.createDataPoint;
          if (payload?.__typename === 'OperationInfo') {
            failureCount += 1;
            markFailure(key, edit, payload.messages.map((m) => m.message).join('; '));
          } else {
            clearPending(key);
          }
        } else if (kind === 'delete') {
          if (edit.dataPointId === null) {
            clearPending(key);
            continue;
          }
          const result = await deleteDataPoint({
            variables: { ...baseVars, dataPointId: edit.dataPointId },
          });
          const msgs = result.data?.instanceEditor.datasetEditor.deleteDataPoint?.messages ?? [];
          if (msgs.length > 0) {
            failureCount += 1;
            markFailure(key, edit, msgs.map((m) => m.message).join('; '));
          } else {
            clearPending(key);
          }
        } else {
          if (edit.dataPointId === null) {
            clearPending(key);
            continue;
          }
          const result = await updateDataPoint({
            variables: {
              ...baseVars,
              dataPointId: edit.dataPointId,
              input: asUpdateInput({ value: edit.nextValue }),
            },
          });
          const payload = result.data?.instanceEditor.datasetEditor.updateDataPoint;
          if (payload?.__typename === 'OperationInfo') {
            failureCount += 1;
            markFailure(key, edit, payload.messages.map((m) => m.message).join('; '));
          } else {
            clearPending(key);
          }
        }
      } catch (err) {
        failureCount += 1;
        const msg = err instanceof Error ? err.message : String(err);
        markFailure(key, edit, msg);
        unexpected ??= msg;
      }
    }

    setSaving(false);

    if (failureCount > 0) {
      setError(
        unexpected ??
          `Saved with ${failureCount} error${failureCount === 1 ? '' : 's'}. Hover failed cells for details.`
      );
    }
    onMutated();
  }, [
    pendingEdits,
    saving,
    instance.id,
    dataset.id,
    rowById,
    createDataPoint,
    updateDataPoint,
    deleteDataPoint,
    onMutated,
  ]);

  // Redraw year-column cells when the pending map changes so cellStyle /
  // valueGetter / tooltipValueGetter pick up the new ref value. `force: true`
  // ensures the styling refreshes even if the rendered text didn't change.
  useEffect(() => {
    const api = gridApiRef.current;
    if (!api) return;
    const yearColIds = years.map(yearColId);
    if (yearColIds.length > 0) {
      api.refreshCells({ columns: yearColIds, force: true });
    }
  }, [pendingEdits, years]);

  // After columnDefs reference changes (e.g. a refetch added or removed a
  // year column), re-apply any saved column widths. `applyOrder: false` means
  // unknown columns keep their default position.
  useEffect(() => {
    const api = gridApiRef.current;
    const saved = columnStateRef.current;
    if (!api || !saved) return;
    api.applyColumnState({ state: saved, applyOrder: false });
  }, [columnDefs]);

  // Stable references for props passed to AgGridReact — fresh object/function
  // references on every render cause AG Grid to re-apply defaults and drop
  // user-adjusted column widths.
  const defaultColDef = useMemo<ColDef<GridRow>>(() => ({ resizable: true, sortable: true }), []);
  const getRowId = useCallback((p: { data: GridRow }) => p.data.id, []);

  // Keep the pinned-left columns (dimensions + Metric) from starving the
  // scrolling year columns. Runs after layout so we can read the grid's
  // actual rendered width. User-driven resizes via `onColumnResized` still
  // win — we only shrink automatically when the cap is breached.
  const MAX_PINNED_FRACTION = 0.75;
  const capPinnedWidths = useCallback(() => {
    const api = gridApiRef.current;
    if (!api) return;
    const rootEl = document.querySelector<HTMLElement>('.ag-root-wrapper');
    const gridWidth = rootEl?.clientWidth ?? 0;
    if (gridWidth <= 0) return;
    const cap = gridWidth * MAX_PINNED_FRACTION;
    const pinnedIds: string[] = [...dataset.dimensions.map((d) => dimColId(d.id)), METRIC_COL];
    const widths = pinnedIds.map((id) => api.getColumn(id)?.getActualWidth() ?? 0);
    const total = widths.reduce((a, b) => a + b, 0);
    if (total <= cap || total === 0) return;
    const scale = cap / total;
    const updates = pinnedIds
      .map((key, i) => ({ key, newWidth: Math.max(40, Math.floor(widths[i] * scale)) }))
      .filter(({ newWidth }, i) => newWidth !== widths[i]);
    if (updates.length > 0) api.setColumnWidths(updates);
  }, [dataset.dimensions]);

  const handleGridReady = useCallback(
    (event: GridReadyEvent<GridRow>) => {
      gridApiRef.current = event.api;
      // Defer one frame so the wrapper has laid out its width.
      requestAnimationFrame(capPinnedWidths);
    },
    [capPinnedWidths]
  );
  const handleColumnResized = useCallback((event: { finished: boolean }) => {
    if (event.finished && gridApiRef.current) {
      columnStateRef.current = gridApiRef.current.getColumnState();
    }
  }, []);
  const handleGridSizeChanged = useCallback(() => {
    capPinnedWidths();
  }, [capPinnedWidths]);

  // Re-apply cap when the set of pinned columns changes (dimensions added,
  // etc.) — columnDefs rebuild triggers AG Grid to restore its default widths.
  useEffect(() => {
    capPinnedWidths();
  }, [capPinnedWidths, columnDefs]);

  const pendingCount = pendingEdits.size;
  const hasPending = pendingCount > 0;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="flex-end"
        spacing={1}
        sx={{ mb: 1 }}
      >
        {hasPending && (
          <Typography variant="body2" color="warning.main" sx={{ mr: 'auto' }}>
            {pendingCount} unsaved change{pendingCount === 1 ? '' : 's'}
          </Typography>
        )}
        <Button
          size="small"
          onClick={handleDiscard}
          disabled={!hasPending || saving}
          color="inherit"
        >
          Discard
        </Button>
        <Button
          size="small"
          variant="contained"
          onClick={() => void handleSave()}
          disabled={!hasPending || saving}
        >
          {saving ? 'Saving…' : 'Save changes'}
        </Button>
        <Button size="small" startIcon={<Plus />} onClick={() => setAddYearOpen(true)}>
          Add year
        </Button>
        <Button
          size="small"
          startIcon={<Plus />}
          onClick={() => setAddOpen(true)}
          disabled={dataset.metrics.length === 0}
        >
          Add rows
        </Button>
      </Stack>
      <Box
        className="ag-theme-alpine"
        sx={{
          flex: 1,
          minHeight: 0,
          width: '100%',
          // Compact variant of the alpine theme — reduces row height, cell
          // padding, and font size. Scoped via className so the spacious
          // default still applies elsewhere.
          '--ag-grid-size': '3px',
          '--ag-font-size': '11px',
          '--ag-cell-horizontal-padding': '4px',
          // Cell/header padding — AG Grid's compiled CSS (`.ag-ltr .ag-cell`)
          // ships in the same specificity band as our sx class and is loaded
          // later in the cascade, so the `--ag-cell-horizontal-padding` var
          // gets overridden by the theme's calc() chain. Force with
          // !important to win unconditionally.
          '& .ag-cell': {
            paddingLeft: '4px !important',
            paddingRight: '4px !important',
          },
          '& .ag-header-cell': {
            paddingLeft: '4px !important',
            paddingRight: '4px !important',
          },
          '& .ag-header-cell-label': { fontSize: 11 },
          '& .ag-cell.dsg-cell-dirty': {
            backgroundColor: 'rgba(237, 108, 2, 0.12)',
            borderLeft: '3px solid #ed6c02',
          },
          '& .ag-cell.dsg-cell-error': {
            backgroundColor: 'rgba(211, 47, 47, 0.12)',
            borderLeft: '3px solid #d32f2f',
          },
        }}
      >
        <AgGridReact
          rowData={rows}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          onGridReady={handleGridReady}
          onGridSizeChanged={handleGridSizeChanged}
          onColumnResized={handleColumnResized}
          onCellValueChanged={handleCellChange}
          getRowId={getRowId}
          rowHeight={38}
          headerHeight={32}
          singleClickEdit
          stopEditingWhenCellsLoseFocus
          tooltipShowDelay={400}
        />
      </Box>
      <AddRowsModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        metrics={dataset.metrics}
        dimensions={dataset.dimensions}
        existingCombinations={existingCombinations}
        isAdding={addProgress !== null}
        progress={addProgress}
        onAdd={(selectedMetricIds, newRows) => {
          void handleAddRows(selectedMetricIds, newRows);
        }}
      />
      <AddYearsModal
        open={addYearOpen}
        existingYears={years}
        onClose={() => setAddYearOpen(false)}
        onAddYears={(newYears) => {
          void handleAddYears(newYears);
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
