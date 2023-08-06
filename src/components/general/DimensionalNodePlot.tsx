import { useContext, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useTranslation } from 'next-i18next';
import { tint, } from 'polished';
import styled, { ThemeContext } from 'styled-components';
import { gql, useReactiveVar } from '@apollo/client';
import CsvDownload from 'react-json-to-csv';
import { genColors, genColorsFromTheme } from 'common/colors';
import SiteContext from 'context/site';
import type { DimensionalNodeMetricFragment } from 'common/__generated__/graphql';
import {
  Col, Nav, NavItem, NavLink, TabContent, Row,
  UncontrolledDropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap';
import {
  GraphDown as GraphIcon,
  Table as TableIcon,
  CloudArrowDown as DowloadIcon,
  FiletypeCsv as CsvIcon,
  FiletypeXls as XlsIcon,
 } from 'react-bootstrap-icons';
import DataTable from 'components/general/DataTable';
import SelectDropdown from 'components/common/SelectDropdown';
import { activeGoalVar } from 'common/cache';
import { InstanceGoal } from 'common/instance';
import { Font, Style } from 'exceljs';


const Plot = dynamic(() => import('components/graphs/Plot'),
  { ssr: false });

const Tools = styled.div`
  padding: 0 1rem .5rem;
  text-align: right;
  .btn-link {
    text-decoration: none;
  }
`;

const DisplayTab = styled(NavItem)`
  font-size: 0.9rem;
`;

type CatValue = number | null;

type DimValues = {
  categories: Map<string, CatValue[]>,
}

type Metric = DimensionalNodePlotProps['metric'];

type MetricDimensionInput = Metric['dimensions'][0];
type MetricDimension = Omit<MetricDimensionInput, 'groups'> & {
  groupsById: Map<string, MetricCategoryGroup>,
  groups: MetricCategoryGroup[],
};
type MetricDimensionCategory = MetricDimension['categories'][0];
type MetricCategoryGroup = MetricDimensionInput['groups'][0] & {
  categories: MetricDimensionCategory[],
};

type DimCats = {
  [key: string]: MetricDimensionCategory,
}

type MetricRow = {
  year: number,
  value: number | null,
  dimCats: DimCats,
}

type MetricCategoryValues = {
  category: MetricDimensionCategory | MetricCategoryGroup,
  forecastValues: (number | null)[],
  historicalValues: (number | null)[],
  isNegative: boolean,
};

type CatDimChoice = {
  groups: string[] | null,
  categories: string[],
};

type MetricCategoryChoice = {
  [dim: string]: CatDimChoice | undefined,
};

type MetricSliceInput = {
  historicalYears: number[],
  forecastYears: number[],
  categoryValues: MetricCategoryValues[],
  totalValues: MetricCategoryValues | null,
  dimensionLabel: string,
  unit: string,
};


class MetricSlice {
  historicalYears: number[];
  forecastYears: number[];
  categoryValues: MetricCategoryValues[];
  totalValues: MetricCategoryValues | null;
  dimensionLabel: string;
  unit: string;

  constructor(input: MetricSliceInput) {
    ['historicalYears', 'forecastYears', 'categoryValues', 'totalValues', 'dimensionLabel', 'unit'].forEach(key => {
      this[key] = input[key];
    })
  }

  createTable() {
    //const cats = this.categoryValues.map(cv => cv.category.label);
    const header = [this.dimensionLabel, ...this.historicalYears, ...this.forecastYears];
    const rows = this.categoryValues.map(cv => {
      return [cv.category.label, ...cv.historicalValues, ...cv.forecastValues];
    });
    const forecastFromColumn = 1 + this.historicalYears.length;
    return { header, rows, hasTotals: this.totalValues !== null, forecastFromColumn };
  }
}


class DimensionalMetric {
  private readonly data: Metric;
  private readonly rows: MetricRow[];
  valuesByDim: Map<string, DimValues>;
  dimensions: MetricDimension[];
  dimsById: Map<string, MetricDimension>;

  constructor(data: Metric) {
    this.data = data;
    this.dimensions = data.dimensions.map(dimIn => {
      const groups = dimIn.groups.map(grpIn => ({
        ...grpIn,
        categories: dimIn.categories.filter(cat => cat.group === grpIn.id),
      }));
      const dim = {
        ...dimIn,
        groupsById: new Map(groups.map(grp => [grp.id, grp])),
        groups: groups,
      };
      return dim;
    });
    this.rows = this.createRows([], this.dimensions, {});
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
      dim.categories.forEach(cat => {
        const path = {
          ...dimPath,
          [dim.id]: cat,
        };
        this.createRows(rows, dimsLeft.slice(1), path);
      });
    }
    return rows;
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
    const selectedCategories = categoryChoice ? Object.values(categoryChoice) : [];
    const catStr = JSON.stringify(selectedCategories.sort()); // JS 🤮
    const goals = this.data.goals.find(g => JSON.stringify([...g.categories].sort()) == catStr);
    if (!goals) return null;
    return goals.values;
  }

  getOptionsForDimension(dimId: string, config: MetricCategoryChoice) {
    const dim = this.data.dimensions.find(dim => dim.id === dimId)!;
    const choice = config[dimId];
    let opts: {id: string, label: string, selected: boolean}[];

    if (dim.groups.length) {
      const selected = choice?.groups || [];
      opts = dim.groups.map(grp => ({
        id: grp.id,
        label: grp.label,
        selected: selected.some(grpId => grp.id === grpId),
      }));
    } else {
      const selected = choice?.categories || [];
      opts = dim.categories.map(cat => ({
        id: cat.id,
        label: cat.label,
        selected: selected.some(catId => cat.id === catId),
      }))
    }
    return opts;
  }

  private choiceToCats(dim: MetricDimension, old: MetricCategoryChoice, newChoice: readonly {id: string}[]) {
    const out = {
      ...old,
      [dim.id]: undefined,
    }
    if (!newChoice.length) return out;

    const ids = newChoice.map(ch => ch.id);
    let val: CatDimChoice;
    if (dim.groups.length) {
      const groups = ids.map(id => dim.groupsById.get(id)!);
      const cats = groups.map(grp => grp.categories).flat();
      val = {
        groups: groups.map(grp => grp.id),
        categories: cats.map(cat => cat.id),
      }
    } else {
      val = {
        groups: null,
        categories: ids,
      }
    }
    out[dim.id] = val;
    return out;
  }

  getSliceableDims(selection: SliceConfig) {
    return this.dimensions.filter(dim => !selection.categories[dim.id]);
  }

  updateChoice(dim: MetricDimension, old: SliceConfig, newChoice: readonly {id: string}[]) {
    let dimensionId = old.dimensionId;
    let sliceableDims = this.getSliceableDims(old);
    if (dimensionId === dim.id) {
      dimensionId = sliceableDims.find(sd => sd.id !== dim.id)?.id;
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
      if (sliceableDims.length) val.dimensionId = sliceableDims[0].id
    }
    return val;
  }

  getChoicesForGoal(activeGoal: InstanceGoal) {
    const metricDims = new Map(this.dimensions.map(dim => [dim.originalId, dim]));
    const matchingDims = activeGoal.dimensions.filter(gdim => metricDims.has(gdim.dimension));
    const choice: MetricCategoryChoice = {};
    matchingDims.forEach(gdim => {
      const metricDim = metricDims.get(gdim.dimension)!;
      let out: CatDimChoice | undefined;
      if (gdim.groups) {
        const grpMap: Map<string, MetricCategoryGroup> = new Map(metricDim.groups.map(grp => [grp.originalId, grp]));
        const groupMatches = gdim.groups.filter(grpId => grpMap.has(grpId)).map(grpId => grpMap.get(grpId)!);
        const catMatches = groupMatches.map(grp => grp.categories).flat();
        out = {
          groups: groupMatches.map(grp => grp.id),
          categories: catMatches.map(cat => cat.id),
        }
      } else {
        const catMatches = metricDim.categories.filter(cat => gdim.categories.some(goalCat => goalCat === cat.originalId));
        out = {
          groups: null,
          categories: catMatches.map(cat => cat.id),
        };
      }
      if (out) choice[metricDim.id] = out;
    })
    return choice;
  }

  flatten(categoryChoice: MetricCategoryChoice | undefined) {
    const byYear: Map<number, number> = new Map();
    this.rows.forEach(row => {
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
    this.data.years.forEach(year => {
      let val: number | null = byYear.get(year) ?? null;
      if (this.data.forecastFrom && year >= this.data.forecastFrom) {
        forecastValues.push(val);
      } else {
        historicalValues.push(val);
      }
    });
    const historicalYears = this.data.years.filter(year => this.data.forecastFrom ? year < this.data.forecastFrom : true);
    const forecastYears = this.data.years.filter(year => this.data.forecastFrom ? year >= this.data.forecastFrom : false);
    const out: MetricSliceInput = {
      categoryValues: [{
        forecastValues,
        historicalValues,
        category: {
          id: this.data.id,
          label: this.data.name,
        },
        isNegative: false,
      }],
      historicalYears,
      forecastYears,
      totalValues: null,
      dimensionLabel: this.data.name,
      unit: this.data.unit.short,
    };
    return new MetricSlice(out);
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
    dimensionId: string, sort: boolean = false,
    categoryChoice: MetricCategoryChoice | undefined, useGroups: boolean = true
  ) {
    const byYear: Map<number, Map<string, number>> = new Map();
    const dim = this.dimensions.find(dim => dim.id === dimensionId)!;

    if (dim.groups.length) {
      if (categoryChoice?.[dim.id]) {
        useGroups = false;
      }
    } else {
      useGroups = false;
    }
    console.log('use groups', useGroups);

    this.rows.forEach(row => {
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
    })
    const totalValues: MetricCategoryValues = {
      category: {
        id: 'total',
        label: 'total',
        color: '#777777',
      },
      forecastValues: this.data.years.filter(year => this.isForecastYear(year)).map(year => null),
      historicalValues: this.data.years.filter(year => !this.isForecastYear(year)).map(year => null),
      isNegative: false,
    };
    const groupsOrCats = useGroups ? dim.groups : dim.categories;
    let categoryValues: MetricCategoryValues[] = groupsOrCats.map((cat: MetricCategoryGroup | MetricDimensionCategory) => {
      const historicalValues: (number | null)[] = [];
      const forecastValues: (number | null)[] = [];
      this.data.years.forEach((year, yearIdx) => {
        let val: number | null = byYear.get(year)!.get(cat.id) ?? null;
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
      const isNegative = (cat.order !== null && cat.order !== undefined) ? cat.order < 0 : false;
      return {
        category: cat,
        forecastValues,
        historicalValues,
        isNegative,
      };
    }).filter(cv => {
      const hasVals = [...cv.historicalValues, ...cv.forecastValues].find(val => val !== null && val != 0);
      return hasVals !== undefined;
    });

    const historicalYears = this.data.years.filter(year => !this.isForecastYear(year));
    const forecastYears = this.data.years.filter(year => this.isForecastYear(year));
    const ordered = categoryValues.filter(cv => cv.category.order != null).sort((a, b) => (a.category.order! - b.category.order!));
    const unordered = categoryValues.filter(cv => cv.category.order == null);
    if (sort) {
      let idx = historicalYears.length - 1;
      let key = 'historicalValues';
      if (idx < 0) {
        idx = forecastYears.length - 1;
        key = 'forecastValues';
      }
      unordered.sort((a, b) => (b[key][idx] - a[key][idx]));
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
}


function formatHover(name: string, color: string, unit: string, predLabel: string | null, fontFamily?: string) {
  //const predText = predLabel ? ` <i>(${predLabel})</i>` : '';
  const out: Partial<Plotly.PlotData> = {
    /*
    hovertemplate: `${name}<br />` +
                   `%{x|%Y}: <b>%{y:,.3r}</b> ` +
                   `${unit}` +
                   `${predText}` + 
                   `<extra></extra>`,
    */
    hovertemplate:
      `${name}: ` +
      `<b>%{y:,.3r}</b> ` +
      `${unit}` +
      //`${predText}` +
      `<extra></extra>`,
    hoverlabel: {
      bgcolor: color,
      font: {
        family: fontFamily,
      },
    },
  };
  return out;
};

type SliceConfig = {
  dimensionId: string | undefined,
  categories: MetricCategoryChoice,
}


type DimensionalNodePlotProps = {
  node: { id: string },
  metric: NonNullable<DimensionalNodeMetricFragment['metricDim']>,
  startYear: number,
  endYear: number,
  color?: string | null,
}


function DimensionalNodePlot(props: DimensionalNodePlotProps) {
  const {
    node,
    metric,
    startYear,
    endYear,
    color,
  } = props;

  const { t } = useTranslation();
  const activeGoal = useReactiveVar(activeGoalVar);
  const [activeTabId, setActiveTabId] = useState('graph');
  const cube = useMemo(() => new DimensionalMetric(metric), [metric]);

  let defaultChoice = {};
  let defaultSliceDim: string | undefined = metric.dimensions[0]?.id;

  let goalAffectsPlot = false
  if (activeGoal) {
    defaultChoice = cube.getChoicesForGoal(activeGoal);
    if (defaultSliceDim && Object.hasOwn(defaultChoice, defaultSliceDim)) {
      defaultSliceDim = metric.dimensions.find(dim => !defaultChoice[dim.id])?.id;
      goalAffectsPlot = true;
    }
  }

  const [sliceConfig, setSliceConfig] = useState<SliceConfig>({dimensionId: defaultSliceDim, categories: defaultChoice});
  console.log('sliceConfig', sliceConfig);

  useEffect(() => {
    if (!goalAffectsPlot) return;
    if (sliceConfig.dimensionId != defaultSliceDim || sliceConfig.categories != defaultChoice) {
      setSliceConfig({dimensionId: defaultSliceDim, categories: defaultChoice});
    }
  }, [activeGoal])

  const sliceableDims = cube.dimensions.filter(dim => !sliceConfig.categories[dim.id]);
  const slicedDim = cube.dimensions.find(dim => dim.id === sliceConfig.dimensionId);

  let slice: MetricSlice;
  if (slicedDim) {
    slice = cube.sliceBy(slicedDim.id, true, sliceConfig.categories);
  } else {
    slice = cube.flatten(sliceConfig.categories);
  }
  const theme = useContext(ThemeContext);
  const site = useContext(SiteContext);

  const defaultColor = color || theme.graphColors.blue070;
  const shapes = [];
  const plotData: Partial<Plotly.PlotData>[] = [];
  const rangeMode = metric.stackable ? 'tozero' : 'normal';
  const filled = metric.stackable;

  const filledStyles = (stackGroup: string) => {
    if (!filled) return {};
    const out: Partial<Plotly.PlotData> = {
      stackgroup: stackGroup,
      //marker: { opacity: 0 },
      line: {
        color: 'white',
        width: 1,
        dash: 'solid',
        shape: 'spline',
      },
    }
    return out;
  };

  let colors: string[];
  const nrCats = slice.categoryValues.length;
  if (nrCats > 1) {
    colors = genColorsFromTheme(theme, slice.categoryValues.length);
  } else {
    colors = [defaultColor]
  }
  const hasHistorical = slice.historicalYears.length > 0;
  const hasForecast = slice.forecastYears.length > 0;
  const predLabel = t('pred');
  const unit = metric.unit.htmlShort;

  const genTraces = ((cv: MetricCategoryValues, idx: number) => {
    const stackGroup = cv.isNegative ? 'neg' : 'pos';
    const color = cv.category.color || colors[idx];
    const traceConfig: Partial<Plotly.PlotData> = {
      name: cv.category.label,
      type: 'scatter',
      line: {
        color,
        shape: 'spline',
        width: 3,
      },
      fillcolor: color,
    };

    if (hasHistorical) {
      plotData.push({ 
        ...traceConfig,
        x: slice.historicalYears,
        y: cv.historicalValues,
        ...filledStyles(`${stackGroup}-hist`),
        ...formatHover(cv.category.label, color, unit, null, theme.fontFamily),
      })
    }
    if (hasHistorical && hasForecast) {
      const lastHist = slice.historicalYears.length - 1;
      // Short trace to join historical and forecast series together
      plotData.push({
        ...traceConfig,
        ...filledStyles(`${stackGroup}-join`),
        x: [slice.historicalYears[lastHist], slice.forecastYears[0]],
        y: [cv.historicalValues[lastHist], cv.forecastValues[0]],
        hoverinfo: 'skip',
        showlegend: false,
        fillcolor: tint(0.3, color),
      });
    };
    if (hasForecast) {
      plotData.push({
        ...traceConfig,
        ...filledStyles(`${stackGroup}-forecast`),
        ...formatHover(cv.category.label, color, unit, predLabel, theme.fontFamily),
        x: slice.forecastYears,
        y: cv.forecastValues,
        showlegend: false,
        fillcolor: tint(0.3, color),
      })
    }
  });

  slice.categoryValues.forEach((cv, idx) => genTraces(cv, idx));

  const goals = cube.getGoalsForChoice(sliceConfig.categories);
  if (goals) {
    const name = t('target');
    plotData.push({
      type: 'scatter',
      name,
      line: {
        color: theme.graphColors.red070,
        width: 2,
        dash: 'dot',
      },
      marker: {
        size: 8,
      },
      x: goals.map(v => v.year),
      y: goals.map(v => v.value),
      hovertemplate: `<b>${name} %{x}: %{y:,.3r} ${unit}</b><extra></extra>`,
    })
  }

  if (metric.stackable && slice.totalValues) {
    const label = t('plot-total')!;
    plotData.push({
      type: 'scatter',
      name: label,
      mode: 'lines',
      line: {
        color: theme.graphColors.grey080,
        width: 0,
      },
      x: [...slice.historicalYears, ...slice.forecastYears],
      y: [...slice.totalValues.historicalValues, ...slice.totalValues.forecastValues],
      ...formatHover(label, theme.graphColors.grey080, unit, null, theme.fontFamily),
      showlegend: false,
    })
  }

  const nrYears = endYear - startYear;
  const layout: Partial<Plotly.Layout> = {
    height: 300,
    margin: {
      t: 24,
      r: 24,
      b: 48,
      l: 12,
    },
    hovermode: 'x unified',
    hoverdistance: 10,
    yaxis: {
      domain: [0, 1],
      anchor: 'x',
      ticklen: 10,
      gridcolor: theme.graphColors.grey005,
      tickcolor: theme.graphColors.grey030,
      tickformat: ',',
      title: {
        font: {
          family: theme.fontFamily,
        },
        text: metric.unit?.htmlShort || undefined,
      },
      rangemode: rangeMode,
    },
    xaxis: {
      domain: [0.075, 1],
      ticklen: 10,
      type: 'date',
      dtick: nrYears > 30 ? 'M60' : (nrYears > 15 ? 'M24' : 'M12'),
      range: [`${startYear - 1}-11-01`, `${endYear}-02-01`],
      gridcolor: theme.graphColors.grey005,
      tickcolor: theme.graphColors.grey030,
      hoverformat: '%Y',
    },
    autosize: true,
    font: {
      family: theme.fontFamily,
    },
    paper_bgcolor: 'rgba(0,0,0,0)',
    showlegend: true,
    legend: {
      orientation: 'h',
      yanchor: 'top',
      y: -0.2,
      xanchor: 'right',
      x: 1,
      itemclick: false,
      itemdoubleclick: false,
    },
    grid: { rows: 1, columns: 2, pattern: 'independent' },
    shapes,
  };

  const hasGroups = cube.dimensions.some(dim => dim.groups.length);

  let controls = (metric.dimensions.length > 1 || hasGroups) ? (<>
    <Row>
    { metric.dimensions.length > 1 && (
      <Col md={3} className="d-flex" key="dimension">
        <SelectDropdown
          id="dimension"
          label={t('plot-choose-dimension')!}
          onChange={val => setSliceConfig(old => ({...old, dimensionId: val?.id || undefined}))}
          options={sliceableDims}
          value={sliceableDims.find(dim => sliceConfig.dimensionId === dim.id) || null}
          isMulti={false}
          isClearable={false}
        />
      </Col>
    )}
    { cube.dimensions.map(dim => {
      const options = cube.getOptionsForDimension(dim.id, sliceConfig.categories);
      return (
        <Col md={4} className="d-flex" key={dim.id}>
          <SelectDropdown
            id={`dim-${dim.id}`}
            label={dim.label}
            options={options}
            value={options.filter(opt => opt.selected)}
            isMulti={true}
            isClearable={true}
            onChange={(newValues) => {
              setSliceConfig(old => {
                return cube.updateChoice(dim, old, newValues);
              })
            }}
          />
        </Col>
      );
    })}
    </Row>
  </>) : null;

  const downloadData = async () => {
    const ExcelJS = await import('exceljs');
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Results');
    const sliceForTable = slicedDim ? cube.sliceBy(slicedDim.id, false, sliceConfig.categories, false) : slice;

    const table = sliceForTable.createTable();
    const tb = ws.addTable({
      name: 'ResultsTable',
      ref: 'A2',
      headerRow: true,
      totalsRow: table.hasTotals,
      style: {
        showRowStripes: true,
        theme: 'TableStyleLight1',
      },
      columns: table.header.map((label, idx) => {
        return {
          name: label.toString(),
          filterButton: idx == 0,
          totalsRowFunction: (table.hasTotals && idx > 0) ? 'sum' : 'none',
        };
      }),
      rows: table.rows,
    });
    tb.commit();
    const fontConfig: Partial<Font> = {
      name: 'Calibri',
    }
    const firstRow = ws.getRow(1);
    if (table.header[0] !== metric.name) {
      firstRow.getCell(1).value = metric.name;
    }

    firstRow.getCell(2).value = slice.unit;
    firstRow.font = {...fontConfig};

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
        font: {...fontConfig},
      };
      if (idx == table.forecastFromColumn) {
        style.border = {
          left: {
            style: 'mediumDashed',
            color: {
              argb: '#000000',
            }
          }
        }
      }
      if (idx >= table.forecastFromColumn) {
        style.font!.italic = true;
      }
      col.style = style;
    });
    const buf = await wb.xlsx.writeBuffer();
    const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = "results.xlsx";
    link.click();
    URL.revokeObjectURL(link.href);
  };

  // recreate nodes for repurposing outcome page DataTable
  const selectedCategories = metric.dimensions.map(dim => sliceConfig.categories[dim.id]);
  const selectedCategoryNames = selectedCategories.map((catId) => {
    if (catId === undefined) return null;
    let catName = '';
    metric.dimensions?.length && metric.dimensions.forEach(dim => {
      const cat = dim?.categories.find(cat => cat.id === catId);
      if (cat) catName = cat.label;
    })
    return catName;
  });
  const selectedCategoryDisplay = selectedCategoryNames.filter(name => name !== null).join(', ');

  const tableNode = {
    metric: {
      historicalValues: slice.historicalYears.map((year, idx) => ({
        year,
        value: slice.totalValues?.historicalValues[idx] ?? null,
      })),
      forecastValues: slice.forecastYears.map((year, idx) => ({
        year,
        value: slice.totalValues?.forecastValues[idx] ?? null,
      })),
      name: `${slice.totalValues?.category.label ?? metric.name}${selectedCategoryDisplay ? `: ${selectedCategoryDisplay}` : ''}`,
      unit: metric.unit,
      years: [...slice.historicalYears, ...slice.forecastYears],
    },
    name: `${metric.name}${selectedCategoryDisplay ? `: ${selectedCategoryDisplay}` : ''}`,
    id: metric.id,
  };

  const tableSubNodes = slice.categoryValues.map(cv => {
    const historicalValues = slice.historicalYears.map((year, idx) => ({
      year,
      value: cv.historicalValues[idx],
    }));
    const forecastValues = slice.forecastYears.map((year, idx) => ({
      year,
      value: cv.forecastValues[idx],
    }));
    const metric = {
      historicalValues,
      forecastValues,
      name: cv.category.label,
      unit: tableNode.metric.unit,
      years: [...slice.historicalYears, ...slice.forecastYears],
    };
    return {
      metric,
      name: cv.category.label,
      id: cv.category.id,
    };
  });

  // Create JSON for react-json-to-csv
  const tableHistoricalRows = tableNode.metric.historicalValues.map((row) => {
    const subSectorColumns = {};
    tableSubNodes && tableSubNodes.forEach((subNode) => {
      const subNodeRow = subNode.metric.historicalValues.find((value) => value.year === row.year);
      subSectorColumns[subNode.id] = subNodeRow ? subNodeRow.value : '-';
    });
    subSectorColumns['total'] = tableNode.metric.historicalValues.find((value) => value.year === row.year)?.value || '-';
    return {
      year: row.year,
      type: 'Historical',
      ...subSectorColumns,
    };
  });
  
    const tableForecastRows = tableNode.metric.forecastValues.map((row) => {
      const subSectorColumns = {};
      tableSubNodes && tableSubNodes.forEach((subNode) => {
        const subNodeRow = subNode.metric.forecastValues.find((value) => value.year === row.year);
        subSectorColumns[subNode.id] = subNodeRow ? subNodeRow.value : '-';
      });
      subSectorColumns['total'] = tableNode.metric.forecastValues.find((value) => value.year === row.year)?.value || '-';
      return {
        year: row.year,
        type: 'Forecast',
        ...subSectorColumns,
      };
    });

    const tableHeaders = [
      "Year",
      "Type",
      ...tableSubNodes.map((subNode) => subNode.name),
      "Total",
    ];

  return (
    <>
      {controls}
      <Nav tabs className="justify-content-end">
        <DisplayTab>
          <NavLink
            href="#"
            onClick={() => setActiveTabId('graph')}
            active={activeTabId === 'graph'}
          >
            <GraphIcon /> {t('time-series')}
          </NavLink>
        </DisplayTab>
        <DisplayTab>
          <NavLink
            href="#" onClick={() => setActiveTabId('table')}
            active={activeTabId === 'table'}
          >
            <TableIcon /> {t('table')}
          </NavLink>
        </DisplayTab>
      </Nav>
      <TabContent activeTab={ activeTabId} className='mt-3'>

      { activeTabId === 'graph' && (
        <Plot
          data={plotData}
          layout={layout}
          useResizeHandler
          style={{ width: '100%' }}
          config={{ displayModeBar: false }}
          noValidate
        />
      )}
      { activeTabId === 'table' && (
        <div>
          <DataTable
            node={tableNode}
            subNodes={tableSubNodes}
            startYear={startYear}
            endYear={endYear}
          />
        </div>
      )}
      </TabContent>

      <Tools>
        <UncontrolledDropdown size="sm">
          <DropdownToggle caret color="link"><DowloadIcon />{ ` ${t('download-data')}` }</DropdownToggle>
          <DropdownMenu>
            <DropdownItem onClick={async (ev) => await downloadData()}>
              <XlsIcon /> XLS
            </DropdownItem>
            <CsvDownload 
              data={tableHistoricalRows.concat(tableForecastRows)}
              filename={`${metric.id}.csv`}
              headers={tableHeaders}
              className="dropdown-item"
              type="button"
              tabIndex={0}
              role="menuitem"
            >
              <CsvIcon /> CSV
            </CsvDownload>
          </DropdownMenu>
        </UncontrolledDropdown>
      </Tools>
    </>
  );
};

DimensionalNodePlot.fragment = gql`
  fragment DimensionalNodeMetric on NodeInterface {
    metricDim {
      id
      name
      dimensions {
        id
        label
        originalId
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
        values {
          year
          value
          isInterpolated
        }
      }
      unit {
        htmlShort
        short
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
  }
`;

export default DimensionalNodePlot;
