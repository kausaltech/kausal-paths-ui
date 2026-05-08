import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  Alert,
  Box,
  Button,
  ClickAwayListener,
  LinearProgress,
  ListItemIcon,
  ListItemText,
  MenuItem,
  MenuList,
  Paper,
  Popper,
  Snackbar,
  Stack,
  Typography,
} from '@mui/material';

import { useMutation } from '@apollo/client/react';
import {
  CompactSelection,
  DataEditor,
  type DataEditorProps,
  type EditableGridCell,
  type GridCell,
  GridCellKind,
  type GridColumn,
  type GridSelection,
  type Item,
} from '@glideapps/glide-data-grid';
import '@glideapps/glide-data-grid/dist/index.css';
import { ChatLeft, Clipboard, Database, Files, Plus, Trash } from 'react-bootstrap-icons';

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
import { type AddProgress, AddRowsModal } from './AddRowsModal';
import {
  AddYearDialog,
  type GridRow,
  METRIC_COL,
  type PendingEdit,
  asUpdateInput,
  buildGridData,
  diffKind,
  dimColId,
  pendingKey,
  yearColId,
} from './DatasetDataGrid';
import { NOT_APPLICABLE } from './DimensionCategoryList';
import { CREATE_DATA_POINT, DELETE_DATA_POINT, UPDATE_DATA_POINT } from './queries';

type Props = {
  dataset: DatasetDetailFieldsFragment;
  onMutated: () => void;
};

// Solid colour approximations of the original rgba tints — canvas doesn't
// composite the alpha against the row background the same way CSS does, so we
// pre-mix against white.
const DIRTY_BG = '#fce8d4';
const ERROR_BG = '#fbe1e1';

const EMPTY_SELECTION: GridSelection = {
  columns: CompactSelection.empty(),
  rows: CompactSelection.empty(),
};

const DEFAULT_DIM_WIDTH = 160;
const DEFAULT_METRIC_WIDTH = 180;
const DEFAULT_YEAR_WIDTH = 84;

const YEAR_COL_PREFIX = 'col_year_';
const DIM_COL_PREFIX = 'col_dim_';

function formatNumber(value: number | null | undefined): string {
  if (value == null) return '';
  return value.toLocaleString(undefined, { maximumFractionDigits: 6 });
}

function defaultWidthForCol(colId: string): number {
  if (colId === METRIC_COL) return DEFAULT_METRIC_WIDTH;
  if (colId.startsWith(YEAR_COL_PREFIX)) return DEFAULT_YEAR_WIDTH;
  return DEFAULT_DIM_WIDTH;
}

function isYearColId(colId: string): boolean {
  return colId.startsWith(YEAR_COL_PREFIX);
}

// Glide's overlay editor portals into `#portal`. Mount one if missing so the
// number-cell editor opens; left in place across unmounts so multiple grids
// (or remounts) share a single portal node.
function useEnsurePortal() {
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (document.getElementById('portal')) return;
    const el = document.createElement('div');
    el.id = 'portal';
    el.style.position = 'fixed';
    el.style.left = '0';
    el.style.top = '0';
    el.style.zIndex = '9999';
    document.body.appendChild(el);
  }, []);
}

function yearFromColId(colId: string): number | null {
  const m = /^col_year_(\d+)$/.exec(colId);
  return m ? Number(m[1]) : null;
}

export default function DatasetDataGridGlide({ dataset, onMutated }: Props) {
  useEnsurePortal();
  const instance = useInstance();
  const [addOpen, setAddOpen] = useState(false);
  const [addYearOpen, setAddYearOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [pendingEdits, setPendingEdits] = useState<Map<string, PendingEdit>>(() => new Map());
  const [extraYears, setExtraYears] = useState<Set<number>>(() => new Set());
  const [colWidths, setColWidths] = useState<Record<string, number>>({});
  const [addProgress, setAddProgress] = useState<AddProgress | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
    row: GridRow;
  } | null>(null);
  const [deleteProgress, setDeleteProgress] = useState<AddProgress | null>(null);
  const [gridSelection, setGridSelection] = useState<GridSelection>(EMPTY_SELECTION);
  const gridWrapperRef = useRef<HTMLDivElement | null>(null);
  // Glide's onCellContextMenu fires through the React tree; the document-level
  // listener below reads this ref to combine the row identity with the native
  // event's clientX/Y. Using a ref (not state) avoids stale closures because
  // both callbacks fire from the same browser event.
  const pendingContextRowRef = useRef<GridRow | null>(null);

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

  const handleDeleteRows = useCallback(
    async (rowsToDelete: GridRow[]) => {
      if (rowsToDelete.length === 0) return;
      const rowIdPrefixes = rowsToDelete.map((r) => `${r.id}|`);
      const allIds: string[] = [];
      for (const row of rowsToDelete) {
        for (const c of Object.values(row.cells)) {
          if (c.type === 'Value' && c.dataPointId !== null) allIds.push(c.dataPointId);
        }
      }

      // Drop any pending edits on the affected rows — they refer to rows
      // that no longer exist after the delete.
      const dropPending = () => {
        setPendingEdits((prev) => {
          if (prev.size === 0) return prev;
          const next = new Map(prev);
          for (const key of next.keys()) {
            if (rowIdPrefixes.some((p) => key.startsWith(p))) next.delete(key);
          }
          return next;
        });
      };

      if (allIds.length === 0) {
        // Phantom rows — no DataPoints exist yet (only pending edits).
        dropPending();
        setGridSelection(EMPTY_SELECTION);
        return;
      }

      setDeleteProgress({ current: 0, total: allIds.length });
      let firstError: string | null = null;
      for (const id of allIds) {
        try {
          const result = await deleteDataPoint({
            variables: { instanceId: instance.id, datasetId: dataset.id, dataPointId: id },
          });
          const msgs = result.data?.instanceEditor.datasetEditor.deleteDataPoint?.messages ?? [];
          if (msgs.length > 0) {
            firstError ??= msgs.map((m) => m.message).join('; ');
            break;
          }
        } catch (err) {
          firstError ??= err instanceof Error ? err.message : String(err);
          break;
        }
        setDeleteProgress((prev) => (prev ? { ...prev, current: prev.current + 1 } : prev));
      }

      dropPending();
      setGridSelection(EMPTY_SELECTION);
      setDeleteProgress(null);
      if (firstError) setError(firstError);
      onMutated();
    },
    [deleteDataPoint, instance.id, dataset.id, onMutated]
  );

  // Render order — drives both the columns array and the [col, row] -> colId
  // mapping in getCellContent / onCellEdited.
  const columnIds = useMemo(
    () => [...dataset.dimensions.map((d) => dimColId(d.id)), METRIC_COL, ...years.map(yearColId)],
    [dataset.dimensions, years]
  );

  const columns = useMemo<GridColumn[]>(
    () =>
      columnIds.map((id) => {
        let title = '';
        if (id === METRIC_COL) {
          title = 'Metric';
        } else if (id.startsWith(DIM_COL_PREFIX)) {
          const dim = dataset.dimensions.find((d) => dimColId(d.id) === id);
          title = dim?.name ?? '';
        } else if (id.startsWith(YEAR_COL_PREFIX)) {
          title = id.slice(YEAR_COL_PREFIX.length);
        }
        return {
          id,
          title,
          width: colWidths[id] ?? defaultWidthForCol(id),
        };
      }),
    [columnIds, dataset.dimensions, colWidths]
  );

  // Pin all dim columns + the Metric column. Year columns scroll.
  const freezeColumns = dataset.dimensions.length + 1;

  const getCellContent = useCallback<DataEditorProps['getCellContent']>(
    (cell: Item) => {
      const [col, row] = cell;
      const colId = columnIds[col];
      const gridRow = rows[row];
      if (!colId || !gridRow) {
        return { kind: GridCellKind.Loading, allowOverlay: false } as GridCell;
      }
      if (isYearColId(colId)) {
        const committed = gridRow.cells[colId];
        const baseValue = committed?.type === 'Value' ? committed.value : null;
        const pending = pendingEdits.get(pendingKey(gridRow.id, colId));
        const value = pending ? pending.nextValue : baseValue;
        const themeOverride = pending ? { bgCell: pending.error ? ERROR_BG : DIRTY_BG } : undefined;
        return {
          kind: GridCellKind.Number,
          data: value ?? undefined,
          displayData: formatNumber(value),
          allowOverlay: true,
          readonly: false,
          contentAlign: 'right',
          themeOverride,
        };
      }
      const cellData = gridRow.cells[colId];
      let label = '';
      if (cellData?.type === 'DimensionCategory') {
        label = cellData.label;
      } else if (cellData?.type === 'MetricHeader') {
        // Slim POC: collapse label + unit onto a single line. The original
        // ag-grid version stacked them via a custom cellRenderer.
        label = cellData.unit ? `${cellData.label} (${cellData.unit})` : cellData.label;
      }
      return {
        kind: GridCellKind.Text,
        data: label,
        displayData: label,
        allowOverlay: false,
        readonly: true,
      };
    },
    [columnIds, rows, pendingEdits]
  );

  const onCellContextMenu = useCallback<NonNullable<DataEditorProps['onCellContextMenu']>>(
    (cell, e) => {
      e.preventDefault();
      const [, rowIndex] = cell;
      const gridRow = rows[rowIndex];
      if (!gridRow) return;
      // Glide doesn't expose the underlying MouseEvent's clientX/Y. Stash the
      // row here and let the document-level contextmenu listener pick it up
      // along with the native pointer coords.
      pendingContextRowRef.current = gridRow;
    },
    [rows]
  );

  // Document-level contextmenu listener: handles both initial open and
  // reposition-on-second-right-click. A wrapper-level listener wouldn't fire
  // when the menu's click-away catcher is active; document is reliable.
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const wrapper = gridWrapperRef.current;
      if (!wrapper) return;
      const insideGrid = wrapper.contains(e.target as Node);
      if (insideGrid && pendingContextRowRef.current) {
        e.preventDefault();
        setContextMenu({
          mouseX: e.clientX,
          mouseY: e.clientY,
          row: pendingContextRowRef.current,
        });
        pendingContextRowRef.current = null;
      } else if (!insideGrid) {
        // Right-click anywhere outside the grid dismisses an open menu.
        setContextMenu(null);
      }
    };
    document.addEventListener('contextmenu', handler);
    return () => document.removeEventListener('contextmenu', handler);
  }, []);

  const applyEdit = useCallback(
    (rowIndex: number, colIndex: number, newValue: EditableGridCell) => {
      const colId = columnIds[colIndex];
      const gridRow = rows[rowIndex];
      if (!colId || !gridRow || !isYearColId(colId)) return;
      const committed = gridRow.cells[colId];
      if (committed?.type !== 'Value') return;
      if (newValue.kind !== GridCellKind.Number) return;
      const raw = newValue.data;
      // Reject non-finite (NaN, Infinity) — silently drop, matching the
      // original valueSetter's `return false`.
      if (raw !== undefined && raw !== null && !Number.isFinite(raw)) return;
      const next: number | null = raw ?? null;

      setPendingEdits((prev) => {
        const map = new Map(prev);
        const key = pendingKey(gridRow.id, colId);
        const existing = map.get(key);
        // Baseline = what was persisted when the user first touched this cell;
        // preserved across keystrokes so a round-trip (A → B → A) clears the
        // pending entry.
        const originalValue = existing ? existing.originalValue : committed.value;
        const year = yearFromColId(colId) ?? committed.year;
        if (next === originalValue) {
          map.delete(key);
        } else {
          map.set(key, {
            rowId: gridRow.id,
            colId,
            year,
            dataPointId: committed.dataPointId,
            nextValue: next,
            originalValue,
          });
        }
        return map;
      });
    },
    [columnIds, rows]
  );

  const onCellEdited = useCallback<NonNullable<DataEditorProps['onCellEdited']>>(
    (cell, newValue) => {
      applyEdit(cell[1], cell[0], newValue);
    },
    [applyEdit]
  );

  const onCellsEdited = useCallback<NonNullable<DataEditorProps['onCellsEdited']>>(
    (items) => {
      for (const item of items) {
        applyEdit(item.location[1], item.location[0], item.value);
      }
      return true;
    },
    [applyEdit]
  );

  const onColumnResize = useCallback<NonNullable<DataEditorProps['onColumnResize']>>(
    (column, newSize) => {
      if (!column.id) return;
      setColWidths((prev) => ({ ...prev, [column.id as string]: newSize }));
    },
    []
  );

  const handleDiscard = useCallback(() => {
    setPendingEdits(new Map());
  }, []);

  const handleSave = useCallback(async () => {
    if (pendingEdits.size === 0 || saving) return;
    setSaving(true);

    const baseVars = { instanceId: instance.id, datasetId: dataset.id };
    const queued = [...pendingEdits];

    const clearPending = (key: string) => {
      setPendingEdits((prev) => {
        if (!prev.has(key)) return prev;
        const next = new Map(prev);
        next.delete(key);
        return next;
      });
    };
    const markFailure = (key: string, edit: PendingEdit, errorMsg: string) => {
      setPendingEdits((prev) => {
        const next = new Map(prev);
        next.set(key, { ...edit, error: errorMsg });
        return next;
      });
    };

    let failureCount = 0;
    let unexpected: string | null = null;

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

  const pendingCount = pendingEdits.size;
  const hasPending = pendingCount > 0;
  const selectedRowCount = gridSelection.rows.length;

  const handleDeleteSelected = useCallback(() => {
    const indices = gridSelection.rows.toArray();
    const targets = indices.map((i) => rows[i]).filter((r): r is GridRow => !!r);
    if (targets.length === 0) return;
    void handleDeleteRows(targets);
  }, [gridSelection, rows, handleDeleteRows]);

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
        {selectedRowCount > 0 && (
          <Button
            size="small"
            color="error"
            variant="outlined"
            startIcon={<Trash />}
            onClick={handleDeleteSelected}
            disabled={deleteProgress !== null}
            sx={!hasPending ? { mr: 'auto' } : undefined}
          >
            Delete {selectedRowCount} row{selectedRowCount === 1 ? '' : 's'}
          </Button>
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
      <Box ref={gridWrapperRef} sx={{ flex: 1, minHeight: 0, width: '100%', position: 'relative' }}>
        <DataEditor
          columns={columns}
          rows={rows.length}
          getCellContent={getCellContent}
          onCellEdited={onCellEdited}
          onCellsEdited={onCellsEdited}
          onCellContextMenu={onCellContextMenu}
          onColumnResize={onColumnResize}
          freezeColumns={freezeColumns}
          getCellsForSelection
          gridSelection={gridSelection}
          onGridSelectionChange={setGridSelection}
          rowMarkers="both"
          rowSelectionMode="multi"
          smoothScrollX
          smoothScrollY
          width="100%"
          height="100%"
          rowHeight={38}
          headerHeight={32}
        />
        {deleteProgress !== null && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              bgcolor: 'rgba(255, 255, 255, 0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1,
              // Eat all pointer events so the user can't fire another delete or
              // edit cells while mutations are in flight.
              cursor: 'wait',
            }}
          >
            <Box sx={{ width: '60%', maxWidth: 360 }}>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 0.5, textAlign: 'center' }}
              >
                Deleting {deleteProgress.current} of {deleteProgress.total} data points…
              </Typography>
              <LinearProgress
                variant="determinate"
                value={
                  deleteProgress.total > 0
                    ? (deleteProgress.current / deleteProgress.total) * 100
                    : 0
                }
              />
            </Box>
          </Box>
        )}
      </Box>
      <Popper
        open={contextMenu !== null}
        anchorEl={
          contextMenu !== null
            ? {
                getBoundingClientRect: () =>
                  new DOMRect(contextMenu.mouseX, contextMenu.mouseY, 0, 0),
              }
            : null
        }
        placement="bottom-start"
        sx={{ zIndex: (theme) => theme.zIndex.modal }}
      >
        <ClickAwayListener
          onClickAway={() => setContextMenu(null)}
          // Right-click events also dismiss; the document-level listener above
          // handles repositioning to a new cell when applicable.
          mouseEvent="onMouseDown"
        >
          <Paper elevation={8}>
            <MenuList autoFocus dense>
              <MenuItem disabled>
                <ListItemIcon>
                  <Files />
                </ListItemIcon>
                <ListItemText>Copy</ListItemText>
              </MenuItem>
              <MenuItem disabled>
                <ListItemIcon>
                  <Clipboard />
                </ListItemIcon>
                <ListItemText>Paste</ListItemText>
              </MenuItem>
              <MenuItem disabled>
                <ListItemIcon>
                  <ChatLeft />
                </ListItemIcon>
                <ListItemText>Comment</ListItemText>
              </MenuItem>
              <MenuItem disabled>
                <ListItemIcon>
                  <Database />
                </ListItemIcon>
                <ListItemText>Data source</ListItemText>
              </MenuItem>
            </MenuList>
          </Paper>
        </ClickAwayListener>
      </Popper>
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
      <AddYearDialog
        open={addYearOpen}
        existingYears={years}
        onClose={() => setAddYearOpen(false)}
        onAdd={(year) => {
          setExtraYears((prev) => {
            if (prev.has(year) || years.includes(year)) return prev;
            const next = new Set(prev);
            next.add(year);
            return next;
          });
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
