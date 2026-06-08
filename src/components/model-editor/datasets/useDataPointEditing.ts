import { type Dispatch, type SetStateAction, useCallback, useMemo, useState } from 'react';

import { useMutation } from '@apollo/client/react';
import { type EditableGridCell, GridCellKind } from '@glideapps/glide-data-grid';

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
import type { AddProgress } from './AddRowsModal';
import { isYearColId, yearFromColId } from './DatasetDataGridUtils';
import { NOT_APPLICABLE } from './DimensionCategoryList';
import {
  type GridRow,
  type PendingEdit,
  asUpdateInput,
  diffKind,
  pendingKey,
  yearColId,
} from './dataset-grid-data';
import { CREATE_DATA_POINT, DELETE_DATA_POINT, UPDATE_DATA_POINT } from './queries';

/**
 * The derived grid data the write handlers operate on. Recomputed by the grid
 * component each render from `dataset` + the shared edit state; passed in so the
 * handlers can resolve cell coordinates, anchor rows, and existing data points.
 */
export type GridView = {
  /** Unfiltered rows (used for bulk operations that must span hidden rows). */
  baseRows: GridRow[];
  /** Years currently rendered as columns. */
  years: number[];
  /** Filtered + sorted rows, as the user sees them. */
  rows: GridRow[];
  /** Lookup over the visible rows, by row id. */
  rowById: Map<string, GridRow>;
  /** Column ids in render order. */
  columnIds: string[];
};

type Params = {
  dataset: DatasetDetailFieldsFragment;
  grid: GridView;
  /** Shared pending-edit state, owned by the grid (read by cell rendering). */
  pendingEdits: Map<string, PendingEdit>;
  setPendingEdits: Dispatch<SetStateAction<Map<string, PendingEdit>>>;
  /** Ephemeral year columns not yet backed by data points. */
  setExtraYears: Dispatch<SetStateAction<Set<number>>>;
  /** Refetch the dataset; awaited by `handleSave` before clearing successes. */
  onMutated: () => void | Promise<unknown>;
  /** Clear the grid's cell/row/column selection after a destructive op. */
  onClearSelection: () => void;
};

/**
 * Owns the data-point write path for the dataset grid: the create/update/delete
 * mutations, pending-edit save/discard, and bulk add/delete of rows and years,
 * along with the progress / saving / error state those operations report and the
 * add-rows / add-years modal open state. The grid component keeps the shared
 * `pendingEdits` / `extraYears` state (cell rendering depends on it) and feeds
 * back the derived `grid` view so these handlers can run against current data.
 *
 * Mirrors `useDatasetImport`: orchestration lives here so it doesn't bloat the
 * grid component, which stays focused on presentation.
 */
export function useDataPointEditing({
  dataset,
  grid,
  pendingEdits,
  setPendingEdits,
  setExtraYears,
  onMutated,
  onClearSelection,
}: Params) {
  const instance = useInstance();
  const { baseRows, years, rows, rowById, columnIds } = grid;

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addProgress, setAddProgress] = useState<AddProgress | null>(null);
  const [deleteProgress, setDeleteProgress] = useState<AddProgress | null>(null);
  const [addYearsProgress, setAddYearsProgress] = useState<AddProgress | null>(null);
  const [addRowsOpen, setAddRowsOpen] = useState(false);
  const [addYearsOpen, setAddYearsOpen] = useState(false);

  // True whenever any batch mutation is running. Used to gate toolbar actions
  // that would otherwise let the user start an overlapping operation and race
  // shared state (extraYears, pendingEdits, progress/error).
  const isMutating =
    saving || addProgress !== null || deleteProgress !== null || addYearsProgress !== null;

  const [createDataPoint] = useMutation<CreateDataPointMutation, CreateDataPointMutationVariables>(
    CREATE_DATA_POINT
  );
  const [updateDataPoint] = useMutation<UpdateDataPointMutation, UpdateDataPointMutationVariables>(
    UPDATE_DATA_POINT
  );
  const [deleteDataPoint] = useMutation<DeleteDataPointMutation, DeleteDataPointMutationVariables>(
    DELETE_DATA_POINT,
    {
      // Evict the deleted DataPoint from the normalised cache as soon as the
      // mutation succeeds. Without this, references in `Dataset.dataPoints`
      // can survive until the next refetch returns — which on slow connections
      // makes the grid show stale columns / rows.
      update: (cache, { data }, { variables }) => {
        if (!variables?.dataPointId) return;
        const messages = data?.instanceEditor.datasetEditor.deleteDataPoint?.messages ?? [];
        if (messages.length > 0) return;
        cache.evict({
          id: cache.identify({ __typename: 'DataPoint', id: variables.dataPointId }),
        });
        cache.gc();
      },
    }
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
      setAddRowsOpen(false);
      if (failureCount > 0) {
        setError(firstError ?? `Failed to add ${failureCount} row${failureCount === 1 ? '' : 's'}`);
      }
      void onMutated();
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
      // that no longer exist after the delete. Deferred until after mutations
      // succeed so a failed delete doesn't silently discard unsaved edits on
      // rows that still exist.
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
        onClearSelection();
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

      onClearSelection();
      setDeleteProgress(null);
      if (firstError) {
        setError(firstError);
      } else {
        dropPending();
      }
      void onMutated();
    },
    [deleteDataPoint, instance.id, dataset.id, onMutated, setPendingEdits, onClearSelection]
  );

  const handleDeleteYears = useCallback(
    async (yearsToDelete: number[]) => {
      if (yearsToDelete.length === 0) return;
      const colIds = yearsToDelete.map((y) => yearColId(y));
      const colIdSuffixes = colIds.map((c) => `|${c}`);

      // Iterate baseRows, not the filtered `rows`: deleting a year must remove
      // its data points across every row, including ones hidden by a filter.
      const ids: string[] = [];
      for (const row of baseRows) {
        for (const colId of colIds) {
          const cell = row.cells[colId];
          if (cell?.type === 'Value' && cell.dataPointId !== null) ids.push(cell.dataPointId);
        }
      }

      // Drop pending edits in the affected columns. pendingKey is
      // `${rowId}|${colId}`; rowId can contain `|` itself but never ends with
      // `|col_year_NNNN`, so suffix-match is unambiguous. Deferred until after
      // mutations succeed so a failure doesn't silently discard unsaved edits.
      const dropPendingForYears = () => {
        setPendingEdits((prev) => {
          if (prev.size === 0) return prev;
          const next = new Map(prev);
          for (const key of next.keys()) {
            if (colIdSuffixes.some((s) => key.endsWith(s))) next.delete(key);
          }
          return next;
        });
      };

      // Remove from extraYears regardless of whether DataPoints exist — the
      // user's intent is to remove the columns. Safe to do optimistically:
      // for purely ephemeral years there are no mutations to fail; for years
      // backed by real DataPoints, a failed delete will reintroduce the
      // column via dataset.dataPoints after refetch.
      setExtraYears((prev) => {
        if (prev.size === 0) return prev;
        const next = new Set(prev);
        let changed = false;
        for (const y of yearsToDelete) {
          if (next.delete(y)) changed = true;
        }
        return changed ? next : prev;
      });

      // Clear the column selection — the columns are gone.
      onClearSelection();

      if (ids.length === 0) {
        // Phantom columns (extraYears only): no mutations can fail, so it's
        // safe to drop pending edits in those columns now.
        dropPendingForYears();
        return;
      }

      setDeleteProgress({ current: 0, total: ids.length });
      let firstError: string | null = null;
      for (const id of ids) {
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

      setDeleteProgress(null);
      if (firstError) {
        setError(firstError);
      } else {
        dropPendingForYears();
      }
      void onMutated();
    },
    [
      deleteDataPoint,
      instance.id,
      dataset.id,
      baseRows,
      onMutated,
      setPendingEdits,
      setExtraYears,
      onClearSelection,
    ]
  );

  const handleAddYears = useCallback(
    async (newYears: number[]) => {
      if (newYears.length === 0) return;

      // Update extraYears immediately for visual feedback while mutations are
      // in flight. After refetch, the year is in dataset.dataPoints; the
      // extraYears entry then merges in as a no-op (Set semantics).
      setExtraYears((prev) => {
        const next = new Set(prev);
        for (const y of newYears) next.add(y);
        return next;
      });

      // No rows to anchor against yet — the column is ephemeral until the
      // first row is added (the row's anchor will then create a real
      // DataPoint in some year). Skip mutations. Use baseRows so a category
      // filter that hides every row doesn't block adding a year.
      if (baseRows.length === 0) return;

      const anchorRow = baseRows[0];
      const dimensionCategoryIds = Object.values(anchorRow.categoryByDim).filter(
        (v): v is string => v !== null
      );

      setAddYearsProgress({ current: 0, total: newYears.length });
      let failureCount = 0;
      let firstError: string | null = null;
      const failedYears: number[] = [];

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
            failedYears.push(year);
            firstError ??= payload.messages.map((m) => m.message).join('; ');
          }
        } catch (err) {
          failureCount += 1;
          failedYears.push(year);
          firstError ??= err instanceof Error ? err.message : String(err);
        }
        setAddYearsProgress((prev) => (prev ? { ...prev, current: prev.current + 1 } : prev));
      }

      setAddYearsProgress(null);
      if (failedYears.length > 0) {
        // Roll back the optimistic extraYears entries for years whose anchor
        // DataPoint failed to create — otherwise the column would linger
        // without any backing data until a full reload.
        setExtraYears((prev) => {
          if (prev.size === 0) return prev;
          const next = new Set(prev);
          let changed = false;
          for (const y of failedYears) {
            if (next.delete(y)) changed = true;
          }
          return changed ? next : prev;
        });
      }
      if (failureCount > 0) {
        setError(
          firstError ?? `Failed to add ${failureCount} year${failureCount === 1 ? '' : 's'}`
        );
      }
      void onMutated();
    },
    [createDataPoint, instance.id, dataset.id, baseRows, onMutated, setExtraYears]
  );

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
    [columnIds, rows, setPendingEdits]
  );

  const handleDiscard = useCallback(() => {
    setPendingEdits(new Map());
  }, [setPendingEdits]);

  const handleSave = useCallback(async () => {
    if (pendingEdits.size === 0 || saving) return;
    setSaving(true);

    const baseVars = { instanceId: instance.id, datasetId: dataset.id };
    const queued = [...pendingEdits];

    // Track outcomes locally and defer the pendingEdits update until after
    // the parent refetch lands — clearing a successful pending mid-loop would
    // briefly fall back to stale cache for that cell (empty for creates, old
    // value for updates), causing the values to disappear and re-appear.
    const successKeys: string[] = [];
    const failures = new Map<string, { edit: PendingEdit; error: string }>();
    let unexpected: string | null = null;

    for (const [key, edit] of queued) {
      const row = rowById.get(edit.rowId);
      if (!row) {
        successKeys.push(key);
        continue;
      }
      const kind = diffKind(edit.dataPointId, edit.nextValue);

      try {
        if (kind === 'create') {
          if (edit.nextValue === null) {
            successKeys.push(key);
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
            // Append the new DataPoint to Dataset.dataPoints in the cache so
            // the cell renders the persisted value as soon as the pending
            // entry is dropped — even if the parent refetch (onMutated below)
            // fails. Without this, a transient refetch error would leave the
            // server-saved point absent from the cache, the cell would fall
            // back to empty, and a user re-entry would create a duplicate.
            update: (cache, { data: muData }) => {
              const created = muData?.instanceEditor.datasetEditor.createDataPoint;
              if (created?.__typename !== 'DataPoint') return;
              const datasetCacheId = cache.identify({ __typename: 'Dataset', id: dataset.id });
              const pointCacheId = cache.identify(created);
              if (!datasetCacheId || !pointCacheId) return;
              // CREATE_DATA_POINT returns DataPointFields, which does NOT
              // include `comments`, but the active dataset query reads
              // `dataPoint.comments` for every point. Seed the new point's
              // comments to [] (a brand-new point has none) BEFORE exposing
              // it via Dataset.dataPoints, so any re-render between this
              // cache write and the parent refetch can't read undefined and
              // crash code like `dp.comments.length`. Preserve any existing
              // value as a defensive no-op if a concurrent refetch already
              // populated it.
              cache.modify({
                id: pointCacheId,
                fields: {
                  comments: (existing: readonly { __ref: string }[] | undefined) => existing ?? [],
                },
              });
              cache.modify({
                id: datasetCacheId,
                fields: {
                  dataPoints: (existing: readonly { __ref: string }[] = []) => {
                    // Defensive: skip if Apollo has already attached the ref
                    // (e.g. a concurrent refetch landed first).
                    if (existing.some((r) => r.__ref === pointCacheId)) return existing;
                    return [...existing, { __ref: pointCacheId }];
                  },
                },
              });
            },
          });
          const payload = result.data?.instanceEditor.datasetEditor.createDataPoint;
          if (payload?.__typename === 'OperationInfo') {
            failures.set(key, {
              edit,
              error: payload.messages.map((m) => m.message).join('; '),
            });
          } else {
            successKeys.push(key);
          }
        } else if (kind === 'delete') {
          if (edit.dataPointId === null) {
            successKeys.push(key);
            continue;
          }
          const result = await deleteDataPoint({
            variables: { ...baseVars, dataPointId: edit.dataPointId },
          });
          const msgs = result.data?.instanceEditor.datasetEditor.deleteDataPoint?.messages ?? [];
          if (msgs.length > 0) {
            failures.set(key, { edit, error: msgs.map((m) => m.message).join('; ') });
          } else {
            successKeys.push(key);
          }
        } else {
          if (edit.dataPointId === null) {
            successKeys.push(key);
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
            failures.set(key, {
              edit,
              error: payload.messages.map((m) => m.message).join('; '),
            });
          } else {
            successKeys.push(key);
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        failures.set(key, { edit, error: msg });
        unexpected ??= msg;
      }
    }

    // Wait for the parent to refetch the dataset (so the Apollo cache holds
    // the freshly-saved values) before dropping the pending entries. Then
    // commit successes and failures in a single state update — the cell
    // renderer sees pending → baseValue swap with identical values, no flash.
    // The refetch can reject (transient network/backend error); guard the
    // cleanup in finally so `saving` is always cleared and the grid never
    // gets stuck blocking further saves/discards.
    let refetchError: string | null = null;
    try {
      await onMutated();
    } catch (err) {
      refetchError = err instanceof Error ? err.message : String(err);
    } finally {
      setPendingEdits((prev) => {
        if (successKeys.length === 0 && failures.size === 0) return prev;
        const next = new Map(prev);
        for (const key of successKeys) next.delete(key);
        for (const [key, { edit, error }] of failures) next.set(key, { ...edit, error });
        return next;
      });
      setSaving(false);
    }

    const failureCount = failures.size;
    if (failureCount > 0) {
      setError(
        unexpected ??
          `Saved with ${failureCount} error${failureCount === 1 ? '' : 's'}. Hover failed cells for details.`
      );
    } else if (refetchError !== null) {
      setError(`Saved, but refreshing the data failed: ${refetchError}`);
    }
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
    setPendingEdits,
  ]);

  return useMemo(
    () => ({
      // write state
      saving,
      error,
      setError,
      addProgress,
      deleteProgress,
      addYearsProgress,
      isMutating,
      // add-modal state
      addRowsOpen,
      openAddRows: () => setAddRowsOpen(true),
      closeAddRows: () => setAddRowsOpen(false),
      addYearsOpen,
      openAddYears: () => setAddYearsOpen(true),
      closeAddYears: () => setAddYearsOpen(false),
      // edit handlers
      applyEdit,
      handleSave,
      handleDiscard,
      // bulk handlers
      handleAddRows,
      handleDeleteRows,
      handleDeleteYears,
      handleAddYears,
    }),
    [
      saving,
      error,
      addProgress,
      deleteProgress,
      addYearsProgress,
      isMutating,
      addRowsOpen,
      addYearsOpen,
      applyEdit,
      handleSave,
      handleDiscard,
      handleAddRows,
      handleDeleteRows,
      handleDeleteYears,
      handleAddYears,
    ]
  );
}
