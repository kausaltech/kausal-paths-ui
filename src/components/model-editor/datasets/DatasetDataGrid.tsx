import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Alert, Box, Snackbar } from '@mui/material';

import {
  CompactSelection,
  DataEditor,
  type DataEditorProps,
  type DataEditorRef,
  type GridCell,
  GridCellKind,
  type GridColumn,
  GridColumnMenuIcon,
  type GridSelection,
  type Item,
  type Rectangle,
} from '@glideapps/glide-data-grid';
import '@glideapps/glide-data-grid/dist/index.css';
import { useLocale, useTranslations } from 'next-intl';

import type { DatasetDetailFieldsFragment } from '@/common/__generated__/graphql';
import { DataPointCommentReviewState } from '@/common/__generated__/graphql';
import { AddRowsModal } from './AddRowsModal';
import { AddYearsModal } from './AddYearsModal';
import { CellContextMenu, ColumnFilterMenu } from './DatasetDataGridMenus';
import { DatasetDataGridProgressOverlay } from './DatasetDataGridProgressOverlay';
import { DatasetDataGridToolbar } from './DatasetDataGridToolbar';
import {
  DELETED_BG,
  DIM_COL_PREFIX,
  DIRTY_BG,
  EMPTY_SELECTION,
  ERROR_BG,
  LABEL_COL_BG,
  MIN_YEAR_AREA,
  NO_CATEGORY,
  ROW_MARKER_WIDTH,
  YEAR_COL_PREFIX,
  defaultWidthForCol,
  filterPinsForDimensions,
  formatNumber,
  isYearColId,
  useEnsurePortal,
  yearFromColId,
} from './DatasetDataGridUtils';
import {
  type GridRow,
  METRIC_COL,
  type PendingEdit,
  type StagedCategory,
  type StagedRow,
  buildGridData,
  dimColId,
  extractYear,
  pendingKey,
  rowKey,
  yearColId,
} from './dataset-grid-data';
import ImportModal from './import/ImportModal';
import { useDatasetImport } from './import/useDatasetImport';
import type { SelectedCell } from './shared';
import { type GridView, useDataPointEditing } from './useDataPointEditing';

type Props = {
  dataset: DatasetDetailFieldsFragment;
  /**
   * Called when an edit / delete mutation completes. May return a promise that
   * resolves once the parent finishes refetching; `handleSave` awaits this so
   * it can defer clearing successful pending edits until the fresh data has
   * landed in the cache (otherwise cells flash to empty between a mutation
   * resolving and the refetch landing).
   */
  onMutated: () => void | Promise<unknown>;
  onSelectedDataPointChange?: (dataPointId: string | null) => void;
  // Reports the identifying details (year / metric / categories / value) of the
  // focused data cell, or null when no data cell is focused. Reported for empty
  // cells too — those have no backing DataPoint, so the details panel shows the
  // chips with a "no value" hint instead of the full per-point sections.
  onSelectedCellChange?: (cell: SelectedCell | null) => void;
  // Bumped by the parent to clear the grid's cell selection (e.g. when the
  // user clicks "Show all" in the comments panel). The initial value is
  // ignored — only subsequent changes trigger a clear.
  clearSelectionNonce?: number;
  // Open the data point details drawer panel (used by the cell context menu's
  // Comment / Data source items, which both act on the focused data point).
  onOpenPanel?: (panel: 'datapoint') => void;
};

export default function DatasetDataGrid({
  dataset,
  onMutated,
  onSelectedDataPointChange,
  onSelectedCellChange,
  clearSelectionNonce,
  onOpenPanel,
}: Props) {
  useEnsurePortal();
  // Collate by the editor interface language for now. Locale-aware so sorting
  // respects language-specific ordering (e.g. German umlauts, Scandinavian
  // å/ä/ö). `numeric` keeps labels like "Zone 2" / "Zone 10" in natural order.
  // TODO: the labels are backend *content* strings, so ideally this should
  // collate by the content locale (the `[lang]` URL segment) rather than the
  // UI language — revisit once content-language sorting is needed.
  const locale = useLocale();
  const t = useTranslations('model-editor');
  const collator = useMemo(
    () => new Intl.Collator(locale, { numeric: true, sensitivity: 'variant' }),
    [locale]
  );
  // Shared edit state. Owned here because cell rendering (getCellContent,
  // drawCell, the sort) reads it every render; the write handlers that mutate
  // it live in `useDataPointEditing`.
  const [pendingEdits, setPendingEdits] = useState<Map<string, PendingEdit>>(() => new Map());
  const [extraYears, setExtraYears] = useState<Set<number>>(() => new Set());
  // Staged (uncommitted) structural additions from an import: new categories to
  // create and the new rows the staged values attach to. Like `pendingEdits`,
  // owned here because buildGridData reads them; written by `useDataPointEditing`.
  const [stagedCategories, setStagedCategories] = useState<StagedCategory[]>([]);
  const [stagedRows, setStagedRows] = useState<StagedRow[]>([]);
  // Committed rows / year columns marked for deletion; their data points are
  // removed on Save. Rendered with the deleted tint until then.
  const [stagedDeletedRowIds, setStagedDeletedRowIds] = useState<Set<string>>(() => new Set());
  const [stagedDeletedYears, setStagedDeletedYears] = useState<Set<number>>(() => new Set());
  const [colWidths, setColWidths] = useState<Record<string, number>>({});
  // Measured width of the grid wrapper. Drives how many columns we can freeze
  // without squeezing the year columns off-screen (see freezeColumns).
  const [availableWidth, setAvailableWidth] = useState(0);
  // Per-column row filter, keyed by colId (METRIC_COL or a dimension column) ->
  // set of allowed values: metricIds for the metric column; category UUIDs (or
  // NO_CATEGORY for the "no category" rows) for dimension columns. Absence of an
  // entry means "no filter on this column" (everything shown).
  const [categoryFilters, setCategoryFilters] = useState<Map<string, Set<string>>>(() => new Map());
  // Open filter menu: which column + the header-cell bounds Glide reports (in
  // client coords) for anchoring the popper.
  const [filterMenu, setFilterMenu] = useState<{ colId: string; bounds: Rectangle } | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
    row: GridRow;
  } | null>(null);
  const [gridSelection, setGridSelection] = useState<GridSelection>(EMPTY_SELECTION);
  const gridWrapperRef = useRef<HTMLDivElement | null>(null);
  const gridRef = useRef<DataEditorRef>(null);
  // Glide's onCellContextMenu fires through the React tree; the document-level
  // listener below reads this ref to combine the row with the native event's
  // clientX/Y. Using a ref (not state) avoids stale closures because both
  // callbacks fire from the same browser event.
  const pendingContextRowRef = useRef<GridRow | null>(null);

  const { rows: baseRows, years } = useMemo(
    () => buildGridData(dataset, extraYears, { categories: stagedCategories, rows: stagedRows }),
    [dataset, extraYears, stagedCategories, stagedRows]
  );

  // Dimensional paste / import. Auto-pins for dimensions the user has filtered
  // to a single category; the importer itself is wired up after the edit hook
  // (it stages into `pendingEdits` rather than mutating directly).
  const filterPins = useMemo(
    () => filterPinsForDimensions(categoryFilters, dataset.dimensions),
    [categoryFilters, dataset.dimensions]
  );
  // Column sort. null = default (metric-grouped) order from buildGridData.
  // Works for year columns (by numeric value) and dimension columns (by
  // category label). Cycles on click: unset -> asc -> desc -> unset.
  const [colSort, setColSort] = useState<{ colId: string; direction: 'asc' | 'desc' } | null>(null);
  const rows = useMemo(() => {
    // 1) Column filter: keep rows whose value in every filtered column is in
    // that column's allowed set (metric column = metricId; dimension column =
    // category UUID, or NO_CATEGORY for the "no category" rows).
    let result = baseRows;
    if (categoryFilters.size > 0) {
      result = result.filter((row) =>
        [...categoryFilters].every(([colId, allowed]) => {
          if (colId === METRIC_COL) return allowed.has(row.metricId);
          const dimId = colId.slice(DIM_COL_PREFIX.length);
          return allowed.has(row.categoryByDim[dimId] ?? NO_CATEGORY);
        })
      );
    }
    // 2) Column sort (operates on the filtered set). Year columns sort by
    // numeric value; dimension columns by category label. Empty cells (no
    // value / no category) always sort to the end regardless of direction.
    if (colSort) {
      const { colId, direction } = colSort;
      const dir = direction === 'asc' ? 1 : -1;
      if (isYearColId(colId)) {
        const valueOf = (row: GridRow): number | null => {
          const pending = pendingEdits.get(pendingKey(row.id, colId));
          if (pending) return pending.nextValue;
          const cell = row.cells[colId];
          return cell?.type === 'Value' ? cell.value : null;
        };
        result = [...result].sort((a, b) => {
          const av = valueOf(a);
          const bv = valueOf(b);
          if (av === null && bv === null) return 0;
          if (av === null) return 1;
          if (bv === null) return -1;
          return (av - bv) * dir;
        });
      } else if (colId.startsWith(DIM_COL_PREFIX)) {
        const labelOf = (row: GridRow): string | null => {
          const cell = row.cells[colId];
          return cell?.type === 'DimensionCategory' && cell.categoryUuid !== null
            ? cell.label
            : null;
        };
        result = [...result].sort((a, b) => {
          const al = labelOf(a);
          const bl = labelOf(b);
          if (al === null && bl === null) return 0;
          if (al === null) return 1;
          if (bl === null) return -1;
          return collator.compare(al, bl) * dir;
        });
      } else if (colId === METRIC_COL) {
        const labelOf = (row: GridRow): string => {
          const cell = row.cells[METRIC_COL];
          return cell?.type === 'MetricHeader' ? cell.label : '';
        };
        result = [...result].sort((a, b) => collator.compare(labelOf(a), labelOf(b)) * dir);
      }
    }
    return result;
  }, [baseRows, categoryFilters, colSort, pendingEdits, collator]);
  const rowById = useMemo(() => new Map(rows.map((r) => [r.id, r])), [rows]);

  // dataPointId -> { count, hasUnresolvedReview }. Drives the corner indicator
  // overlay in drawCell — red when the data point has any unresolved review
  // comment, orange otherwise.
  const commentInfoByDataPointId = useMemo(() => {
    const map = new Map<string, { count: number; hasUnresolvedReview: boolean }>();
    for (const dp of dataset.dataPoints) {
      if (dp.comments.length === 0) continue;
      const hasUnresolvedReview = dp.comments.some(
        (c) => c.isReview && c.reviewState !== DataPointCommentReviewState.Resolved
      );
      map.set(dp.id, { count: dp.comments.length, hasUnresolvedReview });
    }
    return map;
  }, [dataset.dataPoints]);

  // dataPointIds that have at least one DatasetSourceReference attached.
  // Used to underline the value in those cells.
  const dataPointIdsWithSource = useMemo(() => {
    const set = new Set<string>();
    for (const ref of dataset.sourceReferences) {
      if (ref.dataPoint) set.add(ref.dataPoint.id);
    }
    return set;
  }, [dataset.sourceReferences]);

  // Flat list per existing row: [metricId, ...nonNullDimCategoryUuids]. Lets
  // AddRowsModal grey out combinations that would duplicate an existing row.
  // Built from baseRows (not the filtered `rows`) so duplicate detection still
  // accounts for rows hidden by an active category filter.
  const existingCombinations = useMemo<string[][]>(
    () =>
      baseRows.map((r) => [
        r.metricId,
        ...Object.values(r.categoryByDim).filter((v): v is string => v !== null),
      ]),
    [baseRows]
  );

  // Render order — drives both the columns array and the [col, row] -> colId
  // mapping in getCellContent / onCellEdited.
  const columnIds = useMemo(
    () => [...dataset.dimensions.map((d) => dimColId(d.id)), METRIC_COL, ...years.map(yearColId)],
    [dataset.dimensions, years]
  );

  // Clear cell/row/column selection — passed to the write handlers, which call
  // it after a destructive op (the affected rows/columns are gone).
  const onClearSelection = useCallback(() => setGridSelection(EMPTY_SELECTION), []);

  const grid = useMemo<GridView>(
    () => ({ baseRows, years, rows, rowById, columnIds }),
    [baseRows, years, rows, rowById, columnIds]
  );
  const editing = useDataPointEditing({
    dataset,
    grid,
    pendingEdits,
    setPendingEdits,
    setExtraYears,
    stagedCategories,
    setStagedCategories,
    stagedRows,
    setStagedRows,
    stagedDeletedRowIds,
    setStagedDeletedRowIds,
    stagedDeletedYears,
    setStagedDeletedYears,
    onMutated,
    onClearSelection,
  });

  // Dimensional paste: the importer stages its result into the grid's edit
  // state (categories / rows / values) via `stageImport` instead of mutating —
  // the user then reviews the dirty cells and commits with Save changes.
  const importer = useDatasetImport({
    dataset,
    existingYears: years,
    filterPins,
    onStage: editing.stageImport,
  });

  // Staged (uncommitted) structure, used both to tint it like dirty cells and
  // to decide whether there are unsaved changes. Committed years are backed by
  // data points; everything else in `extraYears` is an uncommitted column.
  const committedYears = useMemo(
    () => new Set(dataset.dataPoints.map((dp) => extractYear(dp.date))),
    [dataset.dataPoints]
  );
  const stagedRowIds = useMemo(
    () => new Set(stagedRows.map((r) => rowKey(r.metricId, r.categoryByDim))),
    [stagedRows]
  );
  const uncommittedYears = useMemo(
    () => new Set([...extraYears].filter((y) => !committedYears.has(y))),
    [extraYears, committedYears]
  );

  const columns = useMemo<GridColumn[]>(
    () =>
      columnIds.map((id) => {
        let title = '';
        const isDim = id.startsWith(DIM_COL_PREFIX);
        const isMetric = id === METRIC_COL;
        // The metric column and dimension columns can be sorted and filtered.
        const isFilterable = isDim || isMetric;
        if (isMetric) {
          title = t('datasets-metric');
        } else if (isDim) {
          const dim = dataset.dimensions.find((d) => dimColId(d.id) === id);
          title = dim?.name ?? '';
        } else if (id.startsWith(YEAR_COL_PREFIX)) {
          title = id.slice(YEAR_COL_PREFIX.length);
        }
        // Append the count of allowed values when a filter is active here.
        if (isFilterable) {
          const activeFilter = categoryFilters.get(id);
          if (activeFilter) title = `${title} (${activeFilter.size})`;
        }
        // Sort-direction arrow on the active sort column.
        if (colSort?.colId === id) {
          title = `${title} ${colSort.direction === 'asc' ? '↑' : '↓'}`;
        }
        return {
          id,
          title,
          width: colWidths[id] ?? defaultWidthForCol(id),
          // Filterable columns get a header menu icon that opens the filter
          // (see onHeaderMenuClick).
          ...(isFilterable ? { hasMenu: true, menuIcon: GridColumnMenuIcon.Dots } : {}),
        };
      }),
    [columnIds, dataset.dimensions, colWidths, colSort, categoryFilters, t]
  );

  // Pin dim columns + the Metric column so they stay visible while year
  // columns scroll — but never freeze so many that the year columns get pushed
  // off-screen (Glide can't scroll past frozen columns). Freeze the leftmost
  // pin candidates that fit within the wrapper width while reserving
  // MIN_YEAR_AREA for the scrollable years; on narrow viewports this naturally
  // drops to 0, leaving everything scrollable.
  const freezeColumns = useMemo(() => {
    const maxFreeze = dataset.dimensions.length + 1;
    // Before the first measurement, assume there's room (avoids a flash of
    // unpinned columns on wide screens).
    if (availableWidth === 0) return maxFreeze;
    const budget = availableWidth - ROW_MARKER_WIDTH - MIN_YEAR_AREA;
    let used = 0;
    let count = 0;
    for (let i = 0; i < maxFreeze; i++) {
      const w = colWidths[columnIds[i]] ?? defaultWidthForCol(columnIds[i]);
      if (used + w > budget) break;
      used += w;
      count += 1;
    }
    return count;
  }, [availableWidth, dataset.dimensions.length, columnIds, colWidths]);

  // Summed width of the frozen columns. The freeze boundary (where Glide draws
  // its 1px divider) sits at ROW_MARKER_WIDTH + this — used to position the
  // overlay rule that thickens that divider.
  const frozenWidth = useMemo(() => {
    let w = 0;
    for (let i = 0; i < freezeColumns; i++) {
      w += colWidths[columnIds[i]] ?? defaultWidthForCol(columnIds[i]);
    }
    return w;
  }, [freezeColumns, columnIds, colWidths]);

  const getCellContent = useCallback<DataEditorProps['getCellContent']>(
    (cell: Item) => {
      const [col, row] = cell;
      const colId = columnIds[col];
      const gridRow = rows[row];
      if (!colId || !gridRow) {
        return { kind: GridCellKind.Loading, allowOverlay: false } satisfies GridCell;
      }
      // A cell belongs to staged (uncommitted) structure when its row was added
      // but isn't backed by data yet, or its year column is newly added. Tint
      // those like dirty cells so added rows/years read as "unsaved". Rows /
      // years marked for deletion get a red tint and are read-only.
      const isStagedRow = stagedRowIds.has(gridRow.id);
      const isDeletedRow = stagedDeletedRowIds.has(gridRow.id);
      if (isYearColId(colId)) {
        const committed = gridRow.cells[colId];
        const baseValue = committed?.type === 'Value' ? committed.value : null;
        const pending = pendingEdits.get(pendingKey(gridRow.id, colId));
        const value = pending ? pending.nextValue : baseValue;
        const year = yearFromColId(colId) ?? -1;
        const isDeleted = isDeletedRow || stagedDeletedYears.has(year);
        const isStagedYear = uncommittedYears.has(year);
        // Deletion wins; then pending edits; then staged-add tint.
        const themeOverride = isDeleted
          ? { bgCell: DELETED_BG }
          : pending
            ? { bgCell: pending.error ? ERROR_BG : DIRTY_BG }
            : isStagedRow || isStagedYear
              ? { bgCell: DIRTY_BG }
              : undefined;
        return {
          kind: GridCellKind.Number,
          data: value ?? undefined,
          displayData: formatNumber(value),
          allowOverlay: !isDeleted,
          // Don't let the user edit a cell that's about to be deleted.
          readonly: isDeleted,
          contentAlign: 'right',
          themeOverride,
        };
      }
      const cellData = gridRow.cells[colId];
      let label = '';
      if (cellData?.type === 'DimensionCategory') {
        label = cellData.label;
      } else if (cellData?.type === 'MetricHeader') {
        // Collapse label + unit onto a single line. Glide's text cell is
        // single-line; stacking them would need a custom canvas renderer.
        label = cellData.unit ? `${cellData.label} (${cellData.unit})` : cellData.label;
      }
      return {
        kind: GridCellKind.Text,
        data: label,
        displayData: label,
        allowOverlay: false,
        readonly: true,
        // Deleted rows tint red; staged rows tint dirty — both span the whole
        // row (label cells included) so the row reads as deleted / new.
        themeOverride: {
          bgCell: isDeletedRow ? DELETED_BG : isStagedRow ? DIRTY_BG : LABEL_COL_BG,
        },
      };
    },
    [
      columnIds,
      rows,
      pendingEdits,
      stagedRowIds,
      uncommittedYears,
      stagedDeletedRowIds,
      stagedDeletedYears,
    ]
  );

  const onCellContextMenu = useCallback<NonNullable<DataEditorProps['onCellContextMenu']>>(
    (cell, e) => {
      e.preventDefault();
      const [colIdx, rowIndex] = cell;
      const colId = columnIds[colIdx];
      const gridRow = rows[rowIndex];
      if (!gridRow || !colId) return;
      // Read-only cells (dim columns and the Metric column) have no useful
      // context-menu actions — copy/paste isn't supported there and
      // comments/data sources hang off year-cell DataPoints. Suppress the
      // menu entirely and close any open menu from a previous click.
      if (!isYearColId(colId)) {
        setContextMenu(null);
        return;
      }
      // Glide doesn't expose the underlying MouseEvent's clientX/Y. Stash the
      // row here and let the document-level contextmenu listener pick it up
      // along with the native pointer coords.
      pendingContextRowRef.current = gridRow;
      // Focus the right-clicked cell so any panel opened from the menu
      // ("Comment", "Data source") knows which data point the user means,
      // and so emit('copy') / emit('paste') target the right cell.
      setGridSelection({
        rows: CompactSelection.empty(),
        columns: CompactSelection.empty(),
        current: {
          cell,
          range: { x: colIdx, y: rowIndex, width: 1, height: 1 },
          rangeStack: [],
        },
      });
    },
    [columnIds, rows]
  );

  const onHeaderContextMenu = useCallback<NonNullable<DataEditorProps['onHeaderContextMenu']>>(
    (colIndex, e) => {
      e.preventDefault();
      // Mirror left-click highlight behaviour — right-clicking a header also
      // selects the column. No header context menu for now; we just suppress
      // the browser's native menu and update the selection.
      setGridSelection({
        rows: CompactSelection.empty(),
        columns: CompactSelection.fromSingleSelection(colIndex),
      });
    },
    []
  );

  // Click a year- or dimension-column header to sort rows by that column
  // (year = numeric value, dimension = category label). Cycles asc -> desc ->
  // unset on repeated clicks of the same column; jumping to a different column
  // resets to asc. Selection is cleared so the user doesn't end up with a
  // highlight on a row that shifted under them. (The dimension header's dots
  // icon opens the filter instead — that's onHeaderMenuClick, not this.)
  const onHeaderClicked = useCallback<NonNullable<DataEditorProps['onHeaderClicked']>>(
    (colIndex) => {
      const colId = columnIds[colIndex];
      if (
        !colId ||
        (!isYearColId(colId) && !colId.startsWith(DIM_COL_PREFIX) && colId !== METRIC_COL)
      )
        return;
      setColSort((prev) => {
        if (!prev || prev.colId !== colId) return { colId, direction: 'asc' };
        if (prev.direction === 'asc') return { colId, direction: 'desc' };
        return null;
      });
      setGridSelection(EMPTY_SELECTION);
    },
    [columnIds]
  );

  // Open the filter menu when a filterable column's (metric or dimension)
  // header menu icon is clicked. `bounds` is the header cell rect in client
  // coords.
  const onHeaderMenuClick = useCallback<NonNullable<DataEditorProps['onHeaderMenuClick']>>(
    (colIndex, bounds) => {
      const colId = columnIds[colIndex];
      if (!colId || (colId !== METRIC_COL && !colId.startsWith(DIM_COL_PREFIX))) return;
      setFilterMenu({ colId, bounds });
    },
    [columnIds]
  );

  // Toggle one value in a column's filter. allKeys lets us collapse the filter
  // back to "none" (show all) when every value ends up selected.
  const toggleCategoryFilter = useCallback((colId: string, key: string, allKeys: string[]) => {
    setCategoryFilters((prev) => {
      const next = new Map(prev);
      // Absent entry means all values are currently allowed.
      const set = new Set(next.get(colId) ?? allKeys);
      if (set.has(key)) set.delete(key);
      else set.add(key);
      if (set.size >= allKeys.length) next.delete(colId);
      else next.set(colId, set);
      return next;
    });
    // Row indices shift under the filter; drop any stale selection.
    setGridSelection(EMPTY_SELECTION);
  }, []);

  const clearCategoryFilter = useCallback((colId: string) => {
    setCategoryFilters((prev) => {
      if (!prev.has(colId)) return prev;
      const next = new Map(prev);
      next.delete(colId);
      return next;
    });
    setGridSelection(EMPTY_SELECTION);
  }, []);

  // Selectable options for the open filter menu, listing only values actually
  // present in this dataset (in column order): metrics for the metric column,
  // categories (+ a "no category" entry) for a dimension column.
  const filterMenuOptions = useMemo(() => {
    const empty = [] as { key: string; label: string }[];
    if (!filterMenu) return empty;
    const { colId } = filterMenu;
    if (colId === METRIC_COL) {
      const present = new Set(baseRows.map((r) => r.metricId));
      return dataset.metrics
        .filter((m) => present.has(m.id))
        .map((m) => ({ key: m.id, label: m.label }));
    }
    if (colId.startsWith(DIM_COL_PREFIX)) {
      const dimId = colId.slice(DIM_COL_PREFIX.length);
      const dim = dataset.dimensions.find((d) => d.id === dimId);
      if (!dim) return empty;
      const present = new Set<string>();
      let hasNull = false;
      for (const r of baseRows) {
        const cat = r.categoryByDim[dimId];
        if (cat == null) hasNull = true;
        else present.add(cat);
      }
      const opts = dim.categories
        .filter((c) => present.has(c.uuid))
        .map((c) => ({ key: c.uuid, label: c.label }));
      if (hasNull) opts.push({ key: NO_CATEGORY, label: '(No category)' });
      return opts;
    }
    return empty;
  }, [filterMenu, baseRows, dataset.metrics, dataset.dimensions]);

  // Document-level contextmenu listener: handles both initial open and
  // reposition-on-second-right-click. A wrapper-level listener wouldn't fire
  // when the menu's click-away catcher is active; document is reliable.
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const wrapper = gridWrapperRef.current;
      if (!wrapper) return;
      const insideGrid = wrapper.contains(e.target as Node);
      const row = pendingContextRowRef.current;
      if (insideGrid && row !== null) {
        e.preventDefault();
        setContextMenu({ row, mouseX: e.clientX, mouseY: e.clientY });
        pendingContextRowRef.current = null;
      } else if (!insideGrid) {
        // Right-click anywhere outside the grid dismisses an open menu.
        setContextMenu(null);
      }
    };
    document.addEventListener('contextmenu', handler);
    return () => document.removeEventListener('contextmenu', handler);
  }, []);

  // Track the grid wrapper's width so freezeColumns can adapt to the viewport.
  useEffect(() => {
    const el = gridWrapperRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      setAvailableWidth(entries[0]?.contentRect.width ?? 0);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const onCellEdited = useCallback<NonNullable<DataEditorProps['onCellEdited']>>(
    (cell, newValue) => {
      editing.applyEdit(cell[1], cell[0], newValue);
    },
    [editing]
  );

  const onCellsEdited = useCallback<NonNullable<DataEditorProps['onCellsEdited']>>(
    (items) => {
      for (const item of items) {
        editing.applyEdit(item.location[1], item.location[0], item.value);
      }
      return true;
    },
    [editing]
  );

  // Multi-cell paste: Glide's default for Number cells doesn't handle
  // locale-formatted strings ("1,234.56" / "1234,56") or empty cells; coerce
  // here so pasted spreadsheet ranges land cleanly. Non-Number targets fall
  // through to `applyEdit`'s guards (dim/Metric columns are read-only).
  const coercePasteValue = useCallback<NonNullable<DataEditorProps['coercePasteValue']>>(
    (val, cell) => {
      if (cell.kind !== GridCellKind.Number) return undefined;
      const stripped = val.trim().replace(/\s/g, '');
      if (stripped === '') {
        return { ...cell, data: undefined, displayData: '' };
      }
      const hasComma = stripped.includes(',');
      const hasDot = stripped.includes('.');
      let normalised: string;
      if (hasComma && hasDot) {
        // Rightmost separator is the decimal; the other is thousands.
        if (stripped.lastIndexOf('.') > stripped.lastIndexOf(',')) {
          normalised = stripped.replace(/,/g, '');
        } else {
          normalised = stripped.replace(/\./g, '').replace(',', '.');
        }
      } else if (hasComma) {
        // Ambiguous: "1,500" could be thousands or decimal. Treat as
        // thousands only when the whole string is groups-of-three
        // (e.g. "1,500", "1,500,000"); otherwise treat as decimal ("1,5").
        normalised = /^-?\d{1,3}(,\d{3})+$/.test(stripped)
          ? stripped.replace(/,/g, '')
          : stripped.replace(',', '.');
      } else {
        normalised = stripped;
      }
      const num = Number(normalised);
      if (!Number.isFinite(num)) return undefined;
      return { ...cell, data: num, displayData: formatNumber(num) };
    },
    []
  );

  const onColumnResize = useCallback<NonNullable<DataEditorProps['onColumnResize']>>(
    (column, newSize) => {
      if (!column.id) return;
      setColWidths((prev) => ({ ...prev, [column.id as string]: newSize }));
    },
    []
  );

  // Resolve the focused cell into the identifying details the panel renders.
  // `dataPointId` is the backing DataPoint id, or null for an uninitiated cell
  // (a year cell with no DataPoint yet). `cell` carries the year / metric /
  // category labels (built from the row's already-computed cells) for any
  // focused data cell — empty or filled — and is null for read-only
  // dimension/metric cells or when nothing is selected.
  const selection = useMemo<{ dataPointId: string | null; cell: SelectedCell | null }>(() => {
    const sel = gridSelection.current?.cell;
    if (!sel) return { dataPointId: null, cell: null };
    const [col, rowIndex] = sel;
    const colId = columnIds[col];
    const gridRow = rows[rowIndex];
    if (!colId || !gridRow || !isYearColId(colId)) return { dataPointId: null, cell: null };
    const cellData = gridRow.cells[colId];
    if (cellData?.type !== 'Value') return { dataPointId: null, cell: null };
    const metricCell = gridRow.cells[METRIC_COL];
    // Skip dimensions with no category (the "—" cells), matching the chips
    // shown for a resolved data point.
    const categoryLabels: string[] = [];
    for (const dim of dataset.dimensions) {
      const dimCell = gridRow.cells[dimColId(dim.id)];
      if (dimCell?.type === 'DimensionCategory' && dimCell.categoryUuid !== null) {
        categoryLabels.push(dimCell.label);
      }
    }
    const cell: SelectedCell = {
      year: cellData.year,
      metricLabel: metricCell?.type === 'MetricHeader' ? metricCell.label : gridRow.metricId,
      metricUnit: metricCell?.type === 'MetricHeader' ? metricCell.unit : '',
      categoryLabels,
      value: cellData.value,
    };
    return { dataPointId: cellData.dataPointId, cell };
  }, [gridSelection, columnIds, rows, dataset.dimensions]);
  const { dataPointId: selectedDataPointId, cell: selectedCell } = selection;

  useEffect(() => {
    onSelectedDataPointChange?.(selectedDataPointId);
  }, [selectedDataPointId, onSelectedDataPointChange]);

  useEffect(() => {
    onSelectedCellChange?.(selectedCell);
  }, [selectedCell, onSelectedCellChange]);

  // Drop the cell selection when the parent bumps the nonce. Adjust-state-
  // during-render (React's recommended pattern) rather than an effect: the
  // initial value is captured as `prev`, so only subsequent changes clear.
  const [prevClearNonce, setPrevClearNonce] = useState(clearSelectionNonce);
  if (clearSelectionNonce !== prevClearNonce) {
    setPrevClearNonce(clearSelectionNonce);
    setGridSelection(EMPTY_SELECTION);
  }

  // Overlays decorations on year cells after Glide draws the default content:
  // - corner triangle (red / orange) when comments exist (unresolved vs all)
  // - underline on the rendered value when the DataPoint has a source
  //   reference attached
  const drawCell = useCallback<NonNullable<DataEditorProps['drawCell']>>(
    (args, drawContent) => {
      drawContent();
      const { col, row, ctx, rect } = args;
      const colId = columnIds[col];
      const gridRow = rows[row];
      if (!colId || !gridRow || !isYearColId(colId)) return;
      const cellData = gridRow.cells[colId];
      if (cellData?.type !== 'Value' || cellData.dataPointId === null) return;

      // Source-reference underline. Skip if there's no value to underline
      // (empty cells would underline blank space).
      if (cellData.value !== null && dataPointIdsWithSource.has(cellData.dataPointId)) {
        const text = formatNumber(cellData.value);
        const padding = 8;
        const xRight = rect.x + rect.width - padding;
        const m = ctx.measureText(text);
        const xLeft = Math.max(rect.x + padding, xRight - m.width);
        const yLine = rect.y + rect.height - 9;
        ctx.save();
        ctx.strokeStyle = '#bbbbbb';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(xLeft, yLine);
        ctx.lineTo(xRight, yLine);
        ctx.stroke();
        ctx.restore();
      }

      // Comment indicator triangle.
      const info = commentInfoByDataPointId.get(cellData.dataPointId);
      if (info) {
        const size = 8;
        const x = rect.x + rect.width;
        const y = rect.y;
        ctx.save();
        // Matches the warning.main of the model-editor theme — same hue as
        // the highlighted "needs review" card in the comments panel.
        ctx.fillStyle = info.hasUnresolvedReview ? '#d97706' : '#bbbbbb';
        ctx.beginPath();
        ctx.moveTo(x - size, y);
        ctx.lineTo(x, y);
        ctx.lineTo(x, y + size);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
    },
    [columnIds, rows, commentInfoByDataPointId, dataPointIdsWithSource]
  );

  // "Unsaved changes" spans value edits plus staged structure (added/imported
  // rows and added year columns not yet backed by data). Without this, adding
  // an empty row/year wouldn't enable Save / Discard.
  const pendingCount =
    pendingEdits.size +
    stagedRows.length +
    uncommittedYears.size +
    stagedDeletedRowIds.size +
    stagedDeletedYears.size;
  const hasPending = pendingCount > 0;
  const selectedRowCount = gridSelection.rows.length;

  const selectedYears = useMemo(() => {
    return gridSelection.columns
      .toArray()
      .map((idx) => columnIds[idx])
      .filter((id): id is string => Boolean(id) && isYearColId(id))
      .map((id) => yearFromColId(id))
      .filter((y): y is number => y !== null);
  }, [gridSelection, columnIds]);
  const selectedYearCount = selectedYears.length;

  const handleDeleteSelected = useCallback(() => {
    const indices = gridSelection.rows.toArray();
    const targets = indices.map((i) => rows[i]).filter((r): r is GridRow => !!r);
    if (targets.length === 0) return;
    void editing.handleDeleteRows(targets);
  }, [gridSelection, rows, editing]);

  const handleDeleteSelectedYears = useCallback(() => {
    if (selectedYears.length === 0) return;
    void editing.handleDeleteYears(selectedYears);
  }, [selectedYears, editing]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <DatasetDataGridToolbar
        hasPending={hasPending}
        pendingCount={pendingCount}
        selectedRowCount={selectedRowCount}
        selectedYearCount={selectedYearCount}
        isMutating={editing.isMutating}
        saving={editing.saving}
        disableAddRows={dataset.metrics.length === 0}
        onDeleteSelectedRows={handleDeleteSelected}
        onDeleteSelectedYears={handleDeleteSelectedYears}
        onDiscard={editing.handleDiscard}
        onSave={() => void editing.handleSave()}
        onAddYears={editing.openAddYears}
        onAddRows={editing.openAddRows}
      />
      <Box ref={gridWrapperRef} sx={{ flex: 1, minHeight: 0, width: '100%', position: 'relative' }}>
        <DataEditor
          ref={gridRef}
          columns={columns}
          rows={rows.length}
          getCellContent={getCellContent}
          onCellEdited={onCellEdited}
          onCellsEdited={onCellsEdited}
          coercePasteValue={coercePasteValue}
          // Dimensional pastes (a year-header table) open the import modal;
          // everything else falls through to Glide's positional paste.
          onPaste={importer.onPaste}
          onCellContextMenu={onCellContextMenu}
          onHeaderClicked={onHeaderClicked}
          onHeaderContextMenu={onHeaderContextMenu}
          onHeaderMenuClick={onHeaderMenuClick}
          onColumnResize={onColumnResize}
          drawCell={drawCell}
          freezeColumns={freezeColumns}
          getCellsForSelection
          gridSelection={gridSelection}
          onGridSelectionChange={setGridSelection}
          rowMarkers={{ kind: 'both', width: ROW_MARKER_WIDTH }}
          rowSelectionMode="multi"
          smoothScrollX
          smoothScrollY
          width="100%"
          height="100%"
          rowHeight={38}
          headerHeight={32}
        />
        {/* Thicken the divider at the right edge of the last pinned column.
            Glide draws a fixed 1px line there with no theme knob to widen it,
            so we overlay a 2px rule at the freeze boundary. The boundary is
            fixed regardless of horizontal scroll (frozen columns don't move),
            so a static offset is correct. Hidden when nothing is pinned. */}
        {freezeColumns > 0 && (
          <Box
            aria-hidden
            sx={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: ROW_MARKER_WIDTH + frozenWidth,
              width: '2px',
              bgcolor: 'rgba(0, 0, 0, 0.16)',
              pointerEvents: 'none',
              zIndex: 1,
            }}
          />
        )}
        <DatasetDataGridProgressOverlay saveProgress={editing.saveProgress} />
      </Box>
      <CellContextMenu
        contextMenu={contextMenu}
        gridRef={gridRef}
        onClose={() => setContextMenu(null)}
        onOpenPanel={onOpenPanel}
      />
      <ColumnFilterMenu
        filterMenu={filterMenu}
        categoryFilters={categoryFilters}
        filterMenuOptions={filterMenuOptions}
        onClose={() => setFilterMenu(null)}
        onClearFilter={clearCategoryFilter}
        onToggleFilter={toggleCategoryFilter}
      />
      <AddRowsModal
        open={editing.addRowsOpen}
        onClose={editing.closeAddRows}
        metrics={dataset.metrics}
        dimensions={dataset.dimensions}
        existingCombinations={existingCombinations}
        onAdd={(selectedMetricIds, newRows) => editing.handleAddRows(selectedMetricIds, newRows)}
      />
      <AddYearsModal
        open={editing.addYearsOpen}
        existingYears={years}
        onClose={editing.closeAddYears}
        onAddYears={(newYears) => editing.handleAddYears(newYears)}
      />
      <ImportModal
        key={importer.modalProps.matrix?.map((row) => row.join('\t')).join('\n') ?? 'empty'}
        {...importer.modalProps}
      />
      <Snackbar
        open={editing.error !== null}
        autoHideDuration={5000}
        onClose={() => editing.setError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="error" onClose={() => editing.setError(null)}>
          {editing.error}
        </Alert>
      </Snackbar>
    </Box>
  );
}
