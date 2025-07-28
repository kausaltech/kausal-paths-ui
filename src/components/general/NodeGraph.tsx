import { useTheme } from '@emotion/react';
import { Alert } from '@mui/material';
import { type Theme } from '@mui/material/styles';
import * as Sentry from '@sentry/nextjs';
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
 * @param forecastRange - The forecast range to plot. Visualized as an areaMarker. Datapoints in the range marked as forecast. Filtered to the visible range of years.
 * @param categoryColors - The colors of the categories.
 * @param maximumFractionDigits - Used for beautifying and localizing values for display.
 * @param baselineLabel - The label of the baseline.
 * @param showTotalLine - Whether to show the total line.
 */

type NodeGraphProps = {
  dataTable: DataTable;
  goalTable: DataTable | null;
  baselineTable: DataTable | null;
  progressTable: DataTable | null;
  totalTable: DataTable | null;
  unit: string;
  referenceYear: number | undefined | null;
  forecastRange: [number, number] | null;
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

export default function NodeGraph(props: NodeGraphProps) {
  const theme = useTheme();
  const { t } = useTranslation();

  const {
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
  } = props;

  // Figure out the start year of the dataset sans reference year
  const startYear =
    dataTable?.[0] && dataTable[0].length > (referenceYear ? 2 : 1)
      ? referenceYear
        ? dataTable[0][2]
        : dataTable[0][1]
      : null;
  const endYear =
    dataTable?.[0] && dataTable[0].length > 0 ? dataTable[0][dataTable[0].length - 1] : null;

  // Early return if we don't have valid data
  if (!dataTable || !dataTable[0] || dataTable[0].length === 0) {
    Sentry.captureException('NodeGraph: No data available');
    return <Alert severity="error">No data available</Alert>;
  }

  // Define events that are supposed to propagate up to the parent component
  // onClickMeasuredEmissions checks if the clicked year has progress data (nzc) and if so, calls the onClickMeasuredEmissions function
  const handleChartClick = (dataPoint: [number, number]) => {
    // If no callback is provided, no point in going further
    if (!onClickMeasuredEmissions || !startYear) return;
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
  }[] = [];

  // Track actual dataset indices as we build the array
  const datasetIndices = {
    data: -1,
    goal: -1,
    baseline: -1,
    progress: -1,
    total: -1,
  };

  // Add main data dataset (always present)
  if (dataTable && dataTable.length > 0) {
    datasetIndices.data = fullDataset.length;
    fullDataset.push({
      source: dataTable,
      sourceHeader: true,
    });
  }

  // Add goal dataset if present
  if (goalTable && goalTable.length > 0) {
    datasetIndices.goal = fullDataset.length;
    fullDataset.push({
      source: goalTable,
      sourceHeader: true,
    });
  }

  // Add baseline dataset if present
  if (baselineTable && baselineTable.length > 0) {
    datasetIndices.baseline = fullDataset.length;
    fullDataset.push({
      source: baselineTable,
      sourceHeader: true,
    });
  }

  // Add progress dataset if present
  if (progressTable && progressTable.length > 0) {
    datasetIndices.progress = fullDataset.length;
    fullDataset.push({
      source: progressTable,
      sourceHeader: true,
    });
  }

  // Add total dataset if present
  if (totalTable && totalTable.length > 0) {
    datasetIndices.total = fullDataset.length;
    fullDataset.push({
      source: totalTable,
      sourceHeader: true,
    });
  }

  const specialSeriesLabels = {
    Total: t('plot-total'),
    Goal: t('target'),
    Baseline: baselineLabel || t('plot-baseline'),
    Progress: t('observed-emissions'),
  };

  const hasGoalData = goalTable !== null;
  const hasBaselineData = baselineTable !== null;
  const hasProgressData = progressTable !== null;

  const legendData = createLegendData(
    fullDataset,
    datasetIndices,
    specialSeriesLabels,
    categoryColors,
    theme,
    showTotalLine
  );

  // Calculate indices for the forecast range
  const markAreaStartIndex =
    forecastRange && datasetIndices.data >= 0 && fullDataset[datasetIndices.data]?.source?.[0]
      ? fullDataset[datasetIndices.data].source![0].findIndex(
          (year) => Number(year) === forecastRange[0]
        ) - (referenceYear ? 2 : 1)
      : -1;
  const markAreaEndIndex =
    forecastRange && datasetIndices.data >= 0 && fullDataset[datasetIndices.data]?.source?.[0]
      ? fullDataset[datasetIndices.data].source![0].findIndex(
          (year) => Number(year) === forecastRange[1]
        ) - (referenceYear ? 2 : 1)
      : -1;

  // Check if forecast range years exist in the data
  const hasForecastData = markAreaStartIndex > -1 && markAreaEndIndex > -1;

  const isForecastYear = (year: number) => {
    return forecastRange ? year >= forecastRange[0] && year <= forecastRange[1] : false;
  };

  const createTooltipFormatter = () => {
    return function (params: any) {
      if (!Array.isArray(params)) return '';
      const dataIndex = params[0]?.dataIndex;
      if (typeof dataIndex !== 'number') return '';

      const isForecast =
        hasForecastData && dataIndex >= markAreaStartIndex && dataIndex <= markAreaEndIndex;
      const year =
        datasetIndices.data >= 0 && fullDataset[datasetIndices.data]?.source?.[0]?.[dataIndex + 1]; // +1 because first column is "Category"
      const isReferenceYear = Boolean(referenceYear && Number(year) === referenceYear);

      return buildTooltipContent(
        params,
        typeof year === 'string' || typeof year === 'number' ? year : undefined,
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
    ...(createBarSeries(fullDataset, datasetIndices, categoryColors, theme, isForecastYear) || []),
    hasGoalData && datasetIndices.goal >= 0
      ? createGoalSeries(theme, datasetIndices.goal, specialSeriesLabels.Goal)
      : null,
    hasBaselineData && datasetIndices.baseline >= 0
      ? createBaselineSeries(theme, datasetIndices.baseline, specialSeriesLabels.Baseline)
      : null,
    hasProgressData && datasetIndices.progress >= 0
      ? createProgressSeries(theme, datasetIndices.progress, specialSeriesLabels.Progress)
      : null,
    datasetIndices.total >= 0
      ? createTotalSeries(
          theme,
          t,
          datasetIndices.total,
          markAreaStartIndex,
          markAreaEndIndex,
          showTotalLine,
          specialSeriesLabels.Total
        )
      : null,
  ].filter(Boolean);

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
  datasetIndices: {
    data: number;
    goal: number;
    baseline: number;
    progress: number;
    total: number;
  },
  specialSeriesLabels: Record<string, string>,
  categoryColors: Record<string, string>,
  theme: Theme,
  showTotalLine: boolean
) {
  const regularSeriesLegend =
    datasetIndices.data >= 0 &&
    dataset[datasetIndices.data]?.source &&
    dataset[datasetIndices.data].source!.length > 1
      ? dataset[datasetIndices.data]
          .source!.slice(1) // Remove header row
          .map((row, idx) => ({
            name: row[0],
            itemStyle: {
              color: categoryColors[idx] ?? theme.graphColors.blue070,
            },
          }))
      : [];

  const specialSeriesLegend: any[] = [];
  if (datasetIndices.goal >= 0 && dataset[datasetIndices.goal]?.source !== undefined) {
    specialSeriesLegend.push({
      name: specialSeriesLabels.Goal,
      itemStyle: {
        color: theme.graphColors.red090,
      },
    });
  }
  if (datasetIndices.baseline >= 0 && dataset[datasetIndices.baseline]?.source !== undefined) {
    specialSeriesLegend.push({
      name: specialSeriesLabels.Baseline,
      lineStyle: {
        color: theme.graphColors.grey060,
      },
      itemStyle: {
        color: 'transparent',
      },
    });
  }
  if (datasetIndices.progress >= 0 && dataset[datasetIndices.progress]?.source !== undefined) {
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
        color: 'transparent',
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
  datasetIndices: {
    data: number;
    goal: number;
    baseline: number;
    progress: number;
    total: number;
  },
  categoryColors: Record<string, string>,
  theme: Theme,
  isForecastYear: (year: number) => boolean
) {
  if (
    datasetIndices.data < 0 ||
    !dataset[datasetIndices.data]?.source ||
    dataset[datasetIndices.data].source!.length <= 1
  ) {
    return [];
  }

  return dataset[datasetIndices.data]
    .source!.slice(1) // Remove header row
    .map((row, idx) => ({
      type: 'bar',
      seriesLayoutBy: 'row',
      stack: 'x',
      name: row[0],
      stackStrategy: 'samesign',
      datasetIndex: datasetIndices.data,
      itemStyle: {
        color: (param: any) => {
          const dataYear = param.data[param.encode.x[0]];
          const baseColor = categoryColors[idx] ?? theme.graphColors.blue070;
          return isForecastYear(dataYear) ? tint(FORECAST_TINT_AMOUNT, baseColor) : baseColor;
        },
      },
      barWidth: BAR_WIDTH,
      barMaxWidth: BAR_MAX_WIDTH,
    }));
}

function createGoalSeries(theme: Theme, datasetIndex: number, name: string) {
  return {
    type: 'line',
    seriesLayoutBy: 'row',
    datasetIndex: datasetIndex,
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
  };
}

function createBaselineSeries(theme: Theme, datasetIndex: number, name: string) {
  return {
    type: 'line',
    seriesLayoutBy: 'row',
    datasetIndex: datasetIndex,
    name: name,
    symbol: 'none',
    step: false,
    lineStyle: {
      color: theme.graphColors.grey060,
      type: 'dashed',
    },
  };
}

function createProgressSeries(theme: Theme, datasetIndex: number, name: string) {
  return {
    type: 'line',
    seriesLayoutBy: 'row',
    datasetIndex: datasetIndex,
    name: name,
    symbol: 'path://M-4,-2 L-2,-4 L6,4 L4,6 M-2,6 L-4,4 L4,-4 L6,-2',
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
  datasetIndex: number,
  markAreaStartIndex: number,
  markAreaEndIndex: number,
  showTotalLine: boolean,
  name: string
) {
  // If forecast is outside the visible range or indices are invalid, we don't color the forecast area
  const hasForecastData =
    markAreaStartIndex > -1 && markAreaEndIndex > -1 && markAreaStartIndex < markAreaEndIndex;
  return {
    type: 'line',
    seriesLayoutBy: 'row',
    datasetIndex: datasetIndex,
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
