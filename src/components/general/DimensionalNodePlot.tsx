import { useContext, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useTranslation } from 'next-i18next';
import { tint } from 'polished';
import styled from 'styled-components';
import { useReactiveVar } from '@apollo/client';
import { genColorsFromTheme, setUniqueColors } from 'common/colors';
import SiteContext from 'context/site';
import type { DimensionalNodeMetricFragment } from 'common/__generated__/graphql';
import {
  Col,
  Row,
  UncontrolledDropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
} from 'reactstrap';
import Icon from 'components/common/icon';
import SelectDropdown from 'components/common/SelectDropdown';
import { activeGoalVar } from 'common/cache';
import {
  DimensionalMetric,
  MetricCategoryValues,
  MetricSlice,
  SliceConfig,
} from 'data/metric';
import { useTheme } from 'common/theme';
import { InstanceGoal, useInstance } from 'common/instance';
import { isEqual } from 'lodash';
import { LayoutAxis } from 'plotly.js';
import { getRange } from 'common/preprocess';

const Plot = dynamic(() => import('components/graphs/Plot'), { ssr: false });

const Tools = styled.div`
  padding: 0 1rem 0.5rem;
  text-align: right;
  .btn-link {
    text-decoration: none;
  }
  .icon {
    width: 1.25rem !important;
    height: 1.25rem !important;
    vertical-align: -0.2rem;
  }
`;

function formatHover(
  name: string,
  color: string,
  unit: string,
  predLabel: string | null,
  fontFamily?: string
) {
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
}

type BaselineForecast = { year: number; value: number };

type PlotData = { x: number[]; y: number[] };

function getDefaultSliceConfig(
  cube: DimensionalMetric,
  activeGoal: InstanceGoal | null
) {
  /**
   * By default, we group by the first dimension `metric` has, whatever it is.
   * @todo Is there a better way to select the default?
   *
   * If the currently selected goal has category selections for this metric,
   * we might choose another dimension.
   *
   * NOTE: This is just the default -- the actually active filtering and
   * grouping is controlled by the `sliceConfig` state below.
   */
  const defaultConfig: SliceConfig = {
    dimensionId: cube.dimensions[0]?.id,
    categories: {},
  };

  if (!activeGoal) return defaultConfig;

  const cubeDefault = cube.getChoicesForGoal(activeGoal);
  if (!cubeDefault) return defaultConfig;
  defaultConfig.categories = cubeDefault;
  /**
   * Check if our default dimension to slice by is affected by the
   * goal-based default filters. If so, we should choose another
   * dimension.
   */
  if (
    defaultConfig.dimensionId &&
    cubeDefault.hasOwnProperty(defaultConfig.dimensionId)
  ) {
    const firstPossible = cube.dimensions.find(
      (dim) => !cubeDefault.hasOwnProperty(dim.id)
    );
    defaultConfig.dimensionId = firstPossible?.id;
  }
  return defaultConfig;
}

const getRangeFromSlice = (slice: MetricSlice) =>
  getRange(
    [
      ...(slice.totalValues?.historicalValues ?? []),
      ...(slice.totalValues?.forecastValues ?? []),
      ...(slice.categoryValues ?? []).flatMap((value) => [
        ...value.forecastValues,
        ...value.historicalValues,
      ]),
    ].filter((value): value is number => typeof value === 'number')
  );

type DimensionalNodePlotProps = {
  withReferenceYear?: boolean;
  node: { id: string };
  baselineForecast?: BaselineForecast[];
  metric: NonNullable<DimensionalNodeMetricFragment['metricDim']>;
  startYear: number;
  endYear: number;
  color?: string | null;
  withControls?: boolean;
  withTools?: boolean;
};

export default function DimensionalNodePlot({
  withReferenceYear = false,
  metric,
  startYear,
  color,
  withControls = true,
  withTools = true,
  endYear,
  baselineForecast,
}: DimensionalNodePlotProps) {
  const { t } = useTranslation();
  const activeGoal = useReactiveVar(activeGoalVar);
  const cube = useMemo(() => new DimensionalMetric(metric), [metric]);

  const lastMetricYear = metric.years.slice(-1)[0];
  const usableEndYear =
    lastMetricYear && endYear > lastMetricYear ? lastMetricYear : endYear;

  const defaultConfig = getDefaultSliceConfig(cube, activeGoal);
  const [sliceConfig, setSliceConfig] = useState<SliceConfig>(defaultConfig);

  useEffect(() => {
    /**
     * If the active goal changes, we will reset the grouping + filtering
     * to be compatible with the new choices (if the new goal has common
     * dimensions with our metric).
     */
    if (!activeGoal) return;
    const newDefault = getDefaultSliceConfig(cube, activeGoal);
    if (!newDefault || isEqual(sliceConfig, newDefault)) return;
    setSliceConfig(newDefault);
  }, [activeGoal, cube]);

  const sliceableDims = cube.dimensions.filter(
    (dim) => !sliceConfig.categories[dim.id]
  );
  const slicedDim = cube.dimensions.find(
    (dim) => dim.id === sliceConfig.dimensionId
  );

  let slice: MetricSlice;
  if (slicedDim) {
    slice = cube.sliceBy(slicedDim.id, true, sliceConfig.categories);
  } else {
    slice = cube.flatten(sliceConfig.categories);
  }
  const theme = useTheme();
  const site = useContext(SiteContext);
  const instance = useInstance();

  const defaultColor = color || theme.graphColors.blue070;
  const shapes: Plotly.Layout['shapes'] = [];
  const plotData: Partial<Plotly.PlotData>[] = [];
  const rangeMode = metric.stackable ? 'tozero' : 'normal';
  const filled = metric.stackable;

  const filledStyles = (stackGroup: string) => {
    console.log('filledStyles', stackGroup);
    if (!filled) return {};
    const out: Partial<Plotly.PlotData> = {
      stackgroup: stackGroup,
      //marker: { opacity: 0 },
      line: {
        color: 'white',
        width: 1,
        dash: 'solid',
        shape: 'spline',
        smoothing: 0.8,
      },
    };
    return out;
  };

  let colors: string[];
  const nrCats = slice.categoryValues.length;

  if (nrCats > 1) {
    // If we were asked to use a specific color, we generate the color scheme around it.
    if (color) {
      setUniqueColors(
        slice.categoryValues,
        (cv) => cv.color,
        (cv, color) => {
          cv.color = color;
        },
        defaultColor
      );
    } else {
      colors = genColorsFromTheme(theme, slice.categoryValues.length);
    }
  } else {
    colors = [defaultColor];
  }

  const showReferenceYear = withReferenceYear && !!site.referenceYear;
  const hasHistorical = slice.historicalYears.length > 0;
  const hasForecast = slice.forecastYears.length > 0;
  const predLabel = t('pred');

  let longUnit = metric.unit.htmlShort;
  // FIXME: Nasty hack to show 'CO2e' where it might be applicable until
  // the backend gets proper support for unit specifiers.
  if (
    cube.hasDimension('emission_scope') &&
    !cube.hasDimension('greenhouse_gases')
  ) {
    if (metric.unit.short === 't/Einw./a') {
      longUnit = t('tco2-e-inhabitant');
    } else if (metric.unit.short === 'kt/a') {
      longUnit = t('ktco2-e');
    }
  }

  const unit = metric.unit.htmlShort;

  const genTraces = (cv: MetricCategoryValues, idx: number) => {
    const stackGroup = cv.isNegative ? 'neg' : 'pos';
    const color = cv.color || colors[idx];
    const traceConfig: Partial<Plotly.PlotData> = {
      name: cv.category.label,
      type: 'scatter',
      xaxis: 'x2',
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
      });
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
    }
    if (hasForecast) {
      plotData.push({
        ...traceConfig,
        ...filledStyles(`${stackGroup}-forecast`),
        ...formatHover(
          cv.category.label,
          color,
          unit,
          predLabel,
          theme.fontFamily
        ),
        x: slice.forecastYears,
        y: cv.forecastValues,
        showlegend: false,
        fillcolor: tint(0.3, color),
      });
    }

    if (showReferenceYear) {
      const referenceYearIndex = slice.historicalYears.findIndex(
        (year) => year === site.referenceYear
      );
      const referenceYearData = cv.historicalValues[referenceYearIndex];

      if (typeof referenceYearData === 'undefined') {
        return;
      }

      plotData.push({
        x: [site.referenceYear - 1, site.referenceYear],
        y: [referenceYearData, referenceYearData],
        ...traceConfig,
        ...filledStyles(`${stackGroup}-hist`),
        ...formatHover(cv.category.label, color, unit, null, theme.fontFamily),
        xaxis: 'x',
        showlegend: false,
      });
    }
  };

  slice.categoryValues.forEach((cv, idx) => genTraces(cv, idx));

  const goals = cube.getGoalsForChoice(sliceConfig.categories);

  if (goals) {
    const lineConfig: Partial<Plotly.ShapeLine> = {
      color: theme.graphColors.red090,
      width: 2,
      dash: 'dot',
    };

    if (goals.length === 1) {
      const goal = goals[goals.length - 1];

      plotData.push({
        xaxis: 'x2',
        showlegend: false,
        hoverinfo: 'skip',
        x: [
          startYear === site.referenceYear ? site.minYear : startYear,
          goal.year > usableEndYear ? usableEndYear : goal.year,
        ],
        y: [goal.value, goal.value],
        mode: 'lines',
        line: lineConfig,
      });

      if (usableEndYear === goal.year) {
        plotData.push({
          xaxis: 'x2',
          x: [goal.year],
          y: [goal.value],
          type: 'scatter',
          name: `${t('target')} ${goal.year}`,
          line: lineConfig,
        });
      }
    } else if (goals?.length) {
      const name = t('target');

      plotData.push({
        xaxis: 'x2',
        type: 'scatter',
        name,
        marker: {
          size: 6,
        },
        cliponaxis: false,
        x: goals.map((v) => v.year),
        y: goals.map((v) => v.value),
        hovertemplate: `<b>${name} %{x}: %{y:,.3r} ${unit}</b><extra></extra>`,
        line: lineConfig,
      });
    }
  }

  if (
    baselineForecast &&
    site.baselineName &&
    instance.features?.baselineVisibleInGraphs
  ) {
    const reduceForecastToPlot = (forecasts: PlotData, forecast) =>
      forecast.year >= startYear && forecast.year <= usableEndYear
        ? {
            x: [...forecasts.x, forecast.year],
            y: [...forecasts.y, forecast.value],
          }
        : forecasts;

    const baselinePlot = baselineForecast.reduce(reduceForecastToPlot, {
      x: [],
      y: [],
    });

    plotData.push({
      x: baselinePlot.x,
      y: baselinePlot.y,
      // customdata: baselineForecast.y.map(() => ''),
      xaxis: 'x2',
      // yaxis: 'y',
      mode: 'lines',
      name: site.baselineName,
      type: 'scatter',
      line: {
        color: theme.graphColors.grey060,
        shape: 'spline',
        smoothing: 0.8,
        width: 2,
        dash: 'dash',
      },
      ...formatHover(
        site.baselineName,
        theme.graphColors.grey030,
        unit,
        predLabel
      ),
    });
  }

  if (metric.stackable && slice.totalValues) {
    const label = t('plot-total')!;
    plotData.push({
      xaxis: 'x2',
      type: 'scatter',
      name: label,
      mode: 'lines',
      line: {
        color: theme.graphColors.grey080,
        width: 0,
      },
      x: [...slice.historicalYears, ...slice.forecastYears],
      y: [
        ...slice.totalValues.historicalValues,
        ...slice.totalValues.forecastValues,
      ],
      ...formatHover(
        label,
        theme.graphColors.grey080,
        unit,
        null,
        theme.fontFamily
      ),
      showlegend: false,
    });
  }

  const nrYears = usableEndYear - startYear;

  const commonXAxisConfig: Partial<LayoutAxis> = {
    domain: [0, 1],
    ticklen: 10,
    type: 'date',
    gridcolor: theme.graphColors.grey005,
    tickcolor: theme.graphColors.grey030,
    hoverformat: '%Y',
    automargin: true,
    dtick: nrYears > 30 ? 'M60' : nrYears > 15 ? 'M24' : 'M12',
    fixedrange: true,
  };

  const mainXAxisConfig: Partial<LayoutAxis> = {
    ...commonXAxisConfig,
    range: [`${startYear - 1}-12-31`, `${usableEndYear}-02-01`],
  };

  const referenceXAxisConfig: Partial<LayoutAxis> = {
    ...commonXAxisConfig,
    visible: false,
  };

  const layout: Partial<Plotly.Layout> = {
    height: 300,
    margin: {
      t: 32,
      r: 24,
      b: 48,
      l: 48,
    },
    hovermode: 'x unified',
    annotations: [
      // Custom horizontal y axis label
      {
        ...(longUnit
          ? {
              xref: 'paper',
              yref: 'paper',
              yshift: 10,
              x: 0,
              xanchor: 'left',
              y: 1,
              yanchor: 'bottom',
              text: longUnit || undefined,
              font: {
                size: 14,
              },
              showarrow: false,
            }
          : undefined),
      },
    ],
    yaxis: {
      domain: [0, 1],
      anchor: 'x',
      ticklen: 10,
      gridcolor: theme.graphColors.grey005,
      tickcolor: theme.graphColors.grey030,
      fixedrange: true,
      rangemode: rangeMode,
      range:
        metric.stackable && slice.totalValues
          ? getRangeFromSlice(slice)
          : undefined,
    },
    xaxis: showReferenceYear
      ? {
          ...referenceXAxisConfig,
          visible: true,
          domain: [0, 0.03],
          range: [
            `${site.referenceYear - 1}-01-01`,
            `${site.referenceYear}-01-01`,
          ],
        }
      : referenceXAxisConfig,
    xaxis2: showReferenceYear
      ? {
          ...mainXAxisConfig,
          domain: [0.066, 1],
        }
      : mainXAxisConfig,
    autosize: true,
    dragmode: false,
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
    modebar: {
      add: ['toImage'],
      remove: [
        'zoom2d',
        'zoomIn2d',
        'zoomOut2d',
        'pan2d',
        'select2d',
        'lasso2d',
        'autoScale2d',
        'resetScale2d',
      ],
      color: theme.graphColors.grey090,
      bgcolor: theme.graphColors.grey010,
      activecolor: theme.brandDark,
    },
  };

  const hasGroups = cube.dimensions.some((dim) => dim.groups.length);

  const controls =
    withControls && (metric.dimensions.length > 1 || hasGroups) ? (
      <>
        <Row>
          {metric.dimensions.length > 1 && (
            <Col md={3} className="d-flex" key="dimension">
              <SelectDropdown
                id="dimension"
                className="flex-grow-1"
                label={t('plot-choose-dimension')!}
                onChange={(val) =>
                  setSliceConfig((old) => ({
                    ...old,
                    dimensionId: val?.id || undefined,
                  }))
                }
                options={sliceableDims}
                value={
                  sliceableDims.find(
                    (dim) => sliceConfig.dimensionId === dim.id
                  ) || null
                }
                isMulti={false}
                isClearable={false}
              />
            </Col>
          )}
          {cube.dimensions.map((dim) => {
            const options = cube.getOptionsForDimension(
              dim.id,
              sliceConfig.categories
            );
            return (
              <Col md={4} className="d-flex" key={dim.id}>
                <SelectDropdown
                  id={`dim-${dim.id.replaceAll(':', '-')}`}
                  className="flex-grow-1"
                  helpText={dim.helpText ?? undefined}
                  label={dim.label}
                  options={options}
                  value={options.filter((opt) => opt.selected)}
                  isMulti={true}
                  isClearable={true}
                  onChange={(newValues) => {
                    setSliceConfig((old) => {
                      return cube.updateChoice(dim, old, newValues);
                    });
                  }}
                />
              </Col>
            );
          })}
        </Row>
      </>
    ) : null;

  const plotConfig = {
    displaylogo: false,
    responsive: true,
  };

  return (
    <>
      {controls}

      <div className="mt-3">
        <Plot
          data={plotData}
          layout={layout}
          useResizeHandler
          style={{ width: '100%' }}
          noValidate
          config={plotConfig}
        />
      </div>

      {withTools && (
        <Tools>
          <UncontrolledDropdown size="sm">
            <DropdownToggle caret color="link">
              <Icon name="download" />
              {` ${t('download-data')}`}
            </DropdownToggle>
            <DropdownMenu>
              <DropdownItem
                onClick={async (ev) =>
                  await cube.downloadData(sliceConfig, 'xlsx')
                }
              >
                <Icon name="file" /> XLS
              </DropdownItem>
              <DropdownItem
                onClick={async (ev) =>
                  await cube.downloadData(sliceConfig, 'csv')
                }
              >
                <Icon name="file" /> CSV
              </DropdownItem>
            </DropdownMenu>
          </UncontrolledDropdown>
        </Tools>
      )}
    </>
  );
}
