import { useMemo } from 'react';
import { useSite } from '@/context/site';
import { useReactiveVar } from '@apollo/client';
import { activeGoalVar } from '@/common/cache';
import { DimensionalMetric } from '@/data/metric';
import {
  metricHasProgressTrackingScenario,
  getProgressTrackingScenario,
} from '@/utils/progress-tracking';
import { getDefaultSliceConfig } from '@/components/general/DimensionalNodePlot';
import { setUniqueColors } from '@/common/colors';
import { useTheme } from 'styled-components';
import type { DimensionalNodeMetricFragment } from '@/common/__generated__/graphql';

export type MetricDim = NonNullable<DimensionalNodeMetricFragment['metricDim']>;

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

    const metrics = {
      default: defaultMetric,
      progress: new DimensionalMetric(metric, 'progress_tracking'),
    };

    const defaultConfig = getDefaultSliceConfig(metrics.default, activeGoal);
    const defaultSlice = metrics.default.sliceBy(
      defaultConfig.dimensionId!,
      true,
      defaultConfig.categories
    );

    const progressSlice = metrics.progress.sliceBy(
      defaultConfig.dimensionId!,
      true,
      defaultConfig.categories
    );

    /**
     * Generate colours for nodes missing colours using the same
     * logic as DimensionalNodePlot for node colour consistency.
     * Note that the setUniqueColors function mutates the categoryValues.
     */
    if (defaultSlice.categoryValues.length > 1) {
      setUniqueColors(
        defaultSlice.categoryValues,
        (cv) => cv.color,
        (cv, color) => {
          cv.color = color;
        },
        defaultColor
      );

      setUniqueColors(
        progressSlice.categoryValues,
        (cv) => cv.color,
        (cv, color) => {
          cv.color = color;
        },
        defaultColor
      );
    }

    const progressScenario = getProgressTrackingScenario(site.scenarios);
    const progressYears = progressScenario?.actualHistoricalYears ?? [];

    return progressYears.map((year) => {
      const yearIndex = [...defaultSlice.historicalYears, ...defaultSlice.forecastYears].indexOf(
        year
      );
      const progressIndex = [
        ...progressSlice.historicalYears,
        ...progressSlice.forecastYears,
      ].indexOf(year);

      return {
        year,
        unit: defaultSlice.unit,
        totalExpected:
          [
            ...(defaultSlice.totalValues?.historicalValues ?? []),
            ...(defaultSlice.totalValues?.forecastValues ?? []),
          ][yearIndex] || 0,
        expected: defaultSlice.categoryValues.map((cv) => ({
          id: cv.category.originalId!,
          color: cv.color || '',
          label: cv.category.label,
          value: [...cv.historicalValues, ...cv.forecastValues][yearIndex] || 0,
        })),
        totalObserved:
          [
            ...(progressSlice.totalValues?.historicalValues ?? []),
            ...(progressSlice.totalValues?.forecastValues ?? []),
          ][yearIndex] || 0,
        observed: defaultSlice.categoryValues.map((cv) => {
          const matchingProgressCategory = progressSlice.categoryValues.find(
            ({ category }) => category.originalId === cv.category.originalId
          );

          return {
            id: cv.category.originalId!,
            color: cv.color || '',
            label: cv.category.label,
            value: matchingProgressCategory
              ? [
                  ...matchingProgressCategory.historicalValues,
                  ...matchingProgressCategory.forecastValues,
                ][progressIndex] || 0
              : 0,
          };
        }),
      };
    });
  }, [metric, site.scenarios, activeGoal, defaultColor]);
}
