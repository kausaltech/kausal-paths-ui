import { useMemo } from 'react';

import { useReactiveVar } from '@apollo/client';
import { useTheme } from '@emotion/react';
import type { Theme } from '@emotion/react';
import styled from '@emotion/styled';
import type {
  DefaultLabelFormatterCallbackParams,
  EChartsCoreOption,
  EChartsOption,
} from 'echarts';
import { useTranslation } from 'next-i18next';

import { Chart } from '@common/components/Chart';

import { DesiredOutcome, type GetNodeVisualizationsQuery } from '@/common/__generated__/graphql';
import { activeGoalVar } from '@/common/cache';
import { useSiteWithSetter } from '@/context/site';
import { DimensionalMetric } from '@/data/metric';
import { getProgressTrackingScenario } from '@/utils/progress-tracking';

const X_SYMBOL =
  'path://M0.979266 20.7782C-0.192306 21.9497 -0.192307 23.8492 0.979266 25.0208C2.15084 26.1924 4.05033 26.1924 5.22191 ' +
  '25.0208L13.0001 17.2426L20.7783 25.0208C21.9498 26.1924 23.8493 26.1924 25.0209 25.0208C26.1925 23.8492 26.1925 21.9497 ' +
  '25.0209 20.7782L17.2427 13L25.0209 5.22181C26.1925 4.05024 26.1925 2.15075 25.0209 0.979174C23.8493 -0.192399 21.9498 ' +
  '-0.192399 20.7783 0.979174L13.0001 8.75735L5.22191 0.979175C4.05033 -0.192398 2.15084 -0.192398 0.979266 0.979175C-0.192307 ' +
  '2.15075 -0.192307 4.05024 0.979266 5.22182L8.75744 13L0.979266 20.7782Z';

const TRIANGLE_SYMBOL = 'path://M13 2L23.2583 21.25H2.74167L13 2Z';

const COMMON_AREA_CONFIG = {
  stack: 'expected',
  type: 'line' as const,
  silent: true,
  tooltip: {
    show: false,
  },
  lineStyle: {
    opacity: 0,
  },
  symbol: 'none',
};

const getNegativeAreaStyle = (theme: Theme) => ({
  opacity: 0.2,
  color: theme.graphColors.red030,
});

const getPositiveAreaStyle = (theme: Theme) => ({
  opacity: 0.3,
  color: theme.graphColors.green010,
});

const StyledChartTitle = styled.h4`
  font-size: ${({ theme }) => theme.fontSizeBase};
  font-weight: ${({ theme }) => theme.fontWeightBase};
  margin-bottom: ${({ theme }) => theme.spaces.s050};
  color: ${({ theme }) => theme.textColor.secondary};
`;

type Props = {
  metric: NonNullable<NonNullable<GetNodeVisualizationsQuery['node']>['metricDim']>;
  desiredOutcome: DesiredOutcome;
  title?: string;
  /** Show progress tracker values as observed rather than calculated */
  isDirectlyObserved?: boolean;
  /** The most recent year in the parent node that has progress tracking data */
  parentLastProgressYear?: number;
};

/**
 * Users may have skipped years in their progress data. In order to colour the area
 * between the expected and observed lines, we need to interpolate the progress data
 * to fill in any gaps and follow the interpolated line.
 *
 * This might be doable will less loops and mutations, but hopefully this is easier to follow.
 */
function interpolateProgressValues(progressData: (number | null)[]): (number | null)[] {
  const result = [...progressData];

  let startIndex = 0;
  while (startIndex < result.length) {
    // Find next gap of null values
    while (startIndex < result.length && result[startIndex] !== null) {
      startIndex++;
    }

    // Find end of gap
    let endIndex = startIndex;
    while (endIndex < result.length && result[endIndex] === null) {
      endIndex++;
    }

    // If we found a gap and have values on both sides
    if (startIndex > 0 && endIndex < result.length) {
      const startValue = result[startIndex - 1] as number;
      const endValue = result[endIndex] as number;
      const gap = endIndex - startIndex;

      // Calculate step size for interpolation
      const step = (endValue - startValue) / (gap + 1);

      // Fill in interpolated values
      for (let i = 0; i < gap; i++) {
        result[startIndex + i] = startValue + step * (i + 1);
      }
    }

    startIndex = endIndex;
  }

  return result;
}

export function ProgressDriversVisualization({
  metric,
  desiredOutcome,
  title,
  isDirectlyObserved = false,
  parentLastProgressYear,
}: Props) {
  const [site] = useSiteWithSetter();
  const theme = useTheme();
  const { t } = useTranslation();
  const activeGoal = useReactiveVar(activeGoalVar);

  type Acc = {
    years: number[];
    defaultData: (number | null)[];
    progressData: (number | null)[];
    inferredFlags: boolean[];
  };

  const chartData = useMemo<EChartsCoreOption | undefined>(() => {
    const negativeAreaStyle = getNegativeAreaStyle(theme);
    const positiveAreaStyle = getPositiveAreaStyle(theme);

    if (!metric) {
      return undefined;
    }

    const dimensionalMetric = new DimensionalMetric(metric, DimensionalMetric.ALL_SCENARIOS);
    const defaultConfig = dimensionalMetric.getDefaultSliceConfig(activeGoal);

    const slicedDim = dimensionalMetric.dimensions.find(
      (dim) => dim.id === defaultConfig.dimensionId
    );

    if (!slicedDim) {
      return undefined;
    }

    const slice = dimensionalMetric.sliceBy(slicedDim.id, false, defaultConfig.categories);

    // Get years and values for both scenarios
    const defaultScenario = slice.categoryValues.find((cv) => cv.category.originalId === 'default');
    const progressScenario = slice.categoryValues.find(
      (cv) => cv.category.originalId === 'progress_tracking'
    );

    if (!defaultScenario) return undefined;

    const progressYears = [
      ...(getProgressTrackingScenario(site.scenarios)?.actualHistoricalYears ?? []),
    ];

    const [firstProgressYear, lastProgressYear] = progressYears
      .sort()
      .filter((_, i) => i === 0 || i === progressYears.length - 1);

    // Filter progress years to only render years with data
    const filteredProgressYears = metric.measureDatapointYears.length
      ? progressYears.filter((year) => metric.measureDatapointYears.includes(year))
      : [];

    // Determine if we need to show an inferred data point for the most recent year
    // This happens when the parent node has data for a year but this specific driver doesn't
    const effectiveLastProgressYear = parentLastProgressYear ?? lastProgressYear;
    const lastInputtedYear = filteredProgressYears.length
      ? Math.max(...filteredProgressYears)
      : null;
    const showInferredDatapoint =
      isDirectlyObserved &&
      effectiveLastProgressYear &&
      lastInputtedYear !== null &&
      effectiveLastProgressYear > lastInputtedYear &&
      metric.measureDatapointYears.length > 0;
    const inferredYear = showInferredDatapoint ? effectiveLastProgressYear : null;

    const allYears = [...slice.historicalYears, ...slice.forecastYears];
    const allDefaultData = [...defaultScenario.historicalValues, ...defaultScenario.forecastValues];
    const allProgressData = [
      ...(progressScenario?.historicalValues ?? []),
      ...(progressScenario?.forecastValues ?? []),
    ];

    const combinedData = allYears
      .map((year, i) => {
        /**
         * The first year (baseline) is the same for both scenarios, always
         * render the default value as the starting point for progress tracking.
         * We don't render a marker for this point.
         */
        if (year === firstProgressYear) {
          return {
            year,
            defaultValue: allDefaultData[i] ?? null,
            progressValue: allDefaultData[i] ?? null,
            isInferred: false,
          };
        }

        // Check if this is an inferred data point (parent has data but this driver doesn't)
        const isInferred = year === inferredYear;

        return {
          year,
          defaultValue: allDefaultData[i] ?? null,
          progressValue:
            year !== site.minYear && (filteredProgressYears.includes(year) || isInferred)
              ? (allProgressData[i] ?? null)
              : null,
          isInferred,
        };
      })
      .filter(
        ({ year }) => year >= firstProgressYear && year <= (inferredYear ?? lastProgressYear)
      );

    /**
     * Convert the combined data back into separate arrays of years, default values, and progress values
     */
    const { years, defaultData, progressData, inferredFlags } = combinedData.reduce(
      (acc: Acc, data) => {
        return {
          years: [...acc.years, data.year],
          defaultData: [...acc.defaultData, data.defaultValue],
          progressData: [...acc.progressData, data.progressValue],
          inferredFlags: [...acc.inferredFlags, data.isInferred],
        };
      },
      { years: [], defaultData: [], progressData: [], inferredFlags: [] }
    );

    const interpolatedProgressData = interpolateProgressValues(progressData);

    // Separate actual progress data from inferred data
    const actualProgressData = progressData.map((value, i) => (inferredFlags[i] ? null : value));

    // Find the index of the last actual (non-inferred) data point with a value
    let lastActualIndex = -1;
    for (let i = actualProgressData.length - 1; i >= 0; i--) {
      if (actualProgressData[i] !== null) {
        lastActualIndex = i;
        break;
      }
    }

    // Create data for the inferred line (connects last actual point to inferred point)
    const inferredLineData: (number | null)[] = progressData.map((value, i) => {
      if (inferredFlags[i]) {
        return value; // The inferred point
      }
      if (i === lastActualIndex) {
        return value; // The last actual point
      }
      return null;
    });

    // Find if there's an inferred point
    const inferredIndex = inferredFlags.findIndex((flag) => flag);
    const hasInferredPoint = inferredIndex !== -1;

    const areaData = defaultData.map((value, i) => {
      const progressValue = interpolatedProgressData[i];

      if (value == null || progressValue == null) {
        return null;
      }

      if (progressValue > value) {
        return {
          above: progressValue - value,
          below: 0,
        };
      } else if (progressValue < value) {
        return {
          above: 0,
          below: progressValue - value,
        };
      } else {
        return {
          above: 0,
          below: 0,
        };
      }
    });

    enum SeriesType {
      PLANNED = 'PLANNED',
      OBSERVED = 'OBSERVED',
      CALCULATED = 'CALCULATED',
      INFERRED = 'INFERRED',
      INFERRED_LINE = 'INFERRED_LINE',
    }

    // Helper function to create custom tooltip markers
    const getTooltipMarker = (seriesId: string | undefined, color: string) => {
      const circleMarker = `<span style="display:inline-block;margin-right:5px;border-radius:10px;width:10px;height:10px;background-color:${color};"></span>`;

      if (seriesId === SeriesType.PLANNED) {
        // Circle marker for planned
        return circleMarker;
      } else if (seriesId === SeriesType.OBSERVED) {
        // Triangle marker for observed
        return `<span style="display:inline-block;margin-right:5px;width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-bottom:9px solid ${color};"></span>`;
      } else if (seriesId === SeriesType.CALCULATED) {
        // X marker for calculated
        return `<span style="display:inline-block;margin-right:5px;position:relative;width:10px;height:10px;">
          <span style="position:absolute;top:50%;left:0;width:100%;height:2px;background-color:${color};transform:translateY(-50%) rotate(45deg);"></span>
          <span style="position:absolute;top:50%;left:0;width:100%;height:2px;background-color:${color};transform:translateY(-50%) rotate(-45deg);"></span>
        </span>`;
      }

      // Default circle marker
      return circleMarker;
    };

    // Get the inferred value for tooltip display
    const inferredValue =
      hasInferredPoint && lastActualIndex !== -1 ? actualProgressData[lastActualIndex] : null;
    const formattedInferredValue =
      inferredValue !== null
        ? inferredValue.toLocaleString(undefined, { maximumFractionDigits: 0 })
        : '';

    const option: EChartsOption = {
      tooltip: {
        trigger: 'axis',
        extraCssText: 'max-width: 280px; white-space: normal;',
        formatter: function (params: DefaultLabelFormatterCallbackParams[]) {
          if (!(params instanceof Array)) {
            return '';
          }

          const year = (params[0] as { axisValue?: string | number }).axisValue;
          const yearIndex = years.indexOf(Number(year));
          const isInferredYear = yearIndex !== -1 && inferredFlags[yearIndex];
          const noDataColor = theme.graphColors.red030 || '#ef9a9a';
          const noDataText = t('no-data-reported');
          const inferredValueText = t('inferred-value-note', {
            value: formattedInferredValue,
            unit: metric.unit.short,
          });

          // Filter out inferred series from tooltip
          const filteredParams = params.filter(
            (param) =>
              param.seriesId !== SeriesType.INFERRED && param.seriesId !== SeriesType.INFERRED_LINE
          );

          const items = filteredParams.map((param) => {
            const color = param.color as string;
            const marker = getTooltipMarker(param.seriesId, color);

            // For the observed/calculated series on an inferred year, show no data with special note
            if (
              isInferredYear &&
              (param.seriesId === SeriesType.OBSERVED || param.seriesId === SeriesType.CALCULATED)
            ) {
              return `${marker} ${param.seriesName}:
                <span style="color: ${noDataColor}; font-style: italic;">${noDataText}</span>
                <div style="padding-left: 15px; color: ${theme.graphColors.grey050}; font-size: 0.95em; font-style: italic;">${inferredValueText}</div>`;
            }

            const numValue = typeof param.value === 'number' ? param.value : NaN;
            if (param.value == null || isNaN(numValue)) {
              return `${marker} ${param.seriesName}:
                <span style="color: ${noDataColor}; font-style: italic;">${noDataText}</span>`;
            }
            const value = numValue.toLocaleString(undefined, {
              maximumFractionDigits: 0,
            });

            return `${marker} ${param.seriesName}: ${value} ${metric.unit.short}`;
          });

          return `${year}<br/>${items.join('<br/>')}`;
        },
      },
      legend: {
        bottom: 0,
        left: 'center',
        selectedMode: false,
        // Only show the planned and observed/calculated series in the legend
        data: [t('planned'), isDirectlyObserved ? t('observed') : t('calculated')],
      },
      grid: {
        left: '2%',
        right: '5%',
        top: '5%',
        bottom: '15%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: years,
        boundaryGap: true,
        axisTick: {
          show: false,
        },
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: metric.unit.short.length > 2 ? '{value}' : `{value} ${metric.unit.short}`,
        },
      },
      series: [
        {
          id: SeriesType.PLANNED,
          stack: COMMON_AREA_CONFIG.stack,
          name: t('planned'),
          type: 'line' as const,
          symbol: 'circle',
          symbolSize: 8,
          data: defaultData,
          lineStyle: {
            width: 2,
            color: theme.graphColors.blue070,
          },
          itemStyle: {
            color: theme.graphColors.blue070,
          },
        },
        {
          // Fill the area above the expected line until the observed line
          data: areaData.map((area) => area?.above ?? null),
          areaStyle:
            desiredOutcome === DesiredOutcome.Increasing ? positiveAreaStyle : negativeAreaStyle,
          ...COMMON_AREA_CONFIG,
        },
        {
          // Fill the area below the expected line until the observed line
          data: areaData.map((area) => area?.below ?? null),
          stackStrategy: 'positive',
          areaStyle:
            desiredOutcome === DesiredOutcome.Decreasing ? positiveAreaStyle : negativeAreaStyle,
          ...COMMON_AREA_CONFIG,
        },
        {
          id: isDirectlyObserved ? SeriesType.OBSERVED : SeriesType.CALCULATED,
          name: isDirectlyObserved ? t('observed') : t('calculated'),
          type: 'line',
          symbol: isDirectlyObserved ? TRIANGLE_SYMBOL : X_SYMBOL,
          symbolSize: 10,
          data: actualProgressData,
          connectNulls: true,
          lineStyle: {
            type: 'dashed',
            width: 1,
            color: theme.graphColors.blue030,
          },
          itemStyle: {
            color: theme.graphColors.blue050,
          },
        },
        // Inferred line connecting last actual point to inferred point (grey dashed)
        ...(hasInferredPoint
          ? [
              {
                id: SeriesType.INFERRED_LINE,
                type: 'line' as const,
                data: inferredLineData,
                connectNulls: true,
                symbol: 'none',
                lineStyle: {
                  type: 'dashed' as const,
                  width: 1,
                  color: theme.graphColors.grey050,
                },
                tooltip: {
                  show: false,
                },
              },
              // Inferred point (grey triangle)
              {
                id: SeriesType.INFERRED,
                type: 'line' as const,
                data: inferredLineData.map((value, i) => (inferredFlags[i] ? value : null)),
                symbol: TRIANGLE_SYMBOL,
                symbolSize: 10,
                lineStyle: {
                  opacity: 0,
                },
                itemStyle: {
                  color: theme.graphColors.grey050,
                },
              },
            ]
          : []),
      ],
    };
    return option;
  }, [
    t,
    metric,
    theme,
    activeGoal,
    site.minYear,
    site.scenarios,
    desiredOutcome,
    isDirectlyObserved,
    parentLastProgressYear,
  ]);

  if (!chartData) {
    return null;
  }

  return (
    <>
      <StyledChartTitle>{title}</StyledChartTitle>
      <Chart isLoading={false} data={chartData} height="220px" />
    </>
  );
}
