import { useContext, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useTranslation } from 'next-i18next';
import { tint, transparentize } from 'polished';
import styled, { ThemeContext } from 'styled-components';
import { gql } from '@apollo/client';

import { genColors, genColorsFromTheme } from 'common/colors';
import SiteContext from 'context/site';
import type { DimensionalNodeMetricFragment } from 'common/__generated__/graphql';
import { Col, FormGroup, Input, Label, Row } from 'reactstrap';
import SelectDropdown from 'components/common/SelectDropdown';


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

type MetricValues = {
  forecastValues: (number | null)[],
  historicalValues: (number | null)[],
}

type MetricYears = {
  historicalYears: number[],
  forecastYears: number[],
}

type MetricSliceEntry = MetricValues & {
  category: MetricDimensionCategory,
};

type MetricSlice = MetricYears & {
  catVals: MetricSliceEntry[],
};

type FlattenedMetric = MetricYears & MetricValues;

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
  
    const out: FlattenedMetric = {
      forecastValues,
      historicalValues,
      historicalYears,
      forecastYears,
    };
    return out;
  }

  sliceBy(dimensionId: string, sort: boolean = false, categoryChoice: MetricCategoryChoice | undefined) {
    const byYear: Map<number, Map<string, number>> = new Map();

    if (categoryChoice) {
      console.log('catchoice', categoryChoice);
    }
    let nrRows = 0;
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
      nrRows++;
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
    const catValues = dim.categories.map(cat => {
      const historicalValues: (number | null)[] = [];
      const forecastValues: (number | null)[] = [];
      this.data.years.forEach(year => {
        let val: number | null = byYear.get(year)!.get(cat.id) ?? null;
        if (this.data.forecastFrom && year >= this.data.forecastFrom) {
          forecastValues.push(val);
        } else {
          historicalValues.push(val);
        }
      });
      return {
        category: cat,
        forecastValues,
        historicalValues,
      };
    });
    const historicalYears = this.data.years.filter(year => this.data.forecastFrom ? year < this.data.forecastFrom : true);
    const forecastYears = this.data.years.filter(year => this.data.forecastFrom ? year >= this.data.forecastFrom : false);
    if (catValues.every(cv => cv.category.order != null)) {
      catValues.sort((a, b) => (a.category.order! - b.category.order!));
    } else {
      if (sort) {
        let idx = historicalYears.length - 1;
        let key = 'historicalValues';
        if (idx < 0) {
          idx = forecastYears.length - 1;
          key = 'forecastValues';
        }
        if (idx >= 0) {
          catValues.sort((a, b) => (b[key][idx] - a[key][idx]));
        }
      }
    }
    const out: MetricSlice = {
      catVals: catValues,
      historicalYears,
      forecastYears,
    };
    return out;
  }
}


function formatHover(name: string, color: string, unit: string, predLabel: string | null, fontFamily?: string) {
  const predText = predLabel ? ` <i>(${predLabel})</i>` : '';
  const out: Partial<Plotly.PlotData> = {
    /*
    hovertemplate: `${name}<br />` +
                   `%{x|%Y}: <b>%{y:,.3r}</b> ` +
                   `${unit}` +
                   `${predText}` + 
                   `<extra></extra>`,
    */
    hovertemplate:
      `${name}<br />` +
      `<b>%{y:,.3r}</b> ` +
      `${unit}` +
      `${predText}` +
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
  metric: NonNullable<DimensionalNodeMetricFragment['metricDim']>,
  startYear: number,
  endYear: number,
  color?: string | null,
}


function DimensionalNodePlot(props: DimensionalNodePlotProps) {
  const {
    metric,
    startYear,
    endYear,
    color,
  } = props;

  const { t } = useTranslation();

  const cube = useMemo(() => new DimensionalMetric(metric), [metric]);
  const [sliceConfig, setSliceConfig] = useState<SliceConfig>({dimensionId: metric.dimensions[0]?.id, categories: {}});

  const sliceableDims = metric.dimensions.filter(dim => !sliceConfig.categories[dim.id]);
  const slicedDim = metric.dimensions.find(dim => dim.id === sliceConfig.dimensionId);

  let data: FlattenedMetric | MetricSlice;
  if (slicedDim) {
    data = cube.sliceBy(slicedDim.id, true, sliceConfig.categories);
  } else {
    data = cube.flatten(sliceConfig.categories);
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
  if ('catVals' in data) {
    colors = genColorsFromTheme(theme, data.catVals.length);
  } else {
    colors = [defaultColor]
  }
  const hasHistorical = data.historicalYears.length > 0;
  const hasForecast = data.forecastYears.length > 0;
  const predLabel = t('pred');
  const unit = metric.unit.htmlShort;

  const genTraces = ((cv: MetricSliceEntry, idx: number) => {
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
        x: data.historicalYears,
        y: cv.historicalValues,
        ...filledStyles('hist'),
        ...formatHover(cv.category.label, color, unit, null, theme.fontFamily),
      })
    }
    if (hasHistorical && hasForecast) {
      const lastHist = data.historicalYears.length - 1;
      // Short trace to join historical and forecast series together
      plotData.push({
        ...traceConfig,
        ...filledStyles('join'),
        x: [data.historicalYears[lastHist], data.forecastYears[0]],
        y: [cv.historicalValues[lastHist], cv.forecastValues[0]],
        hoverinfo: 'skip',
        hovertemplate: undefined,
        showlegend: false,
        fillcolor: tint(0.3, color),
      });
    };
    if (hasForecast) {
      plotData.push({
        ...traceConfig,
        ...filledStyles('forecast'),
        ...formatHover(cv.category.label, color, unit, predLabel, theme.fontFamily),
        x: data.forecastYears,
        y: cv.forecastValues,
        showlegend: false,
        fillcolor: tint(0.3, color),
      })
    }
  });

  if ('catVals' in data) {
    data.catVals.map((cv, idx) => genTraces(cv, idx));
  } else {
    genTraces({
      forecastValues: data.forecastValues,
      historicalValues: data.historicalValues,
      category: {
        id: metric.id,
        label: metric.name,
        color: defaultColor,
      }
    }, 0);
  }

  /*
  if (targetYearGoal) {
    shapes.push({
      type: 'line',
      yref: 'y',
      x0: Date.parse(`Nov 1, ${startYear - 1}`),
      y0: targetYearGoal,
      x1: Date.parse(`Feb 1, ${endYear}`),
      y1: targetYearGoal,
      line: {
        color: theme.graphColors.red070,
        width: 2,
        dash: 'dot',
      },
    });
    plotData.push({
      x: [endYear],
      y: [targetYearGoal],
      type: 'scatter',
      xaxis: 'x2',
      yaxis: 'y1',
      name: `${t('target')} ${targetYear}`,
      line: {
        color: theme.graphColors.red070,
        width: 2,
        dash: 'dot',
      },
    });
  }
  */
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
      dtick: nrYears > 15 ? 'M24' : 'M12',
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
        categories {
          id
          label
          color
          order
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
