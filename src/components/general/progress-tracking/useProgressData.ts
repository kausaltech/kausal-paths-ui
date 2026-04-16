import { useMemo } from 'react';

import { useReactiveVar } from '@apollo/client';
import { useTheme } from '@emotion/react';

import type { DimensionalNodeMetricFragment } from '@/common/__generated__/graphql';
import { activeGoalVar } from '@/common/cache';
import { setUniqueColors } from '@/common/colors';
import { useSite } from '@/context/site';
import { DimensionalMetric, type MetricCategoryValues } from '@/data/metric';
import {
  getProgressTrackingScenario,
  metricHasBaselineScenario,
  metricHasProgressTrackingScenario,
} from '@/utils/progress-tracking';

export type MetricDim = NonNullable<DimensionalNodeMetricFragment['metricDim']>;

type ValuesSource = Pick<MetricCategoryValues, 'historicalValues' | 'forecastValues'>;

function getValueAtIndex(item: ValuesSource | null | undefined, index: number): number {
  if (!item) {
    return 0;
  }

  return [...item.historicalValues, ...item.forecastValues][index] ?? 0;
}

function mapCategoriesToEntries(
  defaultCategoryValues: MetricCategoryValues[],
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
    const defaultMetric = new DimensionalMetric(metric);
    const hasProgressTracking = metricHasProgressTrackingScenario(metric, site.scenarios);

    if (!hasProgressTracking) return [];

    const hasBaseline = metricHasBaselineScenario(metric, site.scenarios);

    const metrics = {
      default: defaultMetric,
      progress: new DimensionalMetric(metric, 'progress_tracking'),
      ...(hasBaseline ? { baseline: new DimensionalMetric(metric, 'baseline') } : {}),
    };

    const defaultConfig = metrics.default.getDefaultSliceConfig(activeGoal);
    const defaultSlice = metrics.default.sliceBy(
      defaultConfig.dimensionId,
      true,
      defaultConfig.categories
    );

    const progressSlice = metrics.progress.sliceBy(
      defaultConfig.dimensionId,
      true,
      defaultConfig.categories
    );

    const baselineSlice = hasBaseline
      ? metrics.baseline!.sliceBy(defaultConfig.dimensionId!, true, defaultConfig.categories)
      : null;

    /**
     * Generate colours for nodes missing colours using the same
     * logic as DimensionalNodePlot for node colour consistency.
     * Note that the setUniqueColors function mutates the categoryValues.
     */
    if (defaultSlice.categoryValues.length > 1) {
      setUniqueColors(
        defaultSlice.categoryValues,
        (categoryValue) => categoryValue.color,
        (categoryValue, color) => {
          categoryValue.color = color;
        },
        defaultColor
      );

      setUniqueColors(
        progressSlice.categoryValues,
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

      const findInSlice = (slice: typeof progressSlice, categoryValue: MetricCategoryValues) =>
        slice.categoryValues.find(
          ({ category }) => category.originalId === categoryValue.category.originalId
        );

      return {
        year,
        unit: defaultSlice.unit,
        totalExpected: getValueAtIndex(defaultSlice.totalValues, yearIndex),
        expected: mapCategoriesToEntries(
          defaultSlice.categoryValues,
          (categoryValue) => categoryValue,
          yearIndex
        ),
        totalObserved: getValueAtIndex(progressSlice.totalValues, yearIndex),
        observed: mapCategoriesToEntries(
          defaultSlice.categoryValues,
          (categoryValue) => findInSlice(progressSlice, categoryValue),
          progressIndex
        ),
        totalBaseline: baselineSlice ? getValueAtIndex(baselineSlice.totalValues, yearIndex) : null,
        baseline: baselineSlice
          ? mapCategoriesToEntries(
              defaultSlice.categoryValues,
              (categoryValue) => findInSlice(baselineSlice, categoryValue),
              yearIndex
            )
          : [],
      };
    });
  }, [metric, site.scenarios, site.minYear, activeGoal, defaultColor]);
}
