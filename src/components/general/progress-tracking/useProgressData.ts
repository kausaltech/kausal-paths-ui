import { useMemo } from 'react';

import { useReactiveVar } from '@apollo/client/react';

import { useTheme } from '@common/themes';
import { setUniqueColors } from '@common/utils/paths/colors';
import {
  type MetricCategoryValues,
  type MetricSliceData,
  getDefaultSliceConfig,
  parseMetric,
  sliceBy,
} from '@common/utils/paths/metric';
import {
  getBaselineScenario,
  getProgressTrackingScenario,
  metricHasBaselineScenario,
  metricHasProgressTrackingScenario,
} from '@common/utils/paths/progress-tracking';

import type { DimensionalNodeMetricFragment } from '@/common/__generated__/graphql';
import { activeGoalVar } from '@/common/cache';
import { useSite } from '@/context/site';

export type MetricDim = NonNullable<DimensionalNodeMetricFragment['metricDim']>;

type ValuesSource = Pick<MetricCategoryValues, 'historicalValues' | 'forecastValues'>;

function getValueAtIndex(item: ValuesSource | null | undefined, index: number): number {
  if (!item) {
    return 0;
  }

  return [...item.historicalValues, ...item.forecastValues][index] ?? 0;
}

function mapCategoriesToEntries(
  defaultCategoryValues: readonly MetricCategoryValues[],
  lookupCv: (categoryValue: MetricCategoryValues) => ValuesSource | undefined,
  index: number
) {
  return defaultCategoryValues.map((categoryValue) => ({
    id: categoryValue.category.originalId!,
    color: categoryValue.color || '',
    label: categoryValue.category.label,
    value: getValueAtIndex(lookupCv(categoryValue), index),
  }));
}

export type ProgressData = {
  year: number;
  unit: string;
  totalExpected: number | null;
  expected: {
    id: string;
    color: string;
    label: string;
    value: number;
  }[];
  totalObserved: number | null;
  observed: {
    id: string;
    color: string;
    label: string;
    value: number;
  }[];
  totalBaseline: number | null;
  baseline: {
    id: string;
    color: string;
    label: string;
    value: number;
  }[];
};

export function useProgressData(metric: MetricDim, color?: string): ProgressData[] {
  const site = useSite();
  const activeGoal = useReactiveVar(activeGoalVar);
  const theme = useTheme();
  const defaultColor = color || theme.graphColors.blue070;

  return useMemo(() => {
    const hasProgressTracking = metricHasProgressTrackingScenario(metric, site.scenarios);

    if (!hasProgressTracking) return [];

    const hasBaseline = metricHasBaselineScenario(metric, site.scenarios);
    const baselineScenario = getBaselineScenario(site.scenarios);

    const defaultMetric = parseMetric(metric);
    const defaultConfig = getDefaultSliceConfig(defaultMetric, activeGoal);
    const { dimensionId, categories } = defaultConfig;
    if (!dimensionId) return [];

    const sliceScenario = (scenarioId?: string) =>
      sliceBy(
        scenarioId ? parseMetric(metric, scenarioId) : defaultMetric,
        dimensionId,
        true,
        categories
      );
    const defaultSlice = sliceScenario();
    const progressSlice = sliceScenario('progress_tracking');
    const baselineSlice =
      hasBaseline && baselineScenario ? sliceScenario(baselineScenario.id) : null;
    if (!defaultSlice || !progressSlice) return [];

    /**
     * Generate colours for nodes missing colours using the same
     * logic as DimensionalNodePlot for node colour consistency.
     * The entries take their colours from the default slice's categories.
     */
    const defaultCategoryValues = defaultSlice.categoryValues.map((cv) => ({ ...cv }));
    if (defaultCategoryValues.length > 1) {
      setUniqueColors(
        defaultCategoryValues,
        (categoryValue) => categoryValue.color,
        (categoryValue, color) => {
          categoryValue.color = color;
        },
        defaultColor
      );
    }

    const progressScenario = getProgressTrackingScenario(site.scenarios);
    const measureDatapointYears = metric.measureDatapointYears ?? [];

    // Filter progress years to only include years where this metric has measured data
    const progressYears = (progressScenario?.actualHistoricalYears ?? []).filter(
      (year) => measureDatapointYears.includes(year) && year !== site.minYear
    );

    return progressYears.map((year) => {
      const yearIndex = [...defaultSlice.historicalYears, ...defaultSlice.forecastYears].indexOf(
        year
      );
      const progressIndex = [
        ...progressSlice.historicalYears,
        ...progressSlice.forecastYears,
      ].indexOf(year);

      const findInSlice = (slice: MetricSliceData, categoryValue: MetricCategoryValues) =>
        slice.categoryValues.find(
          ({ category }) => category.originalId === categoryValue.category.originalId
        );

      return {
        year,
        unit: defaultSlice.unit,
        totalExpected: getValueAtIndex(defaultSlice.totalValues, yearIndex),
        expected: mapCategoriesToEntries(
          defaultCategoryValues,
          (categoryValue) => categoryValue,
          yearIndex
        ),
        totalObserved: getValueAtIndex(progressSlice.totalValues, yearIndex),
        observed: mapCategoriesToEntries(
          defaultCategoryValues,
          (categoryValue) => findInSlice(progressSlice, categoryValue),
          progressIndex
        ),
        totalBaseline: baselineSlice ? getValueAtIndex(baselineSlice.totalValues, yearIndex) : null,
        baseline: baselineSlice
          ? mapCategoriesToEntries(
              defaultCategoryValues,
              (categoryValue) => findInSlice(baselineSlice, categoryValue),
              yearIndex
            )
          : [],
      };
    });
  }, [metric, site.scenarios, site.minYear, activeGoal, defaultColor]);
}
