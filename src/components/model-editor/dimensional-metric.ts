/**
 * Client-side representation of a DimensionalMetric data cube.
 *
 * Ported from kausal-extensions. This is a standalone implementation used
 * by the model editor's MetricDataViewer. The main app has its own
 * DimensionalMetric class in src/data/metric.ts — the two should be
 * consolidated in the future.
 */
import type {
  ModelEditorDimensionalMetricFieldsFragment,
  ModelEditorMetricCategoryFieldsFragment,
  ModelEditorMetricDimensionFieldsFragment,
} from '@/common/__generated__/graphql';

export type { DimensionKind } from '@/common/__generated__/graphql';

export type MetricCategoryGroup = ModelEditorMetricDimensionFieldsFragment['groups'][number];
export type MetricCategory = ModelEditorMetricCategoryFieldsFragment;
export type MetricDimension = ModelEditorMetricDimensionFieldsFragment;
export type MetricUnit = ModelEditorDimensionalMetricFieldsFragment['unit'];
export type GoalEntry = ModelEditorDimensionalMetricFieldsFragment['goals'][number];
export type DimensionalMetricData = ModelEditorDimensionalMetricFieldsFragment;

export type CubeRow = {
  categories: Record<string, string>;
  year: number;
  value: number;
};

export type TimeSeries = {
  years: number[];
  values: number[];
  forecastFrom: number | null;
};

export class DimensionalMetric {
  readonly id: string;
  readonly name: string;
  readonly unit: MetricUnit;
  readonly dimensions: readonly MetricDimension[];
  readonly years: readonly number[];
  readonly stackable: boolean;
  readonly forecastFrom: number | null;
  readonly goals: readonly GoalEntry[];

  private readonly values: Float64Array;
  private readonly strides: number[];
  private readonly dimAxisIndex: Map<string, number>;
  private readonly catIndexMaps: Map<string, Map<string, number>>;

  constructor(data: DimensionalMetricData) {
    this.id = data.id;
    this.name = data.name;
    this.unit = data.unit;
    this.dimensions = data.dimensions;
    this.years = data.years;
    this.stackable = data.stackable;
    this.forecastFrom = data.forecastFrom ?? null;
    this.goals = data.goals;

    this.dimAxisIndex = new Map(data.dimensions.map((d, i) => [d.id, i]));
    this.catIndexMaps = new Map(
      data.dimensions.map((d) => [d.id, new Map(d.categories.map((c, ci) => [c.id, ci]))])
    );

    const sizes = [...data.dimensions.map((d) => d.categories.length), data.years.length];
    this.strides = new Array<number>(sizes.length);
    let stride = 1;
    for (let i = sizes.length - 1; i >= 0; i--) {
      this.strides[i] = stride;
      stride *= sizes[i];
    }

    const expectedLen = stride;
    if (data.values.length !== expectedLen) {
      console.warn(
        `DimensionalMetric "${data.id}": expected ${expectedLen} values, got ${data.values.length}`
      );
    }
    this.values = new Float64Array(data.values);
  }

  get size(): number {
    return this.values.length;
  }

  get ndim(): number {
    return this.dimensions.length;
  }

  getDimension(dimId: string): MetricDimension | undefined {
    return this.dimensions.find((d) => d.id === dimId);
  }

  private toData(dimensions: readonly MetricDimension[], values: number[]): DimensionalMetricData {
    return {
      __typename: 'DimensionalMetricType',
      id: this.id,
      name: this.name,
      unit: this.unit,
      dimensions: [...dimensions],
      years: [...this.years],
      values,
      stackable: this.stackable,
      forecastFrom: this.forecastFrom,
      goals: [...this.goals],
    };
  }

  private flatIndex(catIds: Record<string, string>, yearIndex: number): number {
    let idx = 0;
    for (const dim of this.dimensions) {
      const catMap = this.catIndexMaps.get(dim.id)!;
      const catIdx = catMap.get(catIds[dim.id]);
      if (catIdx === undefined) {
        throw new Error(`Unknown category "${catIds[dim.id]}" for dimension "${dim.id}"`);
      }
      idx += catIdx * this.strides[this.dimAxisIndex.get(dim.id)!];
    }
    idx += yearIndex * this.strides[this.strides.length - 1];
    return idx;
  }

  getValue(categories: Record<string, string>, year: number): number {
    const yearIdx = this.years.indexOf(year);
    if (yearIdx === -1) throw new Error(`Year ${year} not found`);
    return this.values[this.flatIndex(categories, yearIdx)];
  }

  getSeries(categories: Record<string, string>): TimeSeries {
    const values = new Array<number>(this.years.length);
    for (let yi = 0; yi < this.years.length; yi++) {
      values[yi] = this.values[this.flatIndex(categories, yi)];
    }
    return {
      years: [...this.years],
      values,
      forecastFrom: this.forecastFrom,
    };
  }

  *rows(): Generator<CubeRow> {
    const dimCount = this.dimensions.length;
    const catIndices = new Array<number>(dimCount).fill(0);
    const catSizes = this.dimensions.map((d) => d.categories.length);
    const yearCount = this.years.length;
    let flatIdx = 0;

    const buildCategories = (): Record<string, string> => {
      const cats: Record<string, string> = {};
      for (let d = 0; d < dimCount; d++) {
        cats[this.dimensions[d].id] = this.dimensions[d].categories[catIndices[d]].id;
      }
      return cats;
    };

    const totalCombinations = this.values.length / yearCount;
    for (let combo = 0; combo < totalCombinations; combo++) {
      const categories = buildCategories();
      for (let yi = 0; yi < yearCount; yi++) {
        yield { categories, year: this.years[yi], value: this.values[flatIdx++] };
      }
      for (let d = dimCount - 1; d >= 0; d--) {
        catIndices[d]++;
        if (catIndices[d] < catSizes[d]) break;
        catIndices[d] = 0;
      }
    }
  }

  filter(dimId: string, keepCategoryIds: string[]): DimensionalMetric {
    const dim = this.getDimension(dimId);
    if (!dim) throw new Error(`Dimension "${dimId}" not found`);

    const keepSet = new Set(keepCategoryIds);
    const keptCategories = dim.categories.filter((c) => keepSet.has(c.id));
    if (keptCategories.length === 0) {
      throw new Error(`No categories matched in dimension "${dimId}"`);
    }

    const newDimensions = this.dimensions.map((d) =>
      d.id === dimId ? { ...d, categories: keptCategories } : d
    );

    const newValues: number[] = [];
    for (const row of this.rows()) {
      if (keepSet.has(row.categories[dimId])) {
        newValues.push(row.value);
      }
    }

    return new DimensionalMetric(this.toData(newDimensions, newValues));
  }

  sumOver(dimId: string): DimensionalMetric {
    const dim = this.getDimension(dimId);
    if (!dim) throw new Error(`Dimension "${dimId}" not found`);

    const newDimensions = this.dimensions.filter((d) => d.id !== dimId);
    const yearCount = this.years.length;

    const accum = new Map<string, number>();

    for (const row of this.rows()) {
      const keyParts: string[] = [];
      for (const d of newDimensions) {
        keyParts.push(row.categories[d.id]);
      }
      keyParts.push(String(row.year));
      const key = keyParts.join('\0');
      accum.set(key, (accum.get(key) ?? 0) + row.value);
    }

    const newValues: number[] = [];
    const newCatSizes = newDimensions.map((d) => d.categories.length);
    const catIndices = new Array<number>(newDimensions.length).fill(0);

    const totalCombinations = newCatSizes.reduce((a, b) => a * b, 1) || 1;
    for (let combo = 0; combo < totalCombinations; combo++) {
      const keyParts: string[] = [];
      for (let d = 0; d < newDimensions.length; d++) {
        keyParts.push(newDimensions[d].categories[catIndices[d]].id);
      }
      for (let yi = 0; yi < yearCount; yi++) {
        const key = [...keyParts, String(this.years[yi])].join('\0');
        newValues.push(accum.get(key) ?? 0);
      }
      for (let d = newDimensions.length - 1; d >= 0; d--) {
        catIndices[d]++;
        if (catIndices[d] < newCatSizes[d]) break;
        catIndices[d] = 0;
      }
    }

    return new DimensionalMetric(this.toData(newDimensions, newValues));
  }

  toRows(): Record<string, string | number>[] {
    const result: Record<string, string | number>[] = [];
    for (const row of this.rows()) {
      result.push({ ...row.categories, year: row.year, value: row.value });
    }
    return result;
  }

  toPivotRows(pivotDimId: string): {
    years: number[];
    columns: MetricCategory[];
    rows: Record<string, number>[];
  } {
    const dim = this.getDimension(pivotDimId);
    if (!dim) throw new Error(`Dimension "${pivotDimId}" not found`);

    const cube = this.dimensions
      .filter((d) => d.id !== pivotDimId)
      .reduce<DimensionalMetric>((acc, d) => acc.sumOver(d.id), this);

    const rows: Record<string, number>[] = [];
    for (let yi = 0; yi < cube.years.length; yi++) {
      const row: Record<string, number> = { year: cube.years[yi] };
      for (const cat of dim.categories) {
        row[cat.id] = cube.getValue({ [pivotDimId]: cat.id }, cube.years[yi]);
      }
      rows.push(row);
    }

    return { years: [...cube.years], columns: dim.categories, rows };
  }
}
