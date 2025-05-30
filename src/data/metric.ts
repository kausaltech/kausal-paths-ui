import type { Font, Style } from 'exceljs';
import dayjs from 'dayjs';
import slugify from 'slugify';

import type { DimensionalMetricFragment } from 'common/__generated__/graphql';
import { type InstanceGoal } from 'common/instance';
import { type DocumentNode, gql } from '@apollo/client';

type CatValue = number | null;

type DimValues = {
  categories: Map<string, CatValue[]>;
};

type Metric = NonNullable<DimensionalMetricFragment>;

type MetricDimensionInput = Metric['dimensions'][0];
type MetricDimension = Omit<MetricDimensionInput, 'groups'> & {
  groupsById: Map<string, MetricCategoryGroup>;
  groups: MetricCategoryGroup[];
};
type MetricDimensionCategory = MetricDimension['categories'][0];
type MetricCategoryGroup = MetricDimensionInput['groups'][0] & {
  categories: MetricDimensionCategory[];
};

type DimCats = {
  [key: string]: MetricDimensionCategory;
};

type MetricRow = {
  year: number;
  value: number | null;
  dimCats: DimCats;
};

type CatOrGroup = MetricDimensionCategory | MetricCategoryGroup;

export type MetricCategory = Partial<CatOrGroup> &
  Pick<CatOrGroup, 'id' | 'label' | 'color' | 'order'>;

export type MetricCategoryValues = {
  category: Readonly<MetricCategory>;
  forecastValues: (number | null)[];
  historicalValues: (number | null)[];
  isNegative: boolean;
  color: string | null;
};

type CatDimChoice = {
  groups: string[] | null;
  categories: string[];
};

type MetricCategoryChoice = {
  [dim: string]: CatDimChoice | undefined;
};

/**
 *
 */
export type SliceConfig = {
  /** The dimension to group/slice by (or `undefined` if we should just sum everything) */
  dimensionId: string | undefined;
  /** Filters for categories (or `{}` if no filtering should be done) */
  categories: MetricCategoryChoice;
};

type MetricSliceInput = {
  historicalYears: number[];
  forecastYears: number[];
  categoryValues: MetricCategoryValues[];
  totalValues: MetricCategoryValues | null;
  dimensionLabel: string;
  unit: string;
};

export class MetricSlice {
  historicalYears: number[];
  forecastYears: number[];
  categoryValues: MetricCategoryValues[];
  totalValues: MetricCategoryValues | null;
  dimensionLabel: string;
  unit: string;

  constructor(input: MetricSliceInput) {
    [
      'historicalYears',
      'forecastYears',
      'categoryValues',
      'totalValues',
      'dimensionLabel',
      'unit',
    ].forEach((key) => {
      this[key] = input[key];
    });
  }

  createTable() {
    const header = [
      { key: 'category', label: this.dimensionLabel },
      ...[...this.historicalYears, ...this.forecastYears].map((year) => ({
        key: year.toString(),
        label: year.toString(),
      })),
    ];
    const rows = this.categoryValues.map((cv) => {
      const hist: [string, number | null][] = this.historicalYears.map((year, idx) => [
        year.toString(),
        cv.historicalValues[idx],
      ]);
      const fc: [string, number | null][] = this.forecastYears.map((year, idx) => [
        year.toString(),
        cv.forecastValues[idx],
      ]);
      const out: { [key: string]: string | number | null } = {
        category: cv.category.label,
        ...Object.fromEntries(hist),
        ...Object.fromEntries(fc),
      };
      return out;
    });
    const forecastFromColumn = 1 + this.historicalYears.length;
    return {
      header,
      rows,
      hasTotals: this.totalValues !== null,
      forecastFromColumn,
    };
  }
}

const DIMENSIONAL_METRIC_FRAGMENT = gql`
  fragment DimensionalMetric on DimensionalMetricType {
    id
    name
    dimensions {
      id
      label
      originalId
      helpText
      categories {
        id
        originalId
        label
        color
        order
        group
      }
      groups {
        id
        originalId
        label
        color
        order
      }
    }
    goals {
      categories
      groups
      values {
        year
        value
        isInterpolated
      }
    }
    unit {
      htmlShort
      short
      htmlLong
      long
    }
    stackable
    normalizedBy {
      id
      name
    }
    forecastFrom
    years
    values
  }
`;

export class DimensionalMetric {
  static ALL_SCENARIOS = 'ALL_SCENARIOS';
  private readonly data: Metric;
  private readonly rows: MetricRow[];
  valuesByDim: Map<string, DimValues>;
  dimensions: MetricDimension[];
  dimsById: Map<string, MetricDimension>;

  private isScenarioDim(dim: MetricDimensionInput) {
    return dim.id.endsWith(':scenario:ScenarioName');
  }

  /**
   * Filter metric data to include only the specified scenario or the default scenario if no scenario is specified.
   * @param scenarioId - The ID of the scenario to filter by. Defaults to 'default'.
   * @returns The filtered metric data.
   */
  private filterMultipleScenarios(data: Metric, scenarioId: string) {
    const scenarioDim = data.dimensions.find((dim) => this.isScenarioDim(dim));
    const filteredDimensions = data.dimensions.filter((dim) => !this.isScenarioDim(dim));

    if (scenarioDim) {
      const scenarioCat = scenarioDim.categories.find((cat) => cat.originalId === scenarioId);
      // Default to the first scenario category if the specified or default scenario is not found
      const scenarioCatIndex = scenarioCat ? scenarioDim.categories.indexOf(scenarioCat) : 0;

      return {
        ...data,
        dimensions: filteredDimensions,
        values: this.filterValuesByScenario(data.values, scenarioCatIndex, scenarioDim),
      };
    }

    return data;
  }

  constructor(data: Metric, scenarioId: string = 'default') {
    this.data =
      scenarioId === DimensionalMetric.ALL_SCENARIOS
        ? data
        : this.filterMultipleScenarios(data, scenarioId);

    this.dimensions = this.data.dimensions.map((dimIn) => {
      const groups = dimIn.groups.map((grpIn) => ({
        ...grpIn,
        categories: dimIn.categories.filter((cat) => cat.group === grpIn.id),
      }));
      const dim = {
        ...dimIn,
        groupsById: new Map(groups.map((grp) => [grp.id, grp])),
        groups: groups,
      };
      return dim;
    });
    this.rows = this.createRows([], this.dimensions, {});
  }

  private filterValuesByScenario(
    values: Array<number>,
    scenarioIndex: number,
    scenarioDim?: MetricDimensionInput
  ): Array<number> {
    if (!scenarioDim) return values;

    const valuesPerScenario = values.length / scenarioDim.categories.length;

    return values.slice(scenarioIndex * valuesPerScenario, (scenarioIndex + 1) * valuesPerScenario);
  }

  private createRows(rows: MetricRow[], dimsLeft: MetricDimension[], dimPath: DimCats) {
    const dim = dimsLeft[0];

    if (!dim) {
      let idx = rows.length;
      this.data.years.map((year) => {
        const value = this.data.values[idx];
        rows.push({
          year,
          value,
          dimCats: dimPath,
        });
        idx++;
      });
    } else {
      dim.categories.forEach((cat) => {
        const path = {
          ...dimPath,
          [dim.id]: cat,
        };
        this.createRows(rows, dimsLeft.slice(1), path);
      });
    }
    return rows;
  }

  /**
   * Checks if the cube has a matching dimension.
   *
   * @param originalDimId The non-prefixed (canonical) id for the dimension
   */
  hasDimension(originalDimId: string) {
    return !!this.dimensions.find((dim) => dim.originalId == originalDimId);
  }

  /*
  getLabelForChoice(categoryChoice: MetricCategoryChoice) {
    const parts: string[] = [];
    Object.entries(categoryChoice).forEach(([dimId, catId]) => {
      if (!catId) return;
      const dim = this.data.dimensions.find(dim => dim.id === dimId)!;
      const cat = dim.categories.find(cat => cat.id === catId)!;
      parts.push(cat.label);
    });
    return parts.join(' / ');
  }
  */

  getGoalsForChoice(categoryChoice: MetricCategoryChoice | null | undefined) {
    let selectedCategories;
    if (categoryChoice) {
      selectedCategories = Object.values(categoryChoice)
        .map((ch) => ch?.categories ?? [])
        .flat();
    } else {
      selectedCategories = [];
    }
    const catStr = JSON.stringify(selectedCategories.sort()); // JS 🤮
    const goals = this.data.goals.find((g) => JSON.stringify([...g.categories].sort()) == catStr);
    if (!goals) return null;
    return goals.values;
  }

  getOptionsForDimension(dimId: string, config: MetricCategoryChoice) {
    const dim = this.data.dimensions.find((dim) => dim.id === dimId)!;
    const choice = config[dimId];
    let opts: { id: string; label: string; selected: boolean }[];

    if (dim.groups.length) {
      const selected = choice?.groups || [];
      opts = dim.groups.map((grp) => ({
        id: grp.id,
        label: grp.label,
        selected: selected.some((grpId) => grp.id === grpId),
      }));
    } else {
      const selected = choice?.categories || [];
      opts = dim.categories.map((cat) => ({
        id: cat.id,
        label: cat.label,
        selected: selected.some((catId) => cat.id === catId),
      }));
    }
    return opts;
  }

  private choiceToCats(
    dim: MetricDimension,
    old: MetricCategoryChoice,
    newChoice: readonly { id: string }[]
  ) {
    const out = {
      ...old,
      [dim.id]: undefined,
    };
    if (!newChoice.length) return out;

    const ids = newChoice.map((ch) => ch.id);
    let val: CatDimChoice;
    if (dim.groups.length) {
      const groups = ids.map((id) => dim.groupsById.get(id)!);
      const cats = groups.map((grp) => grp.categories).flat();
      val = {
        groups: groups.map((grp) => grp.id),
        categories: cats.map((cat) => cat.id),
      };
    } else {
      val = {
        groups: null,
        categories: ids,
      };
    }
    out[dim.id] = val;
    return out;
  }

  getSliceableDims(selection: SliceConfig) {
    return this.dimensions.filter((dim) => !selection.categories[dim.id]);
  }

  updateChoice(dim: MetricDimension, old: SliceConfig, newChoice: readonly { id: string }[]) {
    let dimensionId = old.dimensionId;
    let sliceableDims = this.getSliceableDims(old);
    if (dimensionId === dim.id) {
      dimensionId = sliceableDims.find((sd) => sd.id !== dim.id)?.id;
      if (!dimensionId && dim.groups.length) {
        dimensionId = dim.id;
      }
    }
    const val = {
      categories: this.choiceToCats(dim, old.categories, newChoice),
      dimensionId,
    };
    if (!dimensionId) {
      sliceableDims = this.getSliceableDims(val);
      if (sliceableDims.length) val.dimensionId = sliceableDims[0].id;
    }
    return val;
  }

  /**
   * Get the default dimension slicing config when a goal is selected
   *
   * @param activeGoal - The currently selected goal
   * @returns An object describing the _default_ category selections
   *   or `null` if the current goal does not have an effect on this cube.
   */
  getChoicesForGoal(activeGoal: InstanceGoal) {
    const metricDims = new Map(this.dimensions.map((dim) => [dim.originalId, dim]));
    const matchingDims = activeGoal.dimensions.filter((gdim) => metricDims.has(gdim.dimension));

    if (!matchingDims.length) return null;

    const choice: MetricCategoryChoice = {};
    matchingDims.forEach((gdim) => {
      const metricDim = metricDims.get(gdim.dimension)!;
      let out: CatDimChoice | undefined;
      if (gdim.groups) {
        const grpMap: Map<string, MetricCategoryGroup> = new Map(
          metricDim.groups.map((grp) => [grp.originalId, grp])
        );
        const groupMatches = gdim.groups
          .filter((grpId) => grpMap.has(grpId))
          .map((grpId) => grpMap.get(grpId)!);
        const catMatches = groupMatches.map((grp) => grp.categories).flat();
        out = {
          groups: groupMatches.map((grp) => grp.id),
          categories: catMatches.map((cat) => cat.id),
        };
      } else {
        const catMatches = metricDim.categories.filter((cat) =>
          gdim.categories.some((goalCat) => goalCat === cat.originalId)
        );
        out = {
          groups: null,
          categories: catMatches.map((cat) => cat.id),
        };
      }
      if (out) choice[metricDim.id] = out;
    });
    return choice;
  }

  flatten(categoryChoice: MetricCategoryChoice | undefined) {
    const byYear: Map<number, number> = new Map();
    this.rows.forEach((row) => {
      const { year } = row;
      if (categoryChoice) {
        if (!this.rowMatchesChoice(row, categoryChoice)) return;
      }
      let val = byYear.get(year) ?? 0;
      const rowVal = row.value;
      if (rowVal !== null) val += rowVal;
      byYear.set(year, val);
    });

    const historicalValues: (number | null)[] = [];
    const forecastValues: (number | null)[] = [];
    this.data.years.forEach((year) => {
      const val: number | null = byYear.get(year) ?? null;
      if (this.data.forecastFrom && year >= this.data.forecastFrom) {
        forecastValues.push(val);
      } else {
        historicalValues.push(val);
      }
    });
    const historicalYears = this.data.years.filter((year) =>
      this.data.forecastFrom ? year < this.data.forecastFrom : true
    );
    const forecastYears = this.data.years.filter((year) =>
      this.data.forecastFrom ? year >= this.data.forecastFrom : false
    );
    const out: MetricSliceInput = {
      categoryValues: [
        {
          forecastValues,
          historicalValues,
          category: {
            id: this.data.id,
            label: this.data.name,
            color: null,
            order: null,
          },
          isNegative: false,
          color: null,
        },
      ],
      historicalYears,
      forecastYears,
      totalValues: null,
      dimensionLabel: this.data.name,
      unit: this.data.unit.short,
    };
    return new MetricSlice(out);
  }

  /**
   * Get the data for a single year
   * @param year The year to get data for
   * @param categoryChoice The category choice to filter by
   * @returns An object with the data for the year
   */
  getSingleYear(year: number, categoryChoice: MetricCategoryChoice | undefined) {
    // Filter out categories that don't match the current choice and other years
    const yearRows = this.rows.filter(
      (row) =>
        row.year === year && (categoryChoice ? this.rowMatchesChoice(row, categoryChoice) : true)
    );

    // Get all labels for easier lookup
    const allLabels = this.dimensions
      .map((dim) =>
        dim.groups.length
          ? dim.groups.map((grp) => ({
              id: grp.id,
              label: grp.label,
              color: grp.color,
            }))
          : dim.categories.map((cat) => ({
              id: cat.id,
              label: cat.label,
              color: cat.color,
            }))
      )
      .flat();

    // Get all used dimensions and their categories/groups
    const categoryTypes = this.dimensions.map((dim) => ({
      id: dim.id,
      type: dim.groups.length ? 'group' : 'category',
      options: dim.groups.length
        ? [...new Set(yearRows.map((row) => row.dimCats[dim.id].group!))]
        : [...new Set(yearRows.map((row) => row.dimCats[dim.id].id))],
    }));

    const rows = categoryTypes[0].options.map((rowId) =>
      categoryTypes[1].options.map((columnId) => {
        return (
          yearRows.find(
            (yearRow) =>
              ((categoryTypes[0].type === 'group' &&
                yearRow.dimCats[categoryTypes[0].id].group === rowId) ||
                (categoryTypes[0].type === 'category' &&
                  yearRow.dimCats[categoryTypes[0].id].id === rowId)) &&
              ((categoryTypes[1].type === 'group' &&
                yearRow.dimCats[categoryTypes[1].id].group === columnId) ||
                (categoryTypes[1].type === 'category' &&
                  yearRow.dimCats[categoryTypes[1].id].id === columnId))
          )?.value ?? null
        );
      })
    );

    const out = {
      categoryTypes,
      allLabels,
      rows,
    };
    return out;
  }

  private isForecastYear(year: number) {
    return this.data.forecastFrom && year >= this.data.forecastFrom;
  }

  private rowMatchesChoice(row: MetricRow, categoryChoice: MetricCategoryChoice) {
    const noMatch = Object.entries(categoryChoice).some(([dimId, choice]) => {
      if (!choice) return false;
      if (!choice.categories.length) return false;
      if (!choice.categories.includes(row.dimCats[dimId].id)) return true;
      return false;
    });
    return !noMatch;
  }

  sliceBy(
    dimensionId: string,
    sort: boolean = false,
    categoryChoice: MetricCategoryChoice | undefined,
    useGroups: boolean = true
  ) {
    const byYear: Map<number, Map<string, number>> = new Map();
    const dim = this.dimensions.find((dim) => dim.id === dimensionId)!;

    if (dim.groups.length) {
      if (categoryChoice?.[dim.id]) {
        useGroups = false;
      }
    } else {
      useGroups = false;
    }

    this.rows.forEach((row) => {
      const { year } = row;

      let catVals = byYear.get(year);
      if (!catVals) {
        catVals = new Map();
        byYear.set(year, catVals);
      }
      // Process only those rows that match the category choices
      if (categoryChoice) {
        if (!this.rowMatchesChoice(row, categoryChoice)) return;
      }
      const cat = row.dimCats[dimensionId];
      const rowId = useGroups ? cat.group! : cat.id;
      let val = catVals.get(rowId);
      if (val === undefined) {
        val = 0;
      }
      const rowVal = row.value;
      // FIXME: What if metric can't be summed?
      if (rowVal !== null) val += rowVal;

      catVals.set(rowId, val);
    });
    // FIXME: Should we get this from the theme?
    const totalColor = '#777777';
    const totalValues: MetricCategoryValues = {
      category: {
        id: 'total',
        label: 'total',
        color: totalColor,
        order: null,
      },
      forecastValues: this.data.years
        .filter((year) => this.isForecastYear(year))
        .map((year) => null),
      historicalValues: this.data.years
        .filter((year) => !this.isForecastYear(year))
        .map((year) => null),
      isNegative: false,
      color: totalColor,
    };
    const groupsOrCats = useGroups ? dim.groups : dim.categories;
    const categoryValues: MetricCategoryValues[] = groupsOrCats
      .map((cat: MetricCategoryGroup | MetricDimensionCategory) => {
        const historicalValues: (number | null)[] = [];
        const forecastValues: (number | null)[] = [];
        this.data.years.forEach((year) => {
          const val: number | null = byYear.get(year)!.get(cat.id) ?? null;
          if (this.isForecastYear(year)) {
            forecastValues.push(val);
          } else {
            historicalValues.push(val);
          }
        });
        historicalValues.forEach((val, idx) => {
          if (val === null) return;
          let oldVal = totalValues.historicalValues[idx];
          oldVal = (oldVal ?? 0) + val;
          totalValues.historicalValues[idx] = oldVal;
        });
        forecastValues.forEach((val, idx) => {
          if (val === null) return;
          let oldVal = totalValues.forecastValues[idx];
          oldVal = (oldVal ?? 0) + val;
          totalValues.forecastValues[idx] = oldVal;
        });
        const isNegative = cat.order !== null && cat.order !== undefined ? cat.order < 0 : false;
        return {
          category: cat,
          forecastValues,
          historicalValues,
          isNegative,
          color: cat.color,
        };
      })
      .filter((cv) => {
        const hasVals = [...cv.historicalValues, ...cv.forecastValues].find(
          (val) => val !== null && val != 0
        );
        return hasVals !== undefined;
      });

    const historicalYears = this.data.years.filter((year) => !this.isForecastYear(year));
    const forecastYears = this.data.years.filter((year) => this.isForecastYear(year));
    const ordered = categoryValues
      .filter((cv) => cv.category.order != null)
      .sort((a, b) => a.category.order! - b.category.order!);
    const unordered = categoryValues.filter((cv) => cv.category.order == null);
    if (sort) {
      let idx = historicalYears.length - 1;
      let key = 'historicalValues';
      if (idx < 0) {
        idx = forecastYears.length - 1;
        key = 'forecastValues';
      }
      unordered.sort((a, b) => b[key][idx] - a[key][idx]);
    }
    const out: MetricSliceInput = {
      categoryValues: [...ordered, ...unordered],
      historicalYears,
      forecastYears,
      totalValues,
      dimensionLabel: dim.label,
      unit: this.data.unit.short,
    };
    return new MetricSlice(out);
  }

  private createFilename() {
    const metricName = slugify(this.data.name, {
      remove: /[*+~.()'"!:@]/g,
      strict: true,
      lower: true,
      replacement: '_',
    });
    const ts = dayjs().format('YYYY-MM-DD_HHmm');
    return `${metricName}_${ts}`;
  }

  async downloadData(config: SliceConfig, format: 'xlsx' | 'csv') {
    let slice: MetricSlice;
    if (config.dimensionId) {
      slice = this.sliceBy(config.dimensionId, false, config.categories, false);
    } else {
      slice = this.flatten(config.categories);
    }

    const filename = this.createFilename();
    const table = slice.createTable();
    const rows = table.rows.map((row) => table.header.map((hdr) => row[hdr.key]));
    const header = table.header.map((hdr) => hdr.label);
    if (format === 'csv') {
      const delimiter = ';';
      const lines = [header, ...rows].map((row) =>
        row
          .map((val) => {
            if (val === null) return '';
            if (typeof val === 'number') return val;
            return `"${String(val).replace(/"/g, '""')}"`;
          })
          .join(delimiter)
      );
      const csvAsString = lines.join('\r\n');
      // BOM support for special characters in Excel
      const byteOrderMark = '\ufeff';
      const blob = new Blob([byteOrderMark, csvAsString], {
        type: 'text/csv;charset=utf-8;',
      });

      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${filename}.csv`;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    const ExcelJS = await import('exceljs');
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Results');
    const tb = ws.addTable({
      name: 'ResultsTable',
      ref: 'A2',
      headerRow: true,
      totalsRow: table.hasTotals,
      style: {
        showRowStripes: true,
        theme: 'TableStyleLight1',
      },
      columns: header.map((label, idx) => {
        return {
          name: label.toString(),
          filterButton: idx == 0,
          totalsRowFunction: table.hasTotals && idx > 0 ? 'sum' : 'none',
        };
      }),
      rows: rows,
    });
    tb.commit();
    const fontConfig: Partial<Font> = {
      name: 'Calibri',
    };
    const firstRow = ws.getRow(1);
    if (header[0] !== this.data.name) {
      firstRow.getCell(1).value = this.data.name;
    }

    firstRow.getCell(2).value = slice.unit;
    firstRow.font = { ...fontConfig };

    const hdrRow = ws.getRow(2);
    hdrRow.font = {
      ...fontConfig,
      bold: true,
    };
    ws.views.push({
      state: 'frozen',
      ySplit: 2,
      xSplit: 1,
    });

    const hdrCol = ws.getColumn(1);
    hdrCol.width = 32;
    ws.columns.forEach((col, idx) => {
      const style: Partial<Style> = {
        font: { ...fontConfig },
      };
      if (idx == table.forecastFromColumn) {
        style.border = {
          left: {
            style: 'mediumDashed',
            color: {
              argb: '#000000',
            },
          },
        };
      }
      if (idx >= table.forecastFromColumn) {
        style.font!.italic = true;
      }
      col.style = style;
    });
    const buf = await wb.xlsx.writeBuffer();
    const blob = new Blob([buf], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.xlsx`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  static fragment: DocumentNode = DIMENSIONAL_METRIC_FRAGMENT;
}
