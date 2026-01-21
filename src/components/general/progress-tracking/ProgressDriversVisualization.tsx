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

enum SeriesType {
  PLANNED = 'PLANNED',
  OBSERVED = 'OBSERVED',
  CALCULATED = 'CALCULATED',
  /**
   * Inferred data points represent the latest measure datapoint from the parent node
   * when this node doesn't have its own data for that year. Used to show a grey dashed
   * line indicating what value was used in the parent's calculation.
   */
  INFERRED = 'INFERRED',
}

type Acc = {
  years: number[];
  defaultData: (number | null)[];
  progressData: (number | null)[];
  /**
   * Data points for the inferred (grey) line series. Contains:
   * 1. The latest measure datapoint from the parent node, if this node doesn't have
   *    its own data for that year. Since the parent aggregates child nodes, this shows
   *    the user what value was used in the calculation (even though they didn't input it).
   * 2. The second-to-last progress data point (needed to draw the grey connecting
   *    line in ECharts, but this point should not be displayed or shown in legend/tooltip)
   */
  inferredProgressData: (number | null)[];
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
  parentMeasureDatapointYears?: number[];
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

// Helper function to create custom tooltip markers
const getTooltipMarker = (seriesId: string | undefined, color: string) => {
  const circleMarker = `<span style="display:inline-block;margin-right:5px;border-radius:10px;width:10px;height:10px;background-color:${color};"></span>`;

  if (seriesId === SeriesType.PLANNED) {
    // Circle marker for planned
    return circleMarker;
  } else if (seriesId === SeriesType.OBSERVED || seriesId === SeriesType.INFERRED) {
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

export function ProgressDriversVisualization({
  metric,
  desiredOutcome,
  title,
  isDirectlyObserved = false,
  parentMeasureDatapointYears,
}: Props) {
  const [site] = useSiteWithSetter();
  const theme = useTheme();
  const { t } = useTranslation();
  const activeGoal = useReactiveVar(activeGoalVar);

  const chartData = useMemo<EChartsCoreOption | undefined>(() => {
    /**
     * The inferred year is the latest measure datapoint from the parent node,
     * if this node doesn't have its own data for that year. Since the parent
     * aggregates child nodes, this allows us to show the user what value was
     * used in the calculation (even though they didn't input it for this node).
     */
    let inferredYear: number | null = null;

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

    if (parentMeasureDatapointYears?.length) {
      const latestYear = [...parentMeasureDatapointYears].sort()[
        parentMeasureDatapointYears.length - 1
      ];

      if (!filteredProgressYears.includes(latestYear)) {
        filteredProgressYears.push(latestYear);
        inferredYear = latestYear;
      }
    }

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
            isProgressObserved: true,
          };
        }

        return {
          year,
          defaultValue: allDefaultData[i] ?? null,
          progressValue:
            year !== site.minYear && filteredProgressYears.includes(year)
              ? (allProgressData[i] ?? null)
              : null,
          isProgressObserved: year !== inferredYear,
        };
      })
      .filter(({ year }) => year >= firstProgressYear && year <= lastProgressYear);

    const nonNullProgressIndices = combinedData
      .map((data, i) => (typeof data.progressValue === 'number' ? i : -1))
      .filter((i) => i !== -1);

    const secondLastNonNullProgressIndex =
      nonNullProgressIndices.length >= 2
        ? nonNullProgressIndices[nonNullProgressIndices.length - 2]
        : -1;

    /**
     * Convert the combined data back into separate arrays of years, default values, and progress values
     */
    const { years, defaultData, progressData, inferredProgressData } = combinedData.reduce(
      (acc: Acc, data, i) => {
        return {
          years: [...acc.years, data.year],
          defaultData: [...acc.defaultData, data.defaultValue],
          progressData: [...acc.progressData, data.isProgressObserved ? data.progressValue : null],
          inferredProgressData: [
            ...acc.inferredProgressData,
            !data.isProgressObserved || i === secondLastNonNullProgressIndex
              ? data.progressValue
              : null,
          ],
        };
      },
      { years: [], defaultData: [], progressData: [], inferredProgressData: [] }
    );

    const interpolatedProgressData = interpolateProgressValues(progressData);

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

    const option: EChartsOption = {
      tooltip: {
        trigger: 'axis',
        textStyle: {
          width: 20,
        },
        formatter: function (params: DefaultLabelFormatterCallbackParams[]) {
          if (!(params instanceof Array)) {
            return '';
          }

          const year = params[0].axisValue;
          const noDataColor = theme.graphColors.red030 || '#ef9a9a';
          const noDataText = t('no-data-reported');
          const items = params.map((param) => {
            const color = param.color as string;
            const marker = getTooltipMarker(param.seriesId, color);
            const isInferredSeries = param.seriesId === SeriesType.INFERRED;

            if (param.value == null || typeof param.value !== 'number') {
              if (isInferredSeries) {
                return null;
              }

              return `${marker} ${param.seriesName}:
                <span style="color: ${noDataColor}; font-style: italic;">${noDataText}</span>`;
            }

            const value = param.value.toLocaleString(undefined, {
              maximumFractionDigits: 0,
            });

            if (isInferredSeries) {
              if (color === 'transparent') {
                return null;
              }

              return `<p style="padding-left: 18px; font-style: italic; color: ${theme.graphColors.grey050};">The latest observed value of ${value}${metric.unit.short} was used <br>to calculate GHG emissions for this year</p>`;
            }

            return `${marker} ${param.seriesName}: ${value} ${metric.unit.short}`;
          });

          return `${year}<br/>${items.join('<br/>')}`;
        },
      },
      legend: {
        bottom: 0,
        left: 'center',
        selectedMode: false,
        data: [t('planned'), t('observed'), t('calculated')],
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
          data: progressData,
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
        {
          id: SeriesType.INFERRED,
          type: 'line',
          symbol: TRIANGLE_SYMBOL,
          symbolSize: 10,
          data: typeof inferredYear === 'number' ? inferredProgressData : [],
          connectNulls: true,
          lineStyle: {
            type: 'dashed',
            width: 1,
            color: theme.graphColors.grey040,
          },
          itemStyle: {
            color: ({ dataIndex }) => {
              return dataIndex === progressData.length - 1
                ? theme.graphColors.grey050
                : 'transparent';
            },
          },
        },
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
    parentMeasureDatapointYears, // TODO: Check this array isn't created on each render in parent
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
