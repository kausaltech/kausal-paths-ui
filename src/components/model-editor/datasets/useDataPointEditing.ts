import { type Dispatch, type SetStateAction, useCallback, useMemo, useState } from 'react';

import { useMutation } from '@apollo/client/react';
import { type EditableGridCell, GridCellKind } from '@glideapps/glide-data-grid';

import type {
  CreateDataPointMutation,
  CreateDataPointMutationVariables,
  CreateDimensionCategoriesMutation,
  CreateDimensionCategoriesMutationVariables,
  CreateDimensionCategoryInput,
  DatasetDetailFieldsFragment,
  DeleteDataPointMutation,
  DeleteDataPointMutationVariables,
  UpdateDataPointMutation,
  UpdateDataPointMutationVariables,
} from '@/common/__generated__/graphql';
import { useInstance } from '@/common/instance';
import { CREATE_DIMENSION_CATEGORIES } from '../dimensions/queries';
import type { AddProgress } from './AddRowsModal';
import { isYearColId, yearFromColId } from './DatasetDataGridUtils';
import { NOT_APPLICABLE } from './DimensionCategoryList';
import {
  type GridRow,
  type ImportStagePayload,
  type PendingEdit,
  type StagedCategory,
  type StagedRow,
  asUpdateInput,
  diffKind,
  extractYear,
  pendingKey,
  rowKey,
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
  /** Staged (uncommitted) new categories from an import; read by buildGridData. */
  stagedCategories: StagedCategory[];
  setStagedCategories: Dispatch<SetStateAction<StagedCategory[]>>;
  /** Staged (uncommitted) new rows from an import or "Add rows"; read by buildGridData. */
  stagedRows: StagedRow[];
  setStagedRows: Dispatch<SetStateAction<StagedRow[]>>;
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
  stagedCategories,
  setStagedCategories,
  stagedRows,
  setStagedRows,
  onMutated,
  onClearSelection,
}: Params) {
  const instance = useInstance();
  const { baseRows, years, rows, rowById, columnIds } = grid;

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveProgress, setSaveProgress] = useState<AddProgress | null>(null);
  const [deleteProgress, setDeleteProgress] = useState<AddProgress | null>(null);
  const [addRowsOpen, setAddRowsOpen] = useState(false);
  const [addYearsOpen, setAddYearsOpen] = useState(false);

  // True whenever a server operation is running. Adding rows/years is now a
  // local staging op (committed via Save), so only saving and deletes count.
  const isMutating = saving || deleteProgress !== null;

  const [createDataPoint] = useMutation<CreateDataPointMutation, CreateDataPointMutationVariables>(
    CREATE_DATA_POINT
  );
  const [updateDataPoint] = useMutation<UpdateDataPointMutation, UpdateDataPointMutationVariables>(
    UPDATE_DATA_POINT
  );
  const [createDimensionCategories] = useMutation<
    CreateDimensionCategoriesMutation,
    CreateDimensionCategoriesMutationVariables
  >(CREATE_DIMENSION_CATEGORIES);
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
    (selectedMetricIds: string[], newRows: string[][]) => {
      if (newRows.length === 0) return;
      const metricIdSet = new Set(selectedMetricIds);
      // Each combo is [metricId, ...categoryUuids] (with NOT_APPLICABLE
      // placeholders for dimensions the row doesn't use). Turn it into a staged
      // row keyed exactly like buildGridData so the empty preview row renders
      // and (once filled or saved) its values / anchor attach to it.
      const staged: StagedRow[] = [];
      for (const combo of newRows) {
        const metricId = combo.find((id) => metricIdSet.has(id));
        if (!metricId) continue;
        const comboCats = new Set(combo.filter((id) => id !== metricId && id !== NOT_APPLICABLE));
        const categoryByDim: Record<string, string | null> = {};
        for (const dim of dataset.dimensions) {
          categoryByDim[dim.id] = dim.categories.find((c) => comboCats.has(c.uuid))?.uuid ?? null;
        }
        staged.push({ metricId, categoryByDim });
      }
      // Stage as empty preview rows — nothing is written until Save changes.
      setStagedRows((prev) => {
        const seen = new Set(prev.map((r) => rowKey(r.metricId, r.categoryByDim)));
        return [...prev, ...staged.filter((r) => !seen.has(rowKey(r.metricId, r.categoryByDim)))];
      });
      setAddRowsOpen(false);
    },
    [dataset.dimensions, setStagedRows]
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
    (newYears: number[]) => {
      if (newYears.length === 0) return;
      // Stage the columns. They render empty until the user enters values; an
      // added-but-empty year is given a null anchor data point at Save time
      // (see handleSave) so the column persists across a refetch.
      setExtraYears((prev) => {
        const next = new Set(prev);
        for (const y of newYears) next.add(y);
        return next;
      });
    },
    [setExtraYears]
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
    // Drop all uncommitted staging: imported/added categories and rows, plus
    // added year columns. Committed years stay (they're backed by data points,
    // not by `extraYears`), so clearing the set only removes preview-only ones.
    setStagedCategories([]);
    setStagedRows([]);
    setExtraYears(new Set());
  }, [setPendingEdits, setStagedCategories, setStagedRows, setExtraYears]);

  // Merge an import's result into the grid's staged state: new categories /
  // rows render immediately and the values show as pending edits, so the user
  // reviews and commits with the same Save / Discard controls as manual edits.
  const stageImport = useCallback(
    (payload: ImportStagePayload) => {
      setStagedCategories((prev) => {
        const seen = new Set(prev.map((c) => c.uuid));
        return [...prev, ...payload.categories.filter((c) => !seen.has(c.uuid))];
      });
      setStagedRows((prev) => {
        const seen = new Set(prev.map((r) => rowKey(r.metricId, r.categoryByDim)));
        return [
          ...prev,
          ...payload.rows.filter((r) => !seen.has(rowKey(r.metricId, r.categoryByDim))),
        ];
      });
      if (payload.years.length > 0) {
        setExtraYears((prev) => {
          const next = new Set(prev);
          for (const y of payload.years) next.add(y);
          return next;
        });
      }
      setPendingEdits((prev) => {
        const next = new Map(prev);
        for (const edit of payload.edits) {
          // A no-op edit (import value equals the committed value) carries no
          // change; skip so it doesn't show as dirty.
          if (edit.nextValue === edit.originalValue) continue;
          next.set(pendingKey(edit.rowId, edit.colId), edit);
        }
        return next;
      });
    },
    [setStagedCategories, setStagedRows, setExtraYears, setPendingEdits]
  );

  const handleSave = useCallback(async () => {
    if (saving) return;
    // Committed years are backed by data points; everything else in `years`
    // (added / imported columns) is uncommitted and may need an anchor.
    const committedYears = new Set(dataset.dataPoints.map((dp) => extractYear(dp.date)));
    const hasUncommittedYears = years.some((y) => !committedYears.has(y));
    // Run when there's anything to commit: value edits, staged rows, or added
    // year columns (the latter two persist via anchors even with no values).
    if (pendingEdits.size === 0 && stagedRows.length === 0 && !hasUncommittedYears) return;
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

    // Rows / years the user is giving a value this save don't need an anchor —
    // the value create persists them. Derived from intent up front so the save
    // progress total is exact and the anchor list is known before the loop.
    const valueCreateRowIds = new Set<string>();
    const valueCreateYears = new Set<number>();
    for (const [, edit] of queued) {
      if (edit.dataPointId === null && edit.nextValue !== null) {
        valueCreateRowIds.add(edit.rowId);
        valueCreateYears.add(edit.year);
      }
    }

    // Anchor targets: empty staged rows (at the earliest year) and added year
    // columns with no committed data and no value this save get a null-valued
    // data point so the added structure survives the refetch.
    type Anchor = { metricId: string; categoryByDim: Record<string, string | null>; year: number };
    const anchors: Anchor[] = [];
    const anchorSeen = new Set<string>();
    const anchorYear = years.length > 0 ? years[0] : new Date().getUTCFullYear();
    const queueAnchor = (
      metricId: string,
      categoryByDim: Record<string, string | null>,
      year: number
    ) => {
      const k = `${rowKey(metricId, categoryByDim)}|${year}`;
      if (anchorSeen.has(k)) return;
      anchorSeen.add(k);
      anchors.push({ metricId, categoryByDim, year });
    };
    for (const sr of stagedRows) {
      if (valueCreateRowIds.has(rowKey(sr.metricId, sr.categoryByDim))) continue;
      queueAnchor(sr.metricId, sr.categoryByDim, anchorYear);
    }
    const yearAnchorRow = baseRows[0] ?? stagedRows[0] ?? null;
    if (yearAnchorRow) {
      for (const y of years) {
        if (committedYears.has(y) || valueCreateYears.has(y)) continue;
        queueAnchor(yearAnchorRow.metricId, yearAnchorRow.categoryByDim, y);
      }
    }

    // Create any staged (import) categories referenced by a staged row before
    // the data-point loop, so the value creates / anchors below can reference
    // real uuids. All-or-nothing: on failure, abort the save and keep everything
    // staged so the user can fix it and retry. (Every staged row will be
    // persisted via a value or an anchor, so all referenced categories apply.)
    const stagedUuidsInUse = new Set<string>();
    for (const sr of stagedRows) {
      for (const u of Object.values(sr.categoryByDim)) if (u) stagedUuidsInUse.add(u);
    }
    const categoriesToCreate = stagedCategories.filter((c) => stagedUuidsInUse.has(c.uuid));
    if (categoriesToCreate.length > 0) {
      try {
        const result = await createDimensionCategories({
          variables: {
            instanceId: instance.id,
            // The backend rejects explicit `null` on the Maybe[ID] sibling
            // fields, so omit them entirely (append to the end). Mirrors the
            // dimension editor's `addSiblings` handling.
            input: categoriesToCreate.map(
              (c) =>
                ({
                  dimensionId: c.dimensionId,
                  id: c.uuid,
                  label: c.label,
                  identifier: c.identifier,
                }) as CreateDimensionCategoryInput
            ),
          },
        });
        const payload = result.data?.instanceEditor.createDimensionCategories;
        if (payload?.__typename === 'OperationInfo') {
          throw new Error(payload.messages.map((m) => m.message).join('; '));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        setSaving(false);
        return;
      }
    }

    // Saving is one mutation per data point + per anchor (sequential), so drive
    // a determinate progress bar over the combined total. `tick` no-ops when no
    // progress is shown (nothing to do).
    const totalOps = queued.length + anchors.length;
    if (totalOps > 0) setSaveProgress({ current: 0, total: totalOps });
    const tick = () =>
      setSaveProgress((prev) => (prev ? { ...prev, current: prev.current + 1 } : prev));

    for (const [key, edit] of queued) {
      // Tick once per edit up front so the count advances on every path
      // (including the no-op skips below), not just the mutating ones.
      tick();
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

    // Execute the anchors computed up front (null-valued data points that keep
    // empty staged rows / added years alive across the refetch).
    const anchorFailedRowIds = new Set<string>();
    let anchorError: string | null = null;
    for (const a of anchors) {
      tick();
      try {
        const r = await createDataPoint({
          variables: {
            ...baseVars,
            input: {
              date: `${a.year}-01-01`,
              value: null,
              metricId: a.metricId,
              dimensionCategoryIds: Object.values(a.categoryByDim).filter(
                (v): v is string => v !== null
              ),
            },
          },
        });
        const p = r.data?.instanceEditor.datasetEditor.createDataPoint;
        if (p?.__typename === 'OperationInfo') {
          anchorError ??= p.messages.map((m) => m.message).join('; ');
          anchorFailedRowIds.add(rowKey(a.metricId, a.categoryByDim));
        }
      } catch (err) {
        anchorError ??= err instanceof Error ? err.message : String(err);
        anchorFailedRowIds.add(rowKey(a.metricId, a.categoryByDim));
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
      // Staged categories are now created server-side (and will arrive via the
      // refetch); drop them. Keep only the staged rows still referenced by a
      // failed value edit or a failed anchor — succeeded rows come back as real
      // data, so dropping them avoids a phantom row over the refetched one.
      const keptRowIds = new Set<string>(anchorFailedRowIds);
      for (const [, { edit }] of failures) keptRowIds.add(edit.rowId);
      setStagedCategories([]);
      setStagedRows((prev) =>
        prev.filter((r) => keptRowIds.has(rowKey(r.metricId, r.categoryByDim)))
      );
      setSaveProgress(null);
      setSaving(false);
    }

    const failureCount = failures.size;
    if (failureCount > 0) {
      setError(
        unexpected ??
          `Saved with ${failureCount} error${failureCount === 1 ? '' : 's'}. Hover failed cells for details.`
      );
    } else if (anchorError !== null) {
      setError(`Saved, but some added rows/years couldn't be persisted: ${anchorError}`);
    } else if (refetchError !== null) {
      setError(`Saved, but refreshing the data failed: ${refetchError}`);
    }
  }, [
    pendingEdits,
    saving,
    instance.id,
    dataset,
    rowById,
    baseRows,
    years,
    stagedCategories,
    stagedRows,
    createDataPoint,
    updateDataPoint,
    deleteDataPoint,
    createDimensionCategories,
    onMutated,
    setPendingEdits,
    setStagedCategories,
    setStagedRows,
  ]);

  return useMemo(
    () => ({
      // write state
      saving,
      error,
      setError,
      saveProgress,
      deleteProgress,
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
      stageImport,
      // bulk handlers
      handleAddRows,
      handleDeleteRows,
      handleDeleteYears,
      handleAddYears,
    }),
    [
      saving,
      error,
      saveProgress,
      deleteProgress,
      isMutating,
      addRowsOpen,
      addYearsOpen,
      applyEdit,
      handleSave,
      handleDiscard,
      stageImport,
      handleAddRows,
      handleDeleteRows,
      handleDeleteYears,
      handleAddYears,
    ]
  );
}
