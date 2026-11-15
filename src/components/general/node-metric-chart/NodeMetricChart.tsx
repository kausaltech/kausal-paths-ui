/*
 * EXPERIMENTAL COPY of kausal_common/src/components/paths/DimensionalNodeVisualisation.tsx (kausal-ui-common 1c2a801).
 *
 * Used only by the graphs of ParameterPanelBlock, so that the node graph can be developed
 * without changing the node page, outcome pages, the model editor or Watch. The plan is in
 * kausal-paths docs/plans/node-graph-metrics-and-stackability.md. When it is ready, it goes
 * back to kausal_common and replaces the original.
 */
import { type SetStateAction, useCallback, useMemo, useRef, useState } from 'react';

import { Box } from '@mui/material';

import chroma from 'chroma-js';
import { useLocale } from 'next-intl';

import type { ChartHandle } from '@common/components/Chart';
import DimensionControls, {
  type DimensionControlsLabels,
} from '@common/components/paths/DimensionControls';
import ToolsMenu, { type ToolsMenuLabels } from '@common/components/paths/ToolsMenu';
import { useTheme } from '@common/themes';
import { formatWithFormatter, makeInstanceFormatter } from '@common/utils/format';
import { genColorsFromTheme, setUniqueColors } from '@common/utils/paths/colors';
import {
  type CO2eUnitKey,
  type InstanceGoalInput,
  type MetricInput,
  type MetricSliceData,
  type ParsedMetric,
  type SliceConfig,
  flatten,
  getCategoryLabel,
  getDefaultSliceConfig,
  getDimensionLabel,
  getFilteredYears,
  getGoalsForChoice,
  getGroupLabel,
  getOptionsForDimension,
  overrideUnit,
  parseMetric,
  sliceBy,
  updateChoice,
} from '@common/utils/paths/metric';
import {
  type SiteContextType,
  getProgressTrackingScenario,
  metricHasProgressTrackingScenario,
} from '@common/utils/paths/progress-tracking';

import NodeMetricChartGraph, { type NodeGraphLabels } from './NodeMetricChartGraph';
import { type EditorDefaults, applyEditorDefaults } from './editor-defaults';

type MetricDim = MetricInput & {
  measureDatapointYears?: readonly number[] | null;
};

type BaselineForecast = { year: number; value: number };

type InstanceContext = {
  referenceYear?: number | null;
  minimumHistoricalYear: number;
  features?: {
    baselineVisibleInGraphs?: boolean | null;
    maximumFractionDigits?: number | null;
    showSignificantDigits?: number | null;
    /** Keep categories reported as zero in the chart, legend and tooltip */
    showZerosInGraphs?: boolean | null;
  } | null;
};

type SiteContext = SiteContextType & {
  baselineName?: string | null;
};

/** Translated labels of the visualisation, its controls and tools */
export type NodeVisualisationLabels = {
  graph: NodeGraphLabels;
  /** The label of forecast values, e.g. "pred" or "Planned" */
  prediction: string;
  controls: DimensionControlsLabels;
  tools: ToolsMenuLabels;
  /** CO2-equivalent units, as HTML; see `overrideUnit` */
  units: Record<CO2eUnitKey, string>;
};

export type NodeMetricChartProps = {
  title: string | null | undefined;
  metric: MetricDim;
  startYear: number;
  endYear: number;
  /** Show exactly these years instead of the range, e.g. to compare two years */
  separateYears?: number[] | null;
  /** The active goal, whose dimension choices filter the chart by default */
  activeGoal: InstanceGoalInput | null;
  instance: InstanceContext;
  /** Significant digits when the instance sets no number format; see `makeInstanceFormatter` */
  defaultSignificantDigits?: number;
  /** Scenarios, for the baseline and progress tracking lines */
  site?: SiteContext | null;
  labels: NodeVisualisationLabels;
  baselineForecast?: BaselineForecast[];
  withControls?: boolean;
  withTools?: boolean;
  color?: string | null;
  /** Brighten (positive) or darken (negative) the series colors */
  colorAdjust?: number;
  onClickMeasuredEmissions?: (year: number) => void;
  forecastTitle?: string;
  chartType?: 'bar' | 'line' | 'area';
  /** The page editor's break-down dimension and filters; the visitor can change both */
  editorDefaults?: EditorDefaults;
};

/** The labels of the categories (or groups) the slice config filters by, per dimension */
function getActiveFilterLabels(metric: ParsedMetric, sliceConfig: SliceConfig) {
  const out: { dimension: string; categories: string[] }[] = [];
  for (const [dimId, choice] of Object.entries(sliceConfig.categories)) {
    if (!choice?.categories.length) continue;
    // For grouped dimensions, show the selected groups rather than their expanded categories
    out.push({
      dimension: getDimensionLabel(metric, dimId) ?? '',
      categories: choice.groups?.length
        ? choice.groups.map((grp) => getGroupLabel(metric, dimId, grp) ?? '')
        : choice.categories.map((cat) => getCategoryLabel(metric, cat) ?? ''),
    });
  }
  return out;
}

/**
 * Progress tracking values: the total of the progress tracking scenario for
 * the years with measured data, starting from the reference year.
 */
function getProgressValues(
  progressMetric: ParsedMetric,
  slice: MetricSliceData,
  slicedDimId: string,
  sliceConfig: SliceConfig,
  metric: MetricDim,
  instance: InstanceContext,
  site: SiteContext
) {
  const progressScenario = getProgressTrackingScenario(site.scenarios);
  const progressSlice = sliceBy(progressMetric, slicedDimId, true, sliceConfig.categories);
  if (!progressSlice?.totalValues) return null;

  // Only years where this specific metric has measured data
  const measureDatapointYears = metric.measureDatapointYears ?? [];
  const progressYears =
    progressScenario?.actualHistoricalYears?.filter(
      (year) =>
        year !== instance.referenceYear &&
        measureDatapointYears.includes(year) &&
        year !== site.minYear
    ) ?? [];
  if (!progressYears.length) return null;

  const referenceYearIndex = slice.historicalYears.findIndex(
    (year) => year === instance.referenceYear
  );
  const historicalYears =
    referenceYearIndex !== -1
      ? progressSlice.historicalYears.slice(referenceYearIndex + 1)
      : progressSlice.historicalYears;
  const historicalValues =
    referenceYearIndex !== -1
      ? progressSlice.totalValues.historicalValues.slice(referenceYearIndex + 1)
      : progressSlice.totalValues.historicalValues;

  const lastHist = slice.historicalYears.length - 1;
  const totalSumX = [site.minYear, ...historicalYears, ...progressSlice.forecastYears];
  const totalSumY = [
    slice.totalValues?.historicalValues[lastHist] ?? 0,
    ...historicalValues,
    ...progressSlice.totalValues.forecastValues,
  ];

  // Keep the reference year, to draw a line from the total reference year
  // emissions to the first observed year emissions
  const years: number[] = [];
  const values: number[] = [];
  totalSumX.forEach((year, idx) => {
    const value = totalSumY[idx];
    if ([instance.referenceYear, ...progressYears].includes(year) && value !== null) {
      years.push(year);
      values.push(value);
    }
  });
  return { years, values };
}

/**
 * A node's dimensional metric as a chart, with controls to break it down by
 * and filter its dimensions, and a menu to download the data and the chart.
 */
export default function NodeMetricChart({
  title,
  metric,
  startYear,
  endYear,
  separateYears,
  activeGoal,
  instance,
  defaultSignificantDigits,
  site,
  labels,
  baselineForecast,
  withControls = true,
  withTools = true,
  color,
  colorAdjust,
  onClickMeasuredEmissions,
  forecastTitle,
  chartType = 'bar',
  editorDefaults,
}: NodeMetricChartProps) {
  const theme = useTheme();
  const locale = useLocale();
  const formatValue = useMemo(() => {
    const formatter = makeInstanceFormatter(locale, instance.features, defaultSignificantDigits);
    return (value: number) => formatWithFormatter(formatter, value);
  }, [locale, instance.features, defaultSignificantDigits]);
  const formatAxisValue = useMemo(() => {
    const formatter = new Intl.NumberFormat(locale);
    return (value: number) => formatter.format(value);
  }, [locale]);

  const scenarios = site?.scenarios ?? [];
  const hasProgressTracking = metricHasProgressTrackingScenario(metric, scenarios);
  const metrics = useMemo(
    () => ({
      default: parseMetric(metric),
      progress: hasProgressTracking ? parseMetric(metric, 'progress_tracking') : null,
    }),
    [metric, hasProgressTracking]
  );
  const parsedMetric = metrics.default;

  // The dimension to break down by and the category filters. They start from
  // the defaults for the active goal, and reset to them when the metric or the
  // goal changes. A metric has no identity of its own (it is a computed cube), so
  // its name and dimensions stand in for one.
  // The page editor's defaults, if any, go on top of those.
  const editorDefaultsKey = JSON.stringify(editorDefaults ?? null);
  const sliceConfigKey = `${metric.name}:${metric.dimensions.map((dim) => dim.id).join(',')}:${activeGoal?.id ?? ''}:${editorDefaultsKey}`;
  const defaultConfig = useMemo(
    () =>
      applyEditorDefaults(
        parsedMetric,
        getDefaultSliceConfig(parsedMetric, activeGoal),
        editorDefaults
      ),
    [parsedMetric, activeGoal, editorDefaults]
  );
  const [storedSliceConfig, setStoredSliceConfig] = useState<{
    key: string;
    config: SliceConfig;
  }>(() => ({ key: sliceConfigKey, config: defaultConfig }));
  const sliceConfig =
    storedSliceConfig.key === sliceConfigKey ? storedSliceConfig.config : defaultConfig;
  const setSliceConfig = useCallback(
    (update: SetStateAction<SliceConfig>) => {
      setStoredSliceConfig((current) => {
        const currentConfig = current.key === sliceConfigKey ? current.config : defaultConfig;
        const config = typeof update === 'function' ? update(currentConfig) : update;
        return { key: sliceConfigKey, config };
      });
    },
    [defaultConfig, sliceConfigKey]
  );

  const activeDimensionLabel = getDimensionLabel(parsedMetric, sliceConfig.dimensionId);
  // Active filters go to the chart subtitle
  const subtitle = getActiveFilterLabels(parsedMetric, sliceConfig)
    .map((dim) => `${dim.dimension}: ${dim.categories.join(' & ')}`)
    .join(', ')
    .trim();

  const slicedDim = sliceConfig.dimensionId
    ? parsedMetric.dimsById.get(sliceConfig.dimensionId)
    : undefined;

  // Categories whose values are all zero are dropped unless the instance asks
  // to show them (`showZerosInGraphs`); then they stay in the graph, legend and
  // tooltip, even though their bars have no height. Categories with no data at
  // all are dropped either way.
  const filterZero = !instance.features?.showZerosInGraphs;
  const slice: MetricSliceData =
    (slicedDim
      ? sliceBy(parsedMetric, slicedDim.id, true, sliceConfig.categories, true, { filterZero })
      : null) ?? flatten(parsedMetric, sliceConfig.categories);

  const goals = getGoalsForChoice(parsedMetric, sliceConfig.categories);
  const showBaseline =
    baselineForecast && site?.baselineName && instance.features?.baselineVisibleInGraphs;

  const yearRange = getFilteredYears(slice, instance, startYear, endYear);
  let { filteredYears, yearIndices } = yearRange;
  const { referenceYear, visibleForecastRange } = yearRange;
  const rangeYears = filteredYears;
  if (separateYears && separateYears.length > 0) {
    // separateYears bypasses the visible range and minimumHistoricalYear clipping:
    // we display exactly the requested years, including any (such as the reference
    // year) that fall outside the normal historical/forecast range.
    const allYears = [...slice.historicalYears, ...slice.forecastYears];
    filteredYears = allYears.filter((year) => separateYears.includes(year));
    yearIndices = filteredYears.map((year) => allYears.indexOf(year));
  }

  // Only show progress data for years where the metric has actual measured data
  const hasMeasuredYearsBeyondBaseline = (metric.measureDatapointYears ?? []).some(
    (year) => year !== instance.referenceYear && year !== site?.minYear
  );
  const progress =
    metrics.progress && slicedDim && site && hasMeasuredYearsBeyondBaseline
      ? getProgressValues(
          metrics.progress,
          slice,
          slicedDim.id,
          sliceConfig,
          metric,
          instance,
          site
        )
      : null;

  // Full data for each category in the chart
  const dataCategories = slice.categoryValues.map((cv) => ({
    name: cv.category.label,
    values: [...cv.historicalValues, ...cv.forecastValues],
  }));

  // Simple tables for category, goal, baseline, progress and total data, for the filtered years
  const headerRow = ['Category', ...filteredYears];
  const datasetTable = [
    headerRow,
    ...dataCategories.map((row) => [row.name, ...yearIndices.map((idx) => row.values[idx])]),
  ];

  // Goals are shown for the years of the range, also when only some years are compared
  const goalYears =
    goals !== null ? rangeYears.filter((year) => goals.some((g) => g.year === year)) : [];
  const goalTable =
    goals !== null && goalYears.length > 0
      ? [
          ['Category', ...goalYears],
          ['Goal', ...goalYears.map((year) => goals.find((g) => g.year === year)?.value)],
        ]
      : null;

  const baselineTable = showBaseline
    ? [
        headerRow,
        [
          'Baseline',
          ...filteredYears.map(
            (year) => baselineForecast?.find((forecast) => forecast.year === year)?.value
          ),
        ],
      ]
    : null;

  const progressTable = progress?.years.length
    ? [
        headerRow,
        [
          'Progress',
          ...filteredYears.map((year) => progress.values[progress.years.indexOf(year)] ?? null),
        ],
      ]
    : null;

  const totalValues = slice.totalValues
    ? [...slice.totalValues.historicalValues, ...slice.totalValues.forecastValues]
    : null;
  const totalTable =
    totalValues && metric.stackable
      ? [headerRow, ['Total', ...yearIndices.map((idx) => totalValues[idx])]]
      : null;

  // Colors are assigned over the *unfiltered* series of the sliced dimension, so that
  // a category keeps its color regardless of which categories are filtered out.
  // Same zero handling as `slice`, so a zero-valued category gets its own color.
  const defaultColor = color || theme.graphColors.blue050;
  const colorSlice = slicedDim
    ? (sliceBy(parsedMetric, slicedDim.id, true, {}, true, { filterZero }) ?? slice)
    : slice;
  const seriesColors = new Map<string, string>();
  if (colorSlice.categoryValues.length > 1) {
    // If we were asked to use a specific color, we generate the color scheme around it.
    // But always use category set color if available
    if (color || colorSlice.categoryValues.some((cv) => cv.color)) {
      const series = colorSlice.categoryValues.map((cv) => ({
        id: cv.category.id,
        color: cv.color,
      }));
      setUniqueColors(
        series,
        (s) => s.color,
        (s, newColor) => {
          s.color = newColor;
        },
        defaultColor
      );
      series.forEach((s) => seriesColors.set(s.id, s.color ?? defaultColor));
    } else {
      const themeColors = genColorsFromTheme(theme, colorSlice.categoryValues.length);
      colorSlice.categoryValues.forEach((cv, idx) => {
        seriesColors.set(cv.category.id, themeColors[idx]);
      });
    }
  }
  // If there is only one series in total, we use the default color
  const categoryColors = slice.categoryValues.map((cv) => {
    const seriesColor = seriesColors.get(cv.category.id) ?? defaultColor;
    return colorAdjust ? chroma(seriesColor).brighten(colorAdjust).hex() : seriesColor;
  });
  // Colors of the series visible in the chart, for the category buttons of the sliced dimension
  const visibleSeriesColors = new Map(
    slice.categoryValues.map((cv, idx) => [cv.category.id, categoryColors[idx]])
  );

  // Show the total line when some values are negative. Check the whole data,
  // not just the selected year range.
  const hasNegativeValues = slice.categoryValues.some((cv) =>
    [...cv.historicalValues, ...cv.forecastValues].some((value) => Number(value) < 0)
  );

  // All dimensions are shown, even those with a single category, so users can see
  // what the data consists of; the default breakdown still prefers one with several.
  // The breakdown choice is only shown when there are several dimensions.
  const controlDims = parsedMetric.dimensions;
  const controls =
    withControls && controlDims.length > 0 ? (
      <DimensionControls
        dimensions={controlDims}
        labels={labels.controls}
        options={controlDims.map((dim) =>
          getOptionsForDimension(parsedMetric, dim.id, sliceConfig.categories)
        )}
        withBreakdown={controlDims.length > 1}
        slicedDimensionId={slicedDim?.id}
        seriesColors={visibleSeriesColors}
        onSliceChange={(dimensionId) => {
          setSliceConfig((old) => ({ ...old, dimensionId }));
        }}
        onFilterChange={(dim, selected) => {
          setSliceConfig((old) => updateChoice(parsedMetric, dim, old, selected));
        }}
      />
    ) : null;

  const chartRef = useRef<ChartHandle | null>(null);
  const chartTitle = title
    ? title + (subtitle && activeDimensionLabel ? `: ${activeDimensionLabel}` : '')
    : null;

  // The CO2e correction is applied to both units, as the graph uses the short
  // unit in tooltips and the long one on the axis
  const unit = overrideUnit(parsedMetric, metric.unit, (key) => labels.units[key]);

  return (
    <>
      {controls}
      <Box sx={{ position: 'relative' }}>
        <NodeMetricChartGraph
          title={chartTitle}
          subtitle={subtitle}
          dataTable={datasetTable}
          goalTable={goalTable}
          baselineTable={baselineTable}
          progressTable={progressTable}
          totalTable={totalTable}
          unit={{ htmlLong: unit, htmlShort: unit }}
          referenceYear={referenceYear}
          forecastRange={visibleForecastRange}
          categoryColors={categoryColors}
          theme={theme}
          formatValue={formatValue}
          formatAxisValue={formatAxisValue}
          maximumFractionDigits={instance.features?.maximumFractionDigits ?? undefined}
          predictionLabel={labels.prediction}
          labels={labels.graph}
          baselineLabel={site?.baselineName}
          showTotalLine={hasNegativeValues && metric.stackable && dataCategories.length > 1}
          onClickMeasuredEmissions={onClickMeasuredEmissions}
          forecastTitle={forecastTitle}
          stackable={metric.stackable}
          chartType={chartType}
          chartRef={chartRef}
        />
        {withTools && (
          <ToolsMenu
            cube={parsedMetric}
            sliceConfig={sliceConfig}
            chartRef={chartRef}
            pngFilename={chartTitle ?? metric.name}
            filterZero={filterZero}
            labels={labels.tools}
          />
        )}
      </Box>
    </>
  );
}
