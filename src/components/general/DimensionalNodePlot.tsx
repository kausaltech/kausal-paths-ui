import { useEffect, useMemo, useState } from 'react';

import dynamic from 'next/dynamic';

import { useReactiveVar } from '@apollo/client';
import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import { isEqual } from 'lodash';
import { useTranslation } from 'next-i18next';
import type { LayoutAxis } from 'plotly.js';
import { tint } from 'polished';
import {
  Col,
  DropdownItem,
  DropdownMenu,
  DropdownToggle,
  Row,
  UncontrolledDropdown,
} from 'reactstrap';

import { type DimensionalNodeMetricFragment } from '@/common/__generated__/graphql';
import { activeGoalVar } from '@/common/cache';
import { genColorsFromTheme, setUniqueColors } from '@/common/colors';
import { useFeatures, useInstance } from '@/common/instance';
import { getRange } from '@/common/preprocess';
import SelectDropdown from '@/components/common/SelectDropdown';
import Icon from '@/components/common/icon';
import { useSite } from '@/context/site';
import {
  DimensionalMetric,
  type MetricCategoryValues,
  type MetricSlice,
  type SliceConfig,
} from '@/data/metric';
import { metricHasProgressTrackingScenario } from '@/utils/progress-tracking';

const Plot = dynamic(() => import('@/components/graphs/Plot'), { ssr: false });

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
  fontFamily?: string,
  maximumFractionDigits?: number
) {
  const valueFormatter =
    // Round to maximumFractionDigits if provided, otherwise 3 significant digits
    typeof maximumFractionDigits === 'number' ? `.${maximumFractionDigits}f` : '.3r';
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
      `<b>%{y:,${valueFormatter}}</b> ` +
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
  baselineForecast?: BaselineForecast[];
  metric: NonNullable<DimensionalNodeMetricFragment['metricDim']>;
  startYear: number;
  endYear: number;
  color?: string | null;
  withControls?: boolean;
  withTools?: boolean;
  onClickMeasuredEmissions?: (year: number) => void;
  hasNegativeValues?: boolean;
};

export default function DimensionalNodePlot({
  hasNegativeValues,
  withReferenceYear = false,
  metric,
  startYear,
  color,
  withControls = true,
  withTools = true,
  endYear,
  baselineForecast,
  onClickMeasuredEmissions,
}: DimensionalNodePlotProps) {
  const { t } = useTranslation();
  const activeGoal = useReactiveVar(activeGoalVar);
  const theme = useTheme();
  const site = useSite();
  const instance = useInstance();
  const hasProgressTracking = metricHasProgressTrackingScenario(metric, site.scenarios);
  const observedEmissionsLabel = t('observed-emissions');

  const metrics = useMemo(() => {
    const defaultMetric = new DimensionalMetric(metric);

    return {
      default: defaultMetric,
      progress: hasProgressTracking ? new DimensionalMetric(metric, 'progress_tracking') : null,
    };
  }, [metric, hasProgressTracking]);

  const cube = metrics.default;

  const lastMetricYear = metric.years.slice(-1)[0];
  const usableEndYear = lastMetricYear && endYear > lastMetricYear ? lastMetricYear : endYear;

  const defaultConfig = cube.getDefaultSliceConfig(activeGoal);
  const [sliceConfig, setSliceConfig] = useState<SliceConfig>(defaultConfig);

  const maximumFractionDigits = useFeatures().maximumFractionDigits ?? undefined;

  useEffect(() => {
    /**
     * If the active goal changes, we will reset the grouping + filtering
     * to be compatible with the new choices (if the new goal has common
     * dimensions with our metric).
     */
    if (!activeGoal) return;
    const newDefault = cube.getDefaultSliceConfig(activeGoal);
    if (!newDefault || isEqual(sliceConfig, newDefault)) return;
    setSliceConfig(newDefault);
  }, [activeGoal, cube, sliceConfig]);

  const sliceableDims = cube.dimensions.filter((dim) => !sliceConfig.categories[dim.id]);
  const slicedDim = cube.dimensions.find((dim) => dim.id === sliceConfig.dimensionId);

  let slice: MetricSlice;

  if (slicedDim) {
    slice = cube.sliceBy(slicedDim.id, true, sliceConfig.categories);
  } else {
    slice = cube.flatten(sliceConfig.categories);
  }

  const defaultColor = color || theme.graphColors.blue070;
  const shapes: Plotly.Layout['shapes'] = [];
  const plotData: Partial<Plotly.PlotData>[] = [];
  const rangeMode = metric.stackable ? 'tozero' : 'normal';
  const filled = metric.stackable;

  const filledStyles = (stackGroup: string, color: string = 'white') => {
    if (!filled) return {};
    const out: Partial<Plotly.PlotData> = {
      stackgroup: stackGroup,
      //marker: { opacity: 0 },
      line: {
        color: color,
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

  const showReferenceYear =
    withReferenceYear && !!site.referenceYear && site.minYear !== site.referenceYear;
  const hasHistorical = slice.historicalYears.length > 0;
  const hasForecast = slice.forecastYears.length > 0;
  const predLabel = t('pred');

  let longUnit = metric.unit.htmlShort;
  // FIXME: Nasty hack to show 'CO2e' where it might be applicable until
  // the backend gets proper support for unit specifiers.
  if (cube.hasDimension('emission_scope') && !cube.hasDimension('greenhouse_gases')) {
    if (metric.unit.short === 't/Einw./a') {
      longUnit = t('tco2-e-inhabitant');
    } else if (metric.unit.short === 'kt/a') {
      longUnit = t('ktco2-e');
    }
  }

  const unit = metric.unit.htmlShort;

  const genTraces = (cv: MetricCategoryValues, idx: number) => {
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
      showlegend: false,
    };

    const hasNegativeForecast = cv.forecastValues.every((value) => value < 0);
    const hasNegativeHistorical = cv.historicalValues.every((value) => value < 0);

    const forecastStackGroup = hasNegativeForecast ? 'neg-forecast' : 'pos-forecast';
    const historicalStackGroup = hasNegativeHistorical ? 'neg-hist' : 'pos-hist';

    if (hasHistorical) {
      plotData.push({
        ...traceConfig,
        x: slice.historicalYears,
        y: cv.historicalValues,
        ...filledStyles(historicalStackGroup),
        ...formatHover(
          cv.category.label,
          color,
          unit,
          null,
          theme.fontFamily,
          maximumFractionDigits
        ),
      });
    }

    if (hasHistorical && hasForecast) {
      const lastHist = slice.historicalYears.length - 1;

      plotData.push({
        ...traceConfig,
        ...filledStyles(`${forecastStackGroup}-join`),
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
        x: slice.forecastYears,
        y: cv.forecastValues,
        ...filledStyles(forecastStackGroup),
        ...formatHover(
          cv.category.label,
          color,
          unit,
          predLabel,
          theme.fontFamily,
          maximumFractionDigits
        ),
        showlegend: true,
        fillcolor: tint(0.3, color),
      });
    }

    if (showReferenceYear) {
      const referenceYearIndex = slice.historicalYears.findIndex(
        (year) => year === site.referenceYear
      );
      const referenceYearData = cv.historicalValues[referenceYearIndex];

      if (typeof referenceYearData !== 'undefined') {
        plotData.push({
          x: [site.referenceYear - 1, site.referenceYear],
          y: [referenceYearData, referenceYearData],
          ...traceConfig,
          ...filledStyles(`${historicalStackGroup}`),
          ...formatHover(
            cv.category.label,
            color,
            unit,
            null,
            theme.fontFamily,
            maximumFractionDigits
          ),
          xaxis: 'x',
          showlegend: false,
        });
      }
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
          hovertemplate: `<b>${t('target')} %{x}: %{y:,.${maximumFractionDigits ?? 3}r} ${unit}</b><extra></extra>`,
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

  if (baselineForecast && site.baselineName && instance.features?.baselineVisibleInGraphs) {
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
        predLabel,
        theme.fontFamily,
        maximumFractionDigits
      ),
    });
  }

  if (metric.stackable && slice.totalValues) {
    const label = t('plot-total');
    const totalSumX = [...slice.historicalYears, ...slice.forecastYears];
    const totalSumY = [...slice.totalValues.historicalValues, ...slice.totalValues.forecastValues];

    plotData.push({
      xaxis: 'x2',
      type: 'scatter',
      name: label,
      mode: 'lines',
      line: {
        color: theme.graphColors.grey080,
        width: 0,
      },
      x: totalSumX,
      y: totalSumY,
      ...formatHover(
        label,
        theme.graphColors.grey080,
        unit,
        null,
        theme.fontFamily,
        maximumFractionDigits
      ),
      showlegend: false,
    });

    if (hasNegativeValues) {
      plotData.push({
        xaxis: 'x2',
        type: 'scatter',
        name: label,
        mode: 'lines',
        line: {
          color: theme.graphColors.grey080,
          width: 0.8,
          dash: 'dot',
        },
        x: totalSumX,
        y: totalSumY,
        hoverinfo: 'skip',
        showlegend: true,
      });
    }

    if (hasProgressTracking && metrics.progress && slicedDim) {
      const progressSlice = metrics.progress.sliceBy(slicedDim.id, true, sliceConfig.categories);
      const progressYears =
        metric.measureDatapointYears?.filter((year) => year !== instance.referenceYear) ?? [];

      const referenceYearIndex = slice.historicalYears.findIndex(
        (year) => year === instance.referenceYear
      );

      const historicalYears =
        referenceYearIndex !== -1
          ? progressSlice.historicalYears.slice(referenceYearIndex + 1)
          : progressSlice.historicalYears;

      const historicalValues =
        referenceYearIndex !== -1
          ? (progressSlice?.totalValues?.historicalValues.slice(referenceYearIndex + 1) ?? [])
          : (progressSlice?.totalValues?.historicalValues ?? []);

      if (progressSlice.totalValues && progressYears?.length) {
        const lastHist = slice.historicalYears.length - 1;
        const totalSumX = [site.minYear, ...historicalYears, ...progressSlice.forecastYears];
        const totalSumY = [
          slice.totalValues.historicalValues[lastHist],
          ...historicalValues,
          ...progressSlice.totalValues.forecastValues,
        ];

        /**
         * Filter out data for years that are not in the progress scenario.
         * Include the reference year in order to draw a line from the total reference
         * year emissions to the first observed year emissions.
         */
        const { x: filteredX, y: filteredY } = totalSumX.reduce(
          (acc, x, index) =>
            [instance.referenceYear, ...progressYears].includes(x)
              ? { x: [...acc.x, x], y: [...acc.y, totalSumY[index]] }
              : acc,
          { x: [] as number[], y: [] as number[] }
        );

        plotData.push({
          xaxis: 'x2',
          type: 'scatter',
          name: observedEmissionsLabel,
          mode: 'lines+markers',
          x: filteredX,
          y: filteredY,
          line: {
            color: theme.themeColors.black,
            width: 1,
          },
          ...formatHover(
            observedEmissionsLabel,
            theme.themeColors.black,
            unit,
            null,
            theme.fontFamily,
            maximumFractionDigits
          ),
          marker: {
            symbol: 'x',
            size: 8,
            color: 'black',
            line: {
              color: 'white',
              width: 1,
            },
            opacity: filteredX.map((x) => (x === instance.referenceYear ? 0 : 1)),
          },
          showlegend: true,
        });
      }
    }
  }

  const nrYears = usableEndYear - startYear;

  const handlePlotClick = (event: Plotly.PlotMouseEvent) => {
    const observedDataPoint = event.points?.find(
      (point) => point.data.name === observedEmissionsLabel
    );

    if (
      observedDataPoint?.x &&
      observedDataPoint['marker.opacity'] !== 0 && // Ignore hidden data points
      typeof onClickMeasuredEmissions === 'function'
    ) {
      const year = new Date(observedDataPoint.x).getFullYear();

      if (!isNaN(year)) {
        onClickMeasuredEmissions(year);
      }
    }
  };

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

  // Take baseline data into account when deciding the custom y-range for the graph
  const baselineRange = baselineForecast
    ? getRange(baselineForecast?.map((item) => item.value))
    : [undefined, undefined];
  const dataRange =
    metric.stackable && slice.totalValues ? getRangeFromSlice(slice) : [undefined, undefined];

  const rangeMin =
    dataRange[0] && baselineRange[0] ? Math.min(dataRange[0], baselineRange[0]) : dataRange[0];
  const rangeMax =
    dataRange[1] && baselineRange[1] ? Math.max(dataRange[1], baselineRange[1]) : dataRange[1];

  const customRange = rangeMin && rangeMax ? [rangeMin, rangeMax] : undefined;

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
      range: customRange,
    },
    xaxis: showReferenceYear
      ? {
          ...referenceXAxisConfig,
          visible: true,
          domain: [0, 0.03],
          range: [`${site.referenceYear - 1}-01-01`, `${site.referenceYear}-01-01`],
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
                label={t('plot-choose-dimension')}
                onChange={(val) =>
                  setSliceConfig((old) => ({
                    ...old,
                    dimensionId: val?.id || undefined,
                  }))
                }
                options={sliceableDims}
                value={sliceableDims.find((dim) => sliceConfig.dimensionId === dim.id) || null}
                isMulti={false}
                isClearable={false}
              />
            </Col>
          )}
          {cube.dimensions.map((dim) => {
            const options = cube.getOptionsForDimension(dim.id, sliceConfig.categories);
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
          onClick={onClickMeasuredEmissions ? handlePlotClick : undefined}
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
              <DropdownItem onClick={async (ev) => await cube.downloadData(sliceConfig, 'xlsx')}>
                <Icon name="file" /> XLS
              </DropdownItem>
              <DropdownItem onClick={async (ev) => await cube.downloadData(sliceConfig, 'csv')}>
                <Icon name="file" /> CSV
              </DropdownItem>
            </DropdownMenu>
          </UncontrolledDropdown>
        </Tools>
      )}
    </>
  );
}
