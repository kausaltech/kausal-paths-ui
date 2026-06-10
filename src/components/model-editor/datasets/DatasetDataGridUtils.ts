import { useEffect } from 'react';

import { CompactSelection, type GridSelection } from '@glideapps/glide-data-grid';

import { METRIC_COL } from './dataset-grid-data';

// Solid colour approximations of the original rgba tints — canvas doesn't
// composite the alpha against the row background the same way CSS does, so we
// pre-mix against white.
export const DIRTY_BG = '#fce8d4';
export const ERROR_BG = '#fbe1e1';
// Background for rows / year columns staged for deletion (a muted red, distinct
// from the brighter ERROR_BG used for failed edits).
export const DELETED_BG = '#f3d4d4';
// Background for the read-only dimension/metric label columns, distinguishing
// them from the editable (white) data cells.
export const LABEL_COL_BG = '#f5f5f5';

export const EMPTY_SELECTION: GridSelection = {
  columns: CompactSelection.empty(),
  rows: CompactSelection.empty(),
};

export const DEFAULT_DIM_WIDTH = 120;
export const DEFAULT_METRIC_WIDTH = 100;
export const DEFAULT_YEAR_WIDTH = 84;

// Always keep at least this much horizontal space available for the scrollable
// year columns, even when many dimension/metric columns would be pinned. Glide
// can't scroll past frozen columns, so without this budget the year data
// becomes unreachable on narrow viewports.
export const MIN_YEAR_AREA = DEFAULT_YEAR_WIDTH * 2;
// Width of the left-hand row-marker column (rowMarkers="both"). Pinned via the
// `rowMarkerWidth` prop (rather than Glide's row-count-dependent default) so we
// can compute the exact x of the freeze boundary for the divider overlay.
export const ROW_MARKER_WIDTH = 44;

export const YEAR_COL_PREFIX = 'col_year_';
export const DIM_COL_PREFIX = 'col_dim_';

// Sentinel filter key for rows with no category in a given dimension (the "—"
// cells). A real UUID can never collide with this.
export const NO_CATEGORY = 'no-category';

export function formatNumber(value: number | null | undefined): string {
  if (value == null) return '';
  return value.toLocaleString(undefined, { maximumFractionDigits: 6 });
}

export function defaultWidthForCol(colId: string): number {
  if (colId === METRIC_COL) return DEFAULT_METRIC_WIDTH;
  if (colId.startsWith(YEAR_COL_PREFIX)) return DEFAULT_YEAR_WIDTH;
  return DEFAULT_DIM_WIDTH;
}

export function isYearColId(colId: string): boolean {
  return colId.startsWith(YEAR_COL_PREFIX);
}

// Glide's overlay editor portals into `#portal`. Mount one if missing so the
// number-cell editor opens; left in place across unmounts so multiple grids
// (or remounts) share a single portal node.
export function useEnsurePortal() {
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

export function yearFromColId(colId: string): number | null {
  const m = /^col_year_(\d+)$/.exec(colId);
  return m ? Number(m[1]) : null;
}

// Derive single-value category-filter pins for the importer: a dimension whose
// active filter narrows the view to exactly one real category becomes a pin for
// data the paste doesn't mention (e.g. the sector when only "Private Haushalte"
// is shown). Multi-value filters, the "no category" sentinel, and unfiltered
// dimensions yield no pin (the importer asks instead). Returns dimId -> uuid.
export function filterPinsForDimensions(
  categoryFilters: ReadonlyMap<string, ReadonlySet<string>>,
  dimensions: readonly { id: string }[]
): Record<string, string> {
  const pins: Record<string, string> = {};
  for (const dim of dimensions) {
    const allowed = categoryFilters.get(`${DIM_COL_PREFIX}${dim.id}`);
    if (!allowed || allowed.size !== 1) continue;
    const [only] = allowed;
    if (only !== NO_CATEGORY) pins[dim.id] = only;
  }
  return pins;
}
