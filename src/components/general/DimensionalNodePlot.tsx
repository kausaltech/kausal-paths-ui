import { useContext, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useTranslation } from 'next-i18next';
import { tint, transparentize } from 'polished';
import styled, { ThemeContext } from 'styled-components';
import { gql, useReactiveVar } from '@apollo/client';

import { genColors, genColorsFromTheme } from 'common/colors';
import SiteContext from 'context/site';
import type { DimensionalNodeMetricFragment } from 'common/__generated__/graphql';
import { Col, FormGroup, Input, Label, Row } from 'reactstrap';
import SelectDropdown from 'components/common/SelectDropdown';
import { activeGoalVar } from 'common/cache';


const Plot = dynamic(() => import('components/graphs/Plot'),
  { ssr: false });

const Tools = styled.div`
  padding: 0 1rem .5rem;
  text-align: right;
  .btn-link {
    text-decoration: none;
  }
`;

type CatValue = number | null;

type DimValues = {
  categories: Map<string, CatValue[]>,
}

type Metric = DimensionalNodePlotProps['metric'];

type MetricDimension = Metric['dimensions'][0];
type MetricDimensionCategory = MetricDimension['categories'][0];

type DimCats = {
  [key: string]: string,
}

type MetricRow = {
  year: number,
  value: number | null,
  dimCats: DimCats,
}

type MetricCategoryValues = {
  category: MetricDimensionCategory,
  forecastValues: (number | null)[],
  historicalValues: (number | null)[],
  isNegative: boolean,
};

type MetricSlice = {
  historicalYears: number[],
  forecastYears: number[],
  categoryValues: MetricCategoryValues[],
  totalValues: MetricCategoryValues | null,
};

type MetricCategoryChoice = {
  [dim: string]: string | undefined,
};


class DimensionalMetric {
  private readonly data: DimensionalNodePlotProps['metric'];
  private readonly rows: MetricRow[];
  valuesByDim: Map<string, DimValues>

  constructor(data: DimensionalNodePlotProps['metric']) {
    this.data = data;
    this.rows = this.createRows([], data.dimensions, {});
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
          [dim.id]: cat.id,
        };
        this.createRows(rows, dimsLeft.slice(1), path);
      });
    }
    return rows;
  }

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

  getGoalsForChoice(categoryChoice: MetricCategoryChoice | null | undefined) {
    const selectedCategories = categoryChoice ? Object.values(categoryChoice) : [];
    const catStr = JSON.stringify(selectedCategories.sort()); // JS 🤮
    const goals = this.data.goals.find(g => JSON.stringify([...g.categories].sort()) == catStr);
    if (!goals) return null;
    return goals.values;
  }

  flatten(categoryChoice: MetricCategoryChoice | undefined) {
    const byYear: Map<number, number> = new Map();
    this.rows.forEach(row => {
      const { year } = row;
      if (categoryChoice) {
        if (!Object.entries(categoryChoice).every(([dimId, choice]) => choice ? row.dimCats[dimId] == choice : true)) {
          return;
        }
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
    const out: MetricSlice = {
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
    };
    return out;
  }

  private isForecastYear(year: number) {
    return this.data.forecastFrom && year >= this.data.forecastFrom;
  }

  sliceBy(dimensionId: string, sort: boolean = false, categoryChoice: MetricCategoryChoice | undefined) {
    const byYear: Map<number, Map<string, number>> = new Map();

    this.rows.forEach(row => {
      const { year } = row;

      let catVals = byYear.get(year);
      if (!catVals) {
        catVals = new Map();
        byYear.set(year, catVals);
      }
      // Process only those rows that match the category choices
      if (categoryChoice) {
        if (!Object.entries(categoryChoice).every(([dimId, choice]) => choice ? row.dimCats[dimId] == choice : true)) {
          return;
        }
      }
      const cat = row.dimCats[dimensionId];
      let val = catVals.get(cat);
      if (val === undefined) {
        val = 0;
      }
      const rowVal = row.value;
      if (rowVal !== null) val += rowVal;
      catVals.set(cat, val);
    })
    const dim = this.data.dimensions.find(dim => dim.id === dimensionId)!;
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
    let categoryValues: MetricCategoryValues[] = dim.categories.map(cat => {
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
    const out: MetricSlice = {
      categoryValues: [...ordered, ...unordered],
      historicalYears,
      forecastYears,
      totalValues,
    };
    return out;
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
  const cube = useMemo(() => new DimensionalMetric(metric), [metric]);

  const metricDims = new Map(metric.dimensions.map(dim => [dim.originalId, dim]));
  let defaultSelection = {};
  let defaultSliceDim: string | undefined = metric.dimensions[0]?.id;
  let goalAffectsPlot = false
  if (activeGoal) {
    const matchingDims = activeGoal.dimensions.filter(gdim => metricDims.has(gdim.dimension));
    matchingDims.forEach(gdim => {
      const metricDim = metricDims.get(gdim.dimension)!;
      const catMatch = metricDim.categories.find(cat => cat.originalId === gdim.category);
      if (catMatch) {
        defaultSelection[metricDim.id] = catMatch.id;
      }
    })
    if (defaultSliceDim && Object.hasOwn(defaultSelection, defaultSliceDim)) {
      defaultSliceDim = metric.dimensions.find(dim => !defaultSelection[dim.id])?.id;
    }
    goalAffectsPlot = true;
  }
  const [sliceConfig, setSliceConfig] = useState<SliceConfig>({dimensionId: defaultSliceDim, categories: defaultSelection});

  useEffect(() => {
    if (!goalAffectsPlot) return;
    if (sliceConfig.dimensionId != defaultSliceDim || sliceConfig.categories != defaultSelection) {
      setSliceConfig({dimensionId: defaultSliceDim, categories: defaultSelection});
    }
  }, [activeGoal])

  const sliceableDims = metric.dimensions.filter(dim => !sliceConfig.categories[dim.id]);
  const slicedDim = metric.dimensions.find(dim => dim.id === sliceConfig.dimensionId);

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

  let controls = metric.dimensions.length > 1 ? (
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
    { metric.dimensions.map(dim => {
      //if (dim.id == sliceDimension) return null;
      return (
        <Col md={4} className="d-flex" key={dim.id}>
          <SelectDropdown
            id={`dim-${dim.id}`}
            label={dim.label}
            options={dim.categories}
            value={dim.categories.find(cat => sliceConfig.categories[dim.id] === cat.id) || null}
            isMulti={false}
            isClearable={true}
            onChange={(newValue) => {
              setSliceConfig(old => {
                let dimensionId = old.dimensionId;
                if (dimensionId === dim.id) {
                  dimensionId = sliceableDims.find(sd => sd.id !== dim.id)?.id;
                }
                const val = {
                  categories: {
                    ...old.categories,
                    [dim.id]: newValue?.id || undefined,
                  },
                  dimensionId,
                };
                return val;
              })
            }}
          />
        </Col>
      );
    })}
    </Row>
  ) : null;

  return (
    <>
      {controls}
      <Plot
        data={plotData}
        layout={layout}
        useResizeHandler
        style={{ width: '100%' }}
        config={{ displayModeBar: false }}
        noValidate
      />
      { /*
      <Tools>
        <CsvDownload 
          data={downloadableTable}
          filename={`${metric.id}.csv`}
          className="btn btn-link btn-sm"
        >
          <CloudArrowDown />
          { ` ${t('download-data')}` }
        </CsvDownload>
      </Tools>
    */ }
    </>
  );
};

DimensionalNodePlot.fragment = gql`
  fragment DimensionalNodeMetric on NodeType {
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
