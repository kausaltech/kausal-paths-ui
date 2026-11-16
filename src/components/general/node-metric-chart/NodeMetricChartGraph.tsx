/*
 * EXPERIMENTAL COPY of kausal_common/src/components/paths/NodeGraph.tsx (kausal-ui-common 1c2a801).
 *
 * Used only by the graphs of ParameterPanelBlock, so that the node graph can be developed
 * without changing the node page, outcome pages, the model editor or Watch. The plan is in
 * kausal-paths docs/plans/node-graph-metrics-and-stackability.md. When it is ready, it goes
 * back to kausal_common and replaces the original.
 */
import { type Ref } from 'react';

import type { Theme } from '@kausal/themes/types';
import * as Sentry from '@sentry/nextjs';
import type * as echarts from 'echarts/core';
import type {
  CallbackDataParams,
  LegendOption,
  TooltipPositionCallback,
} from 'echarts/types/dist/shared';
import { useLocale, useTranslations } from 'next-intl';
import { tint } from 'polished';

import { Chart, type ChartHandle } from '@common/components/Chart';
import {
  type EChartsLocalePack,
  formatAriaTemplate,
  stripHtmlForAria,
} from '@common/components/chart-aria';
import { getEChartsLocaleStrings } from '@common/components/register-echarts-locales';
import { sanitizeHtmlUnit } from '@common/utils/format';

/**
 * Labels used in the legend and tooltip. Optional so existing callers keep
 * relying on the component's internal `useTranslations()`; callers whose
 * messages are namespaced (so bare keys don't resolve) inject them instead.
 */
export type NodeGraphLabels = {
  total: string;
  goal: string;
  baseline: string;
  progress: string;
  measured: string;
  comparisonYear: string;
  forecast: string;
};

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
 * @param baselineLabel - The label of the baseline.
 * @param showTotalLine - Whether to show the total line.
 */

type ChartType = 'bar' | 'line' | 'area';

type NodeGraphProps = {
  title: string | null | undefined;
  subtitle: string | null | undefined;
  dataTable: DataTable;
  goalTable: DataTable | null;
  baselineTable: DataTable | null;
  progressTable: DataTable | null;
  totalTable: DataTable | null;
  unit: {
    htmlLong: string;
    htmlShort: string;
    [key: string]: unknown;
  };
  referenceYear: number | undefined | null;
  forecastRange: [number, number] | null;
  categoryColors: string[];
  maximumFractionDigits: number | undefined;
  formatValue: (value: number) => string;
  baselineLabel: string | null | undefined;
  showTotalLine?: boolean;
  onClickMeasuredEmissions?: (year: number) => void;
  forecastTitle?: string;
  stackable?: boolean;
  chartType?: ChartType;
  predictionLabel?: string;
  theme: Theme;
  /** Forwarded to the chart so callers can export it (e.g. PNG via getDataURL). */
  chartRef?: Ref<ChartHandle>;
  /** Y-axis label formatter; falls back to `formatValue` when omitted. */
  formatAxisValue?: (value: number) => string;
  /** Pre-translated labels; falls back to internal `useTranslations()` when omitted. */
  labels?: NodeGraphLabels;
};

type DataTable = (string | number | null | undefined)[][];

// Constants
// Above this many datapoints (years × categories) the aria description
// switches to its compact form (category names once, per-year specials only)
const MAX_ARIA_DATAPOINTS = 100;
const CHART_HEIGHT = '360px';
const BAR_WIDTH = '85%';
const BAR_MAX_WIDTH = '50';
const BAR_CATEGORY_GAP = '20%';
const FORECAST_TINT_AMOUNT = 0.35;

export default function NodeMetricChartGraph(props: NodeGraphProps) {
  const t = useTranslations();

  const {
    title,
    subtitle,
    dataTable,
    goalTable,
    baselineTable,
    progressTable,
    totalTable,
    unit,
    referenceYear,
    forecastRange,
    categoryColors,
    formatValue,
    baselineLabel,
    showTotalLine = false,
    onClickMeasuredEmissions,
    forecastTitle,
    stackable = true,
    chartType,
    theme,
    predictionLabel,
    chartRef,
    formatAxisValue,
    labels,
  } = props;

  const locale = useLocale();

  // Fallback keys are bare (valid where messages are flat). Consumers with
  // namespaced messages pass `labels` instead, so this branch is dead for them;
  // the loose cast lets the component typecheck under either message config.
  const tt = t as unknown as (key: string) => string;
  const resolvedLabels: NodeGraphLabels = labels ?? {
    total: tt('plot-total'),
    goal: tt('target'),
    baseline: tt('plot-baseline'),
    progress: tt('calculated-emissions'),
    measured: tt('plot-measured'),
    comparisonYear: tt('comparison-year'),
    forecast: tt('table-scenario-forecast'),
  };
  // Bars and areas are always stacked, so a metric whose values cannot be summed (a share, a
  // ratio, an emission factor) is drawn as lines whatever chart type the caller asks for.
  // Callers pass a chart type unconditionally (DimensionalNodeVisualisation defaults to 'bar',
  // Watch takes it from the goal), so checking `stackable` only as the fallback is not enough.
  const resolvedChartType: ChartType = stackable ? (chartType ?? 'bar') : 'line';
  const resolvedShowTotalLine = resolvedChartType === 'area' ? false : showTotalLine;

  // Figure out the start year of the dataset sans reference year
  const startYear =
    dataTable?.[0] && dataTable[0].length > (referenceYear ? 2 : 1)
      ? referenceYear
        ? dataTable[0][2]
        : dataTable[0][1]
      : null;
  //const endYear =
  //  dataTable?.[0] && dataTable[0].length > 0 ? dataTable[0][dataTable[0].length - 1] : null;

  // Early return if we don't have valid data
  if (!dataTable || !dataTable[0] || dataTable[0].length === 0) {
    Sentry.captureException('NodeMetricChartGraph: No data available');
    return <div id="error">No data available</div>;
  }

  // Define events that are supposed to propagate up to the parent component
  // onClickMeasuredEmissions checks if the clicked year has progress data (nzc) and if so, calls the onClickMeasuredEmissions function
  const handleChartClick = (dataPoint: [number, number]) => {
    // If no callback is provided, no point in going further
    if (!onClickMeasuredEmissions || !startYear) return;
    // If the user clicks below the x axis, we do nothing
    if (dataPoint[1] < 0) return;
    // If the clicked year is the reference year, we do nothing
    // By definition reference year has no progress data
    if (dataPoint[0] === 0 && referenceYear) return;

    // If some other year is clicked, we need to offset the index if referenceYear is present.
    // Bar charts insert an empty spacer category after the reference year, so the historical
    // years are shifted one extra step to the right.
    const offsetForReferenceYear = referenceYear ? (showReferenceGap ? 2 : 1) : 0;
    const clickedYear = Number(startYear) + dataPoint[0] - offsetForReferenceYear;

    if (progressTable) {
      // Find the index of the clicked year in the progress table
      const progressDataPoint = progressTable[0].indexOf(clickedYear);
      // Check if the clicked year has progress data
      if (progressDataPoint && progressTable[1][progressDataPoint] != null) {
        onClickMeasuredEmissions(clickedYear);
      }
    }
  };

  // The reference year must not be joined to the historical time series as if the
  // two were adjacent.
  //   - Area charts render the reference year as a standalone bar and drop it from
  //     the area, leaving a one-category gap before the first historical year.
  //   - Bar charts keep the reference year as a bar but insert an empty "spacer"
  //     category after it, creating a clear gap before the first historical year.
  const hasReferenceYearColumn = !!referenceYear && Number(dataTable[0]?.[1]) === referenceYear;
  const separateReferenceYear = resolvedChartType === 'area' && hasReferenceYearColumn;
  const showReferenceGap = resolvedChartType === 'bar' && hasReferenceYearColumn;

  const REFERENCE_COL = 1; // reference year column (right after the 'Category' label)
  const SPACER_COL = 2; // an empty category inserted right after the reference year

  // Insert an empty spacer category after the reference year column.
  const withSpacer = (table: DataTable): DataTable =>
    table.map((row, rowIndex) => {
      const next = [...row];
      next.splice(SPACER_COL, 0, rowIndex === 0 ? '' : null);
      return next;
    });

  // Area dataset: drop the reference year value so the area starts at the first
  // historical year, one category to the right of the reference bar.
  const toAreaTable = (table: DataTable): DataTable =>
    table.map((row, rowIndex) =>
      rowIndex === 0 ? row : row.map((cell, col) => (col === REFERENCE_COL ? null : cell))
    );

  // Reference-year bar dataset: keep only the reference year value per category.
  const toReferenceBarTable = (table: DataTable): DataTable =>
    table.map((row, rowIndex) =>
      rowIndex === 0
        ? row
        : row.map((cell, col) => (col === 0 || col === REFERENCE_COL ? cell : null))
    );

  const mainTable = separateReferenceYear
    ? toAreaTable(dataTable)
    : showReferenceGap
      ? withSpacer(dataTable)
      : dataTable;
  const referenceBarTable = separateReferenceYear ? toReferenceBarTable(dataTable) : null;
  // Keep the secondary datasets aligned with the spacer inserted into the main table.
  const goalTableResolved = showReferenceGap && goalTable ? withSpacer(goalTable) : goalTable;
  const baselineTableResolved =
    showReferenceGap && baselineTable ? withSpacer(baselineTable) : baselineTable;
  const progressTableResolved =
    showReferenceGap && progressTable ? withSpacer(progressTable) : progressTable;
  const totalTableResolved = showReferenceGap && totalTable ? withSpacer(totalTable) : totalTable;

  const fullDataset: {
    source: DataTable | undefined;
    sourceHeader: boolean;
  }[] = [];

  // Track actual dataset indices as we build the array
  const datasetIndices = {
    data: -1,
    referenceBar: -1,
    goal: -1,
    baseline: -1,
    progress: -1,
    total: -1,
  };

  // Add main data dataset (always present)
  if (mainTable && mainTable.length > 0) {
    datasetIndices.data = fullDataset.length;
    fullDataset.push({
      source: mainTable,
      sourceHeader: true,
    });
  }

  // Add reference-year bar dataset if present (area charts only)
  if (referenceBarTable && referenceBarTable.length > 0) {
    datasetIndices.referenceBar = fullDataset.length;
    fullDataset.push({
      source: referenceBarTable,
      sourceHeader: true,
    });
  }

  // Add goal dataset if present
  if (goalTableResolved && goalTableResolved.length > 0) {
    datasetIndices.goal = fullDataset.length;
    fullDataset.push({
      source: goalTableResolved,
      sourceHeader: true,
    });
  }

  // Add baseline dataset if present
  if (baselineTableResolved && baselineTableResolved.length > 0) {
    datasetIndices.baseline = fullDataset.length;
    fullDataset.push({
      source: baselineTableResolved,
      sourceHeader: true,
    });
  }

  // Add progress dataset if present
  if (progressTableResolved && progressTableResolved.length > 0) {
    datasetIndices.progress = fullDataset.length;
    fullDataset.push({
      source: progressTableResolved,
      sourceHeader: true,
    });
  }

  // Add total dataset if present
  if (totalTableResolved && totalTableResolved.length > 0) {
    datasetIndices.total = fullDataset.length;
    fullDataset.push({
      source: totalTableResolved,
      sourceHeader: true,
    });
  }

  const specialSeriesLabels = {
    Total: resolvedLabels.total,
    Goal: resolvedLabels.goal,
    Baseline: baselineLabel || resolvedLabels.baseline,
    Progress: resolvedLabels.progress,
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
    resolvedShowTotalLine
  );

  // Calculate indices for the forecast range
  const forecastAreaStartIndex =
    forecastRange && datasetIndices.data >= 0 && fullDataset[datasetIndices.data]?.source?.[0]
      ? fullDataset[datasetIndices.data].source![0].findIndex(
          (year) => Number(year) === forecastRange[0]
        ) - (referenceYear ? 2 : 1)
      : -1;

  // Check if forecast range years exist in the data
  const hasForecastData = forecastAreaStartIndex > -1;

  const isForecastYear = (year: number | undefined): boolean => {
    if (!year) return false;
    return forecastRange ? year >= forecastRange[0] && year <= forecastRange[1] : false;
  };

  const createTooltipFormatter = () => {
    return function (params: CallbackDataParams[]) {
      if (!Array.isArray(params)) return '';
      const dataIndex: number | undefined = params[0]?.dataIndex;
      if (typeof dataIndex !== 'number') return '';

      const isForecast = hasForecastData && dataIndex >= forecastAreaStartIndex;
      const year =
        datasetIndices.data >= 0 && fullDataset[datasetIndices.data]?.source?.[0]?.[dataIndex + 1]; // +1 because first column is "Category"
      const isReferenceYear = Boolean(referenceYear && Number(year) === referenceYear);

      return buildTooltipContent(
        params,
        typeof year === 'string' || typeof year === 'number' ? year : undefined,
        isForecast,
        isReferenceYear,
        unit.htmlShort,
        formatValue,
        specialSeriesLabels,
        resolvedLabels.measured,
        resolvedLabels.comparisonYear,
        resolvedShowTotalLine,
        predictionLabel
      );
    };
  };

  // Screen-reader description mirroring the tooltip: for every year, the
  // category values (visual top of the stack first) followed by the special
  // series (total, goal, baseline, progress), with the same labels, value
  // formatting and Measured/Forecast/Comparison-year annotation. The native
  // aria generator would instead read the raw dataset tuples.
  const buildAriaDescription = (): string => {
    const source = datasetIndices.data >= 0 ? fullDataset[datasetIndices.data]?.source : undefined;
    if (!source || source.length < 2) return '';
    const localePack: EChartsLocalePack = getEChartsLocaleStrings(locale);
    const unitText = stripHtmlForAria(unit.htmlShort);
    const header = source[0];
    const categoryRows = source.slice(1);

    // Same order as the tooltip's special rows (Total, Progress, Baseline, Goal)
    const specialIndices = {
      Total: datasetIndices.total,
      Progress: datasetIndices.progress,
      Baseline: datasetIndices.baseline,
      Goal: datasetIndices.goal,
    } as const;
    // The special tables share the main table's layout: a header row of years
    // and a single value row — so the main table's column index applies
    const specialRows = (Object.keys(specialIndices) as (keyof typeof specialIndices)[]).flatMap(
      (key) => {
        const idx = specialIndices[key];
        const row = idx >= 0 ? fullDataset[idx]?.source?.[1] : undefined;
        return row ? [{ label: specialSeriesLabels[key], row }] : [];
      }
    );

    const yearColumns: { colIdx: number; year: number }[] = [];
    header.forEach((cell, colIdx) => {
      if (colIdx === 0 || cell == null || cell === '') return;
      const year = Number(cell);
      if (Number.isFinite(year)) yearColumns.push({ colIdx, year });
    });

    // With many datapoints a full year-by-category listing becomes unwieldy
    // to listen to, so fall back to a compact form: the category names once,
    // and per-year entries with only the special rows.
    const compact = yearColumns.length * categoryRows.length > MAX_ARIA_DATAPOINTS;

    let categoryList = '';
    if (compact) {
      const names = [...categoryRows]
        .reverse()
        .map((row) => String(row[0]))
        .filter((name) => name !== '');
      if (names.length > 0) {
        categoryList = `. ${names.join(', ')}`;
      }
    }

    const yearSummaries: string[] = [];
    yearColumns.forEach(({ colIdx, year }) => {
      const parts: string[] = [];
      if (!compact) {
        [...categoryRows].reverse().forEach((row) => {
          const raw = row[colIdx];
          if (typeof raw !== 'number') return;
          const value = formatValue(raw);
          if (value === '-') return;
          parts.push(`${String(row[0])}: ${value} ${unitText}`);
        });
      }
      specialRows.forEach(({ label, row }) => {
        const raw = row[colIdx];
        if (typeof raw !== 'number') return;
        const value = formatValue(raw);
        if (value === '-') return;
        parts.push(`${label}: ${value} ${unitText}`);
      });
      if (parts.length === 0) return;
      const yearLabel = isForecastYear(year)
        ? (predictionLabel ?? resolvedLabels.forecast)
        : referenceYear && year === referenceYear
          ? resolvedLabels.comparisonYear
          : resolvedLabels.measured;
      yearSummaries.push(`${year} (${yearLabel}): ${parts.join(', ')}`);
    });
    if (yearSummaries.length === 0 && !categoryList) return '';

    return (
      (title
        ? formatAriaTemplate(localePack.aria?.general?.withTitle, { title })
        : formatAriaTemplate(localePack.aria?.general?.withoutTitle)) +
      (subtitle ? `. ${subtitle}` : '') +
      categoryList +
      (yearSummaries.length > 0 ? `. ${yearSummaries.join('. ')}` : '') +
      '.'
    );
  };

  const series = [
    ...(createMainSeries(
      fullDataset,
      datasetIndices,
      categoryColors,
      theme,
      isForecastYear,
      resolvedChartType,
      forecastTitle ?? resolvedLabels.forecast,
      forecastAreaStartIndex
    ) || []),
    ...(separateReferenceYear && datasetIndices.referenceBar >= 0
      ? createReferenceBarSeries(fullDataset, datasetIndices.referenceBar, categoryColors, theme)
      : []),
    hasGoalData && datasetIndices.goal >= 0
      ? createGoalSeries(
          theme,
          datasetIndices.goal,
          specialSeriesLabels.Goal,
          goalTable && goalTable[0]?.length === 2
            ? (goalTable[1]?.[1] as number | null | undefined)
            : null
        )
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
          datasetIndices.total,
          resolvedShowTotalLine,
          specialSeriesLabels.Total
        )
      : null,
  ].filter(Boolean);

  const option: echarts.EChartsCoreOption = {
    title: {
      text: title,
      subtext: subtitle,
      left: '75',
      top: 10,
      padding: [0, 0, 48, 0],
      itemGap: 5,
      textStyle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.themeColors.dark,
      },
    },
    aria: {
      enabled: true,
      label: { description: buildAriaDescription() },
    },
    legend: {
      orient: 'horizontal',
      right: 10,
      bottom: 10,
      data: legendData,
      // Disable hiding series from legend
      selectedMode: false,
      formatter: (name: string) => {
        return specialSeriesLabels[name as keyof typeof specialSeriesLabels] || name;
      },
    },
    grid: {
      left: '75',
      right: '24',
      bottom: 100,
      top: subtitle ? 90 : 65,
    },
    tooltip: {
      trigger: 'axis',
      position: function (point, params, dom, rect, size) {
        return point[0] < size.viewSize[0] / 2 ? { top: 60, right: 5 } : { top: 60, left: 5 };
      } as TooltipPositionCallback,
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
      type: 'value',
      name: sanitizeHtmlUnit(unit.htmlLong),
      nameLocation: 'end',
      nameTextStyle: {
        align: 'left',
        verticalAlign: 'top',
        fontSize: 12,
        color: theme.themeColors.dark,
        fontWeight: 'normal',
      },
      nameGap: 30,
      axisLabel: {
        formatter: (value: number) => (formatAxisValue ?? formatValue)(value),
      },
    },
    barGap: 0,
    barCategoryGap: BAR_CATEGORY_GAP,
    series: series,
    color: categoryColors,
  };

  return (
    <Chart
      isLoading={false}
      data={option}
      height={CHART_HEIGHT}
      className="plot-container"
      onZrClick={handleChartClick}
      locale={locale}
      ref={chartRef}
      // Refetches (e.g. scenario changes) re-render with new data; don't replay the animation
      animateUpdates={false}
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
  categoryColors: string[],
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

  const specialSeriesLegend: LegendOption[] = [];
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

function createMainSeries(
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
  categoryColors: string[],
  theme: Theme,
  isForecastYear: (year: number | undefined) => boolean,
  chartType: ChartType,
  forecastTitle: string,
  forecastAreaStartIndex: number
) {
  if (
    datasetIndices.data < 0 ||
    !dataset[datasetIndices.data]?.source ||
    dataset[datasetIndices.data].source!.length <= 1
  ) {
    return [];
  }

  const createForecastBackground = (idx: number) => {
    // If forecast is outside the visible range or indices are invalid, we don't color the forecast area
    const hasForecastData = idx == 0 && forecastAreaStartIndex > -1;
    return {
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
                  name: forecastTitle,
                  xAxis: forecastAreaStartIndex - (chartType === 'area' ? 1 : 0), // Adjust for bar width
                },
                {
                  x: '100%',
                },
              ],
            ],
          }
        : undefined,
    };
  };

  const createLineSeries = (row: (string | number | null | undefined)[]) => {
    return {
      type: 'line',
      seriesLayoutBy: 'row',
      name: row[0],
      datasetIndex: datasetIndices.data,
      lineStyle: {
        width: 2,
      },
      // For simplification we do not color forecast line differently
    };
  };

  const createBarSeries = (row: (string | number | null | undefined)[], idx: number) => {
    const baseColor = categoryColors[idx] ?? theme.graphColors.blue070;
    return {
      type: 'bar',
      seriesLayoutBy: 'row',
      stack: 'x',
      stackStrategy: 'samesign',
      name: row[0],
      datasetIndex: datasetIndices.data,
      itemStyle: {
        color: (param: CallbackDataParams) => {
          // This is pretty complex due to typing
          const xIndex = param.encode?.x?.[0];
          const rawYear: unknown =
            typeof xIndex === 'number' && Array.isArray(param.data)
              ? param.data[xIndex]
              : undefined;
          const dataYear: number | undefined = typeof rawYear === 'number' ? rawYear : undefined;
          return isForecastYear(dataYear) ? tint(FORECAST_TINT_AMOUNT, baseColor) : baseColor;
        },
      },
      barWidth: BAR_WIDTH,
      barMaxWidth: BAR_MAX_WIDTH,
    };
  };

  const createAreaSeries = (row: (string | number | null | undefined)[], idx: number) => {
    const baseColor = categoryColors[idx] ?? theme.graphColors.blue070;
    const forecastColor = tint(FORECAST_TINT_AMOUNT, baseColor);
    const hasForecast = forecastAreaStartIndex > -1;

    // Build a horizontal gradient that snaps from historical to forecast color
    // at the exact x-axis position where the forecast begins.
    const makeGradient = (solidColor: string, tintedColor: string) => {
      if (!hasForecast) return solidColor;
      const headerRow = dataset[datasetIndices.data].source![0];
      const totalXCategories = headerRow.length - 1; // subtract 'Category' column
      const forecastRatio =
        Math.max(0, forecastAreaStartIndex - 1) / Math.max(totalXCategories - 1, 1);
      return {
        type: 'linear' as const,
        x: 0,
        y: 0,
        x2: 1,
        y2: 0,
        colorStops: [
          { offset: 0, color: solidColor },
          { offset: forecastRatio, color: solidColor },
          { offset: forecastRatio, color: tintedColor },
          { offset: 1, color: tintedColor },
        ],
      };
    };

    const gradient = makeGradient(baseColor, forecastColor);

    return {
      type: 'line',
      seriesLayoutBy: 'row',
      stack: 'x',
      stackStrategy: 'samesign',
      name: row[0],
      symbol: 'none',
      smooth: true,
      datasetIndex: datasetIndices.data,
      lineStyle: {
        width: 1,
        color: 'white',
      },
      areaStyle: {
        opacity: 1,
        color: gradient,
      },
      // itemStyle used for legend swatch — always show the base color there
      itemStyle: {
        color: baseColor,
      },
    };
  };

  const createSeries = (row: (string | number | null | undefined)[], idx: number) => {
    if (chartType === 'area') return createAreaSeries(row, idx);
    if (chartType === 'bar') return createBarSeries(row, idx);
    return createLineSeries(row);
  };

  return dataset[datasetIndices.data]
    .source!.slice(1) // Remove header row
    .map((row, idx) => ({
      ...createSeries(row, idx),
      ...createForecastBackground(idx),
    }));
}

/**
 * Render the reference year as standalone stacked bars at the start of an area
 * chart. The reference year is historical (a comparison baseline), so the bars
 * use the plain category colors with no forecast tint. An empty spacer category
 * sits between these bars and the area, giving a clear visual gap.
 */
function createReferenceBarSeries(
  dataset: {
    source: DataTable | undefined;
    sourceHeader: boolean;
  }[],
  referenceBarIndex: number,
  categoryColors: string[],
  theme: Theme
) {
  const source = dataset[referenceBarIndex]?.source;
  if (!source || source.length <= 1) return [];

  return source.slice(1).map((row, idx) => ({
    type: 'bar',
    seriesLayoutBy: 'row',
    stack: 'reference',
    stackStrategy: 'samesign',
    // Share the category name so the legend toggles bar + area together.
    name: row[0],
    datasetIndex: referenceBarIndex,
    itemStyle: {
      color: categoryColors[idx] ?? theme.graphColors.blue070,
    },
    barWidth: BAR_WIDTH,
    barMaxWidth: BAR_MAX_WIDTH,
  }));
}

function createGoalSeries(
  theme: Theme,
  datasetIndex: number,
  name: string,
  horizontalLineValue?: number | null
) {
  return {
    type: 'line',
    seriesLayoutBy: 'row',
    datasetIndex: datasetIndex,
    name: name,
    symbol: 'circle',
    symbolSize: 8,
    smooth: true,
    showAllSymbol: true,
    itemStyle: {
      color: theme.graphColors.red090,
    },
    lineStyle: {
      color: theme.graphColors.red090,
      type: 'dashed',
      width: 2,
    },
    animation: false,
    ...(horizontalLineValue != null && {
      markLine: {
        silent: true,
        symbol: ['none', 'none'],
        lineStyle: {
          color: theme.graphColors.red090,
          type: 'dashed',
          width: 1,
        },
        label: { show: false },
        data: [{ yAxis: horizontalLineValue }],
      },
    }),
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
    color: theme.graphColors.grey060,
    animation: false,
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
    color: theme.themeColors.black,
  };
}

function createTotalSeries(
  theme: Theme,
  datasetIndex: number,
  showTotalLine: boolean,
  name: string
) {
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
    color: theme.graphColors.red070,
  };
}

function buildTooltipContent(
  params: CallbackDataParams[],
  year: string | number | null | undefined,
  isForecast: boolean,
  isReferenceYear: boolean,
  unit: string,
  formatValue: (value: number) => string,
  specialSeriesLabels: Record<string, string>,
  measuredLabel: string,
  comparisonYearLabel: string,
  showTotalLine: boolean,
  predictionLabel?: string
) {
  if (!year) return '';
  const yearLabel = isForecast
    ? predictionLabel
    : isReferenceYear
      ? comparisonYearLabel
      : measuredLabel;

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
    tooltip += `<div style="border-top: 1px solid #eee; margin: 8px 0 4px 0;"></div>`;
    [...regularSeries].reverse().forEach((param) => {
      tooltip += buildTooltipRow(param, unit, formatValue, undefined, undefined);
    });
  }

  // Add special series data
  if (specialSeries.length > 0) {
    tooltip += `<div style="border-top: 1px solid #ccc; margin: 8px 0 4px 0;"></div>`;
    specialSeries.reverse().forEach((param) => {
      tooltip += buildTooltipRow(param, unit, formatValue, specialSeriesLabels, showTotalLine);
    });
  }

  return tooltip;
}

function buildTooltipRow(
  param: CallbackDataParams,
  unit: string,
  formatValue: (value: number) => string,
  specialSeriesLabels?: Record<string, string>,
  showTotalLine?: boolean
) {
  const yIndex: number | undefined = param?.encode?.y?.[0];
  if (yIndex == null || !Array.isArray(param.data)) return '';
  const rawValue = param.data[yIndex];
  if (typeof rawValue !== 'number') return '';
  const value = formatValue(rawValue);

  if (value === '-' || value === undefined || value === null) return '';
  if (!param.seriesName || param.value === undefined) return '';

  const color = typeof param.color === 'string' ? param.color : '#000';
  const displayName = specialSeriesLabels?.[param.seriesName] || param.seriesName;
  const getMarker = () => {
    if (param?.dimensionNames?.[1] === 'Goal')
      return `<span style="display:inline-block;margin-right:4px;border-radius:10px;width:10px;height:10px;background-color:${color};"></span>`;
    if (param?.dimensionNames?.[1] === 'Total')
      return `<span style="display:inline-block;margin-right:4px;width:10px;height:2px;background-color:${showTotalLine ? color : 'transparent'};"></span>`;
    else if (param?.componentSubType === 'line')
      return `<span style="display:inline-block;margin-right:4px;margin-bottom:3px;width:10px;height:4px;background-color:${color};"></span>`;
    else
      return `<span style="display:inline-block;margin-right:4px;width:10px;height:10px;background-color:${color};"></span>`;
  };
  const seriesMarker = getMarker();
  return `<div style="margin: 2px 0;">
    ${seriesMarker}
    ${displayName}: <strong>${value} ${unit}</strong>
  </div>`;
}
