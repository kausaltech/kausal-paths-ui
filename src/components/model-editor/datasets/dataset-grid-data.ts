import type {
  DatasetDetailFieldsFragment,
  UpdateDataPointMutationVariables,
} from '@/common/__generated__/graphql';

/**
 * Discriminated cell shape — each column in a row renders one of these. Kept
 * minimal compared to the reference implementation in kausal-extensions;
 * `ComputedValue` / reference tracking are not in scope yet.
 *
 * Dirty-tracking lives in `pendingEdits` on the grid component (keyed by
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
