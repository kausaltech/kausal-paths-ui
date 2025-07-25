import { useTheme } from '@emotion/react';
import { type Theme } from '@mui/material/styles';
import type * as echarts from 'echarts/core';
import { type TFunction, useTranslation } from 'next-i18next';
import { tint } from 'polished';

import { beautifyValue } from '@/common/preprocess';
import { Chart } from '@/components/charts/Chart';

/**
 * Receives filtered node data as tables and plots them in a chart.
 *
 * @param dataTable - The categories table to plot. Visualized as bars.
 * @param goalTable - The goal table to plot. If present, visualized as a dots.
 * @param baselineTable - The baseline table to plot. If present, visualized as a dashed line.
 * @param progressTable - The progress table to plot. If present, visualized as a diamonds.
 * @param totalTable - The total table to plot. If present, visualized as a line only if showTotalLine is true. Otherwise only visible in tooltip.
 * @param unit - The unit of the data.
 * @param referenceYear - The reference year to plot. If present, we are aware that there is a gap in the data.
 * @param forecastRange - The forecast range to plot. Visualized as an areaMarker. Datapoints in the range marked as forecast.
 * @param categoryColors - The colors of the categories.
 * @param maximumFractionDigits - Used for beautifying and localizing values for display.
 * @param baselineLabel - The label of the baseline.
 * @param showTotalLine - Whether to show the total line.
 */

type NodeGraphProps = {
  dataTable: DataTable;
  goalTable: DataTable | undefined;
  baselineTable: DataTable | undefined;
  progressTable: DataTable | undefined;
  totalTable: DataTable | undefined;
  unit: string;
  referenceYear: number | undefined | null;
  forecastRange: [number, number];
  categoryColors: Record<string, string>;
  maximumFractionDigits: number | undefined;
  baselineLabel: string | undefined;
  showTotalLine?: boolean;
  onClickMeasuredEmissions?: (year: number) => void;
};

type DataTable = (string | number | null | undefined)[][];

// Constants
const CHART_HEIGHT = '350px';
const BAR_WIDTH = '85%';
const BAR_MAX_WIDTH = '50';
const BAR_CATEGORY_GAP = '20%';
const FORECAST_TINT_AMOUNT = 0.35;

// Index of the dataset in the dataset array
const PLOT_INDEX = 0;
const GOAL_INDEX = 1;
const BASELINE_INDEX = 2;
const PROGRESS_INDEX = 3;
const TOTAL_INDEX = 4;

export default function NodeGraph({
  dataTable,
  goalTable,
  baselineTable,
  progressTable,
  totalTable,
  unit,
  referenceYear,
  forecastRange,
  categoryColors,
  maximumFractionDigits,
  baselineLabel,
  showTotalLine = false,
  onClickMeasuredEmissions,
}: NodeGraphProps) {
  const theme = useTheme();
  const { t } = useTranslation();

  // Figure out the start year of the dataset sans reference year
  const startYear = referenceYear ? dataTable[0][2] : dataTable[0][1];
  const endYear = dataTable[0][dataTable[0].length - 1];

  // Define events that are supposed to propagate up to the parent component
  // onClickMeasuredEmissions checks if the clicked year has progress data (nzc) and if so, calls the onClickMeasuredEmissions function
  const handleChartClick = (dataPoint: [number, number]) => {
    // If no callback is provided, no point in going further
    if (!onClickMeasuredEmissions) return;
    // If the clicked year is the reference year, we do nothing
    // By definition reference year has no progress data
    if (dataPoint[0] === 0 && referenceYear) return;

    // If some other year is clicked, we need to offset the index if referenceYear is present
    const offsetForReferenceYear = referenceYear ? 1 : 0;
    const clickedYear = Number(startYear) + dataPoint[0] - offsetForReferenceYear;

    if (progressTable) {
      // Find the index of the clicked year in the progress table
      const progressDataPoint = progressTable[0].indexOf(clickedYear);
      // Check if the clicked year has progress data
      if (progressDataPoint && progressTable[1][progressDataPoint] !== undefined) {
        onClickMeasuredEmissions(clickedYear);
      }
    }
  };

  const fullDataset: {
    source: DataTable | undefined;
    sourceHeader: boolean;
  }[] = [
    {
      source: dataTable,
      sourceHeader: true,
    },
    {
      source: goalTable,
      sourceHeader: true,
    },
    {
      source: baselineTable,
      sourceHeader: true,
    },
    {
      source: progressTable,
      sourceHeader: true,
    },
    {
      source: totalTable,
      sourceHeader: true,
    },
  ];

  const specialSeriesLabels = {
    Total: t('plot-total'),
    Goal: t('target'),
    Baseline: baselineLabel || t('plot-baseline'),
    Progress: t('observed-emissions'),
  };

  const hasGoalData = goalTable !== undefined;
  const hasBaselineData = baselineTable !== undefined;
  const hasProgressData = progressTable !== undefined;

  const legendData = createLegendData(
    fullDataset,
    specialSeriesLabels,
    categoryColors,
    theme,
    showTotalLine
  );

  const visibleForecastMinYear = Math.max(forecastRange[0], Number(startYear));
  const visibleForecastMaxYear = Math.min(forecastRange[1], Number(endYear));

  // Calculate indices for the forecast range
  const markAreaStartIndex =
    fullDataset[PLOT_INDEX].source?.[0]?.findIndex(
      (year) => Number(year) === visibleForecastMinYear
    ) - 1;
  const markAreaEndIndex =
    fullDataset[PLOT_INDEX].source?.[0]?.findIndex(
      (year) => Number(year) === visibleForecastMaxYear
    ) - 1;

  // Check if forecast range years exist in the data
  const hasForecastData = markAreaStartIndex > -1 && markAreaEndIndex > -1;

  const isForecastYear = (year: number) => {
    return year >= forecastRange[0] && year <= forecastRange[1];
  };

  const createTooltipFormatter = () => {
    return function (params: any) {
      if (!Array.isArray(params)) return '';
      const dataIndex = params[0]?.dataIndex;
      if (typeof dataIndex !== 'number') return '';

      const isForecast =
        hasForecastData && dataIndex >= markAreaStartIndex && dataIndex <= markAreaEndIndex;
      const year = fullDataset[PLOT_INDEX]?.source?.[0]?.[dataIndex + 1]; // +1 because first column is "Category"
      const isReferenceYear = Boolean(referenceYear && Number(year) === referenceYear);

      return buildTooltipContent(
        params,
        year,
        isForecast,
        isReferenceYear,
        unit,
        maximumFractionDigits,
        specialSeriesLabels,
        t
      );
    };
  };

  const series = [
    ...createBarSeries(fullDataset, categoryColors, theme, isForecastYear),
    hasGoalData ? createGoalSeries(theme, specialSeriesLabels.Goal) : null,
    hasBaselineData ? createBaselineSeries(theme, specialSeriesLabels.Baseline) : null,
    hasProgressData ? createProgressSeries(theme, specialSeriesLabels.Progress) : null,
    createTotalSeries(
      theme,
      t,
      markAreaStartIndex,
      markAreaEndIndex,
      showTotalLine,
      specialSeriesLabels.Total
    ),
  ];

  const option: echarts.EChartsCoreOption = {
    aria: {
      enabled: true,
    },
    legend: {
      orient: 'horizontal',
      right: 10,
      bottom: 10,
      data: legendData,
      formatter: (name) => {
        return specialSeriesLabels[name as keyof typeof specialSeriesLabels] || name;
      },
    },
    grid: {
      bottom: 100,
    },
    tooltip: {
      trigger: 'axis',
      position: function (pos, params, dom, rect, size) {
        const obj = { top: 60 };
        obj[['left', 'right'][+(pos[0] < size.viewSize[0] / 2)]] = 5;
        return obj;
      },
      confine: true,
      formatter: createTooltipFormatter(),
    },
    dataset: fullDataset,
    xAxis: {
      type: 'category',
      axisTick: {
        alignWithLabel: true,
      },
    },
    yAxis: {
      name: unit,
      type: 'value',
    },
    barGap: 0,
    barCategoryGap: BAR_CATEGORY_GAP,
    series: series,
  };

  return (
    <Chart
      isLoading={false}
      data={option}
      height={CHART_HEIGHT}
      className="plot-container"
      onZrClick={handleChartClick}
    />
  );
}

function createLegendData(
  dataset: {
    source: DataTable | undefined;
    sourceHeader: boolean;
  }[],
  specialSeriesLabels: Record<string, string>,
  categoryColors: Record<string, string>,
  theme: Theme,
  showTotalLine: boolean
) {
  const regularSeriesLegend =
    dataset[PLOT_INDEX].source &&
    dataset[PLOT_INDEX].source
      .slice(1) // Remove header row
      .map((row, idx) => ({
        name: row[0],
        itemStyle: {
          color: categoryColors[idx] ?? theme.graphColors.blue070,
        },
      }));

  const specialSeriesLegend: { name: string; itemStyle: { color: string } }[] = [];
  if (dataset[GOAL_INDEX].source !== undefined) {
    specialSeriesLegend.push({
      name: specialSeriesLabels.Goal,
      itemStyle: {
        color: theme.graphColors.red090,
      },
    });
  }
  if (dataset[BASELINE_INDEX].source !== undefined) {
    specialSeriesLegend.push({
      name: specialSeriesLabels.Baseline,
      itemStyle: {
        color: theme.graphColors.grey060,
      },
    });
  }
  if (dataset[PROGRESS_INDEX].source !== undefined) {
    specialSeriesLegend.push({
      name: specialSeriesLabels.Progress,
      itemStyle: {
        color: theme.themeColors.black,
      },
    });
  }
  if (showTotalLine) {
    specialSeriesLegend.push({
      name: specialSeriesLabels.Total,
      lineStyle: {
        color: theme.graphColors.red070,
      },
      itemStyle: {
        opacity: 0,
      },
    });
  }

  return [...regularSeriesLegend, ...specialSeriesLegend];
}

function createBarSeries(
  dataset: {
    source: DataTable | undefined;
    sourceHeader: boolean;
  }[],
  categoryColors: Record<string, string>,
  theme: Theme,
  isForecastYear: (year: number) => boolean
) {
  return (
    dataset[PLOT_INDEX].source &&
    dataset[PLOT_INDEX].source
      .slice(1) // Remove header row
      .map((row, idx) => ({
        type: 'bar',
        seriesLayoutBy: 'row',
        stack: 'x',
        name: row[0],
        stackStrategy: 'samesign',
        datasetIndex: PLOT_INDEX,
        itemStyle: {
          color: (param: any) => {
            const dataYear = param.data[param.encode.x[0]];
            const baseColor = categoryColors[idx] ?? theme.graphColors.blue070;
            return isForecastYear(dataYear) ? tint(FORECAST_TINT_AMOUNT, baseColor) : baseColor;
          },
        },
        barWidth: BAR_WIDTH,
        barMaxWidth: BAR_MAX_WIDTH,
      }))
  );
}

function createGoalSeries(theme: Theme, name: string) {
  return {
    type: 'line',
    seriesLayoutBy: 'row',
    datasetIndex: GOAL_INDEX,
    name: name,
    symbol: 'circle',
    symbolSize: 8,
    smooth: true,
    itemStyle: {
      color: theme.graphColors.red090,
    },
    lineStyle: {
      color: 'rgba(0, 0, 0, 0)',
    },
    markLine: {
      silent: true,
      lineStyle: {
        color: theme.graphColors.red090,
        width: 2,
      },
      data: [
        [
          {
            name: 'GoalMark',
            yAxis: 5,
          },
        ],
      ],
    },
  };
}

function createBaselineSeries(theme: Theme, name: string) {
  return {
    type: 'line',
    seriesLayoutBy: 'row',
    datasetIndex: BASELINE_INDEX,
    name: name,
    symbol: 'none',
    step: false,
    itemStyle: {
      color: theme.graphColors.grey060,
    },
    lineStyle: {
      color: theme.graphColors.grey060,
      type: 'dashed',
    },
  };
}

function createProgressSeries(theme: Theme, name: string) {
  return {
    type: 'line',
    seriesLayoutBy: 'row',
    datasetIndex: PROGRESS_INDEX,
    name: name,
    symbol: 'diamond',
    symbolSize: 8,
    step: false,
    connectNulls: true,
    itemStyle: {
      color: theme.themeColors.black,
    },
    lineStyle: {
      color: theme.themeColors.black,
    },
  };
}

function createTotalSeries(
  theme: Theme,
  t: TFunction,
  markAreaStartIndex: number,
  markAreaEndIndex: number,
  showTotalLine: boolean,
  name: string
) {
  // If forecast is outside the visible range, we don't color the forecast area
  const hasForecastData = markAreaStartIndex > -1 && markAreaEndIndex > -1;
  return {
    type: 'line',
    seriesLayoutBy: 'row',
    datasetIndex: TOTAL_INDEX,
    name: name,
    symbol: 'none',
    lineStyle: {
      color: theme.graphColors.red070,
      opacity: showTotalLine ? 1 : 0,
    },
    markArea: hasForecastData
      ? {
          silent: true,
          itemStyle: {
            color: theme.graphColors.blue030,
            opacity: 0.1,
          },
          label: {
            position: [0, -15],
            fontSize: 11,
          },
          data: [
            [
              {
                name: t('table-scenario-forecast'),
                xAxis: markAreaStartIndex,
              },
              {
                xAxis: markAreaEndIndex,
              },
            ],
          ],
        }
      : undefined,
  };
}

function buildTooltipContent(
  params: any[],
  year: string | number | null | undefined,
  isForecast: boolean,
  isReferenceYear: boolean,
  unit: string,
  maximumFractionDigits: number | undefined,
  specialSeriesLabels: Record<string, string>,
  t: TFunction
) {
  if (!year) return '';
  const yearLabel = isForecast
    ? t('pred')
    : isReferenceYear
      ? t('comparison-year')
      : t('plot-measured');

  let tooltip = `<div style="font-weight: bold; margin-bottom: 5px;">
    ${year} (${yearLabel})
  </div>`;

  const SPECIAL_SERIES_NAMES = [
    specialSeriesLabels.Total,
    specialSeriesLabels.Goal,
    specialSeriesLabels.Baseline,
    specialSeriesLabels.Progress,
  ] as const;
  // Separate regular series from special series
  const regularSeries = params.filter(
    (param) => !SPECIAL_SERIES_NAMES.includes(param.seriesName ?? '')
  );
  const specialSeries = params.filter((param) =>
    SPECIAL_SERIES_NAMES.includes(param.seriesName ?? '')
  );

  // Add regular series data
  if (regularSeries.length > 0) {
    tooltip += `<div style="border-top: 1px solid #ccc; margin: 8px 0 4px 0;"></div>`;
    [...regularSeries].reverse().forEach((param) => {
      tooltip += buildTooltipRow(param, unit, maximumFractionDigits);
    });
  }

  // Add special series data
  if (specialSeries.length > 0) {
    tooltip += `<div style="border-top: 1px solid #ccc; margin: 8px 0 4px 0;"></div>`;
    specialSeries.forEach((param) => {
      tooltip += buildTooltipRow(param, unit, maximumFractionDigits, specialSeriesLabels);
    });
  }

  return tooltip;
}

function buildTooltipRow(
  param: any,
  unit: string,
  maximumFractionDigits: number | undefined,
  specialSeriesLabels?: Record<string, string>
) {
  const value = beautifyValue(
    param.data[param.encode.y[0]],
    undefined,
    maximumFractionDigits ?? undefined
  );

  if (value === 0 || value === undefined || value === null) return '';
  if (!param.seriesName || param.value === undefined) return '';

  const color = param.color || '#000';
  const displayName = specialSeriesLabels?.[param.seriesName] || param.seriesName;

  return `<div style="margin: 2px 0;">
    <span style="display: inline-block; width: 10px; height: 10px; background-color: ${color}; margin-right: 5px;"></span>
    ${displayName}: <strong>${value} ${unit}</strong>
  </div>`;
}
