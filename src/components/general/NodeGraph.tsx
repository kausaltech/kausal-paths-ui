import { useTranslation } from 'next-i18next';
import { tint } from 'polished';
import { useTheme } from 'styled-components';

import { beautifyValue } from '@/common/preprocess';
import { Chart } from '@/components/charts/Chart';

type NodeGraphProps = {
  plotData: {
    source: string[][];
  };
  goalsData: {
    source: string[][];
  };
  unit: string;
  stackable: boolean;
  endYear: number;
  startYear: number;
  referenceYear: number | undefined | null;
  forecastRange: [number, number];
  categoryColors: Record<string, string>;
  maximumFractionDigits: number | undefined;
  baselineLabel: string | undefined;
};

// Constants
const CHART_HEIGHT = '400px';
const BAR_WIDTH = '85%';
const BAR_MAX_WIDTH = '50';
const BAR_CATEGORY_GAP = '20%';
const FORECAST_TINT_AMOUNT = 0.35;
const SPECIAL_SERIES_NAMES = ['Total', 'Goal', 'Baseline'] as const;

export default function NodeGraph({
  plotData,
  unit,
  stackable,
  endYear,
  startYear,
  referenceYear,
  forecastRange,
  categoryColors,
  maximumFractionDigits,
  baselineLabel,
}: NodeGraphProps) {
  const theme = useTheme();
  const { t } = useTranslation();

  // Remove the Type column from the dataset
  const dataset = {
    source: plotData.source.map((row) => row.filter((_, index) => index !== 1)),
  };

  const specialSeriesLabels = {
    Total: t('plot-total'),
    Goal: t('target'),
    Baseline: baselineLabel || t('plot-baseline'),
  };

  // Split dataset at reference year if it exists
  const { beforeReferenceDataset, afterReferenceDataset } = splitDatasetAtReferenceYear(
    dataset,
    referenceYear
  );

  const legendData = createLegendData(plotData, categoryColors, theme);

  // Calculate indices for the forecast range
  const markAreaStartIndex =
    dataset.source[0].findIndex((year) => Number(year) === forecastRange[0]) - 1;
  const markAreaEndIndex =
    dataset.source[0].findIndex((year) => Number(year) === forecastRange[1]) - 1;

  // Check if forecast range years exist in the data
  const hasForecastData = markAreaStartIndex >= -1 && markAreaEndIndex >= -1;

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
      const year = dataset.source[0][dataIndex + 1]; // +1 because first column is "Category"
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
    ...createBarSeries(beforeReferenceDataset, categoryColors, theme, isForecastYear, 0),
    ...(afterReferenceDataset
      ? createBarSeries(afterReferenceDataset, categoryColors, theme, isForecastYear, 1)
      : []),
    ...(hasForecastData
      ? [createMarkAreaSeries(theme, t, markAreaStartIndex, markAreaEndIndex)]
      : []),
    createGoalSeries(theme),
    createBaselineSeries(theme),
  ];

  const option: echarts.EChartsCoreOption = {
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
    dataset: afterReferenceDataset ? [beforeReferenceDataset, afterReferenceDataset] : dataset,
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

  return <Chart isLoading={false} data={option} height={CHART_HEIGHT} className="plot-container" />;
}

// Helper functions

function splitDatasetAtReferenceYear(
  dataset: { source: string[][] },
  referenceYear: number | undefined | null
) {
  let beforeReferenceDataset = dataset;
  let afterReferenceDataset: { source: string[][] } | null = null;

  if (referenceYear) {
    const referenceYearIndex = dataset.source[0].findIndex(
      (year) => Number(year) === referenceYear
    );

    if (referenceYearIndex > 0) {
      beforeReferenceDataset = {
        source: dataset.source.map((row) => [...row.slice(0, referenceYearIndex + 1)]),
      };

      afterReferenceDataset = {
        source: dataset.source.map((row) => [
          row[0], // Keep the category name
          ...row.slice(referenceYearIndex + 1),
        ]),
      };
    }
  }

  return { beforeReferenceDataset, afterReferenceDataset };
}

function createLegendData(
  plotData: { source: string[][] },
  categoryColors: Record<string, string>,
  theme: any
) {
  const regularSeries = plotData.source
    .slice(1) // Remove header row
    .slice(0, -3) // Remove total, goal, and baseline rows
    .map((row, idx) => ({
      name: row[0],
      itemStyle: {
        color: categoryColors[idx] ?? theme.graphColors.blue070,
      },
    }));

  const specialSeries = [
    {
      name: 'Goal',
      itemStyle: {
        color: theme.graphColors.red090,
      },
    },
    {
      name: 'Baseline',
      itemStyle: {
        color: theme.graphColors.grey060,
      },
    },
  ];

  return [...regularSeries, ...specialSeries];
}

function createBarSeries(
  dataset: { source: string[][] },
  categoryColors: Record<string, string>,
  theme: any,
  isForecastYear: (year: number) => boolean,
  datasetIndex: number
) {
  return dataset.source
    .slice(1) // Remove header row
    .slice(0, -3) // Remove total, goal, and baseline rows
    .map((row, idx) => ({
      type: 'bar',
      seriesLayoutBy: 'row',
      stack: 'x',
      name: row[0],
      stackStrategy: 'all',
      datasetIndex,
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

function createMarkAreaSeries(
  theme: any,
  t: any,
  markAreaStartIndex: number,
  markAreaEndIndex: number
) {
  return {
    type: 'line',
    seriesLayoutBy: 'row',
    name: 'Total',
    step: 'middle',
    itemStyle: {
      color: 'rgba(0, 0, 0, 0)',
    },
    lineStyle: {
      color: 'rgba(0, 0, 0, 0)',
    },
    symbol: 'none',
    markArea: {
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
    },
  };
}

function createGoalSeries(theme: any) {
  return {
    type: 'line',
    seriesLayoutBy: 'row',
    name: 'Goal',
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
            name: 'Goal',
            yAxis: 5,
          },
        ],
      ],
    },
  };
}

function createBaselineSeries(theme: any) {
  return {
    type: 'line',
    seriesLayoutBy: 'row',
    name: 'Baseline',
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

function buildTooltipContent(
  params: any[],
  year: string,
  isForecast: boolean,
  isReferenceYear: boolean,
  unit: string,
  maximumFractionDigits: number | undefined,
  specialSeriesLabels: Record<string, string>,
  t: any
) {
  const yearLabel = isForecast
    ? t('pred')
    : isReferenceYear
      ? t('comparison-year')
      : t('plot-measured');

  let tooltip = `<div style="font-weight: bold; margin-bottom: 5px;">
    ${year} (${yearLabel})
  </div>`;

  // Separate regular series from special series
  const regularSeries = params.filter((param) => !SPECIAL_SERIES_NAMES.includes(param.seriesName));
  const specialSeries = params.filter((param) => SPECIAL_SERIES_NAMES.includes(param.seriesName));

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
