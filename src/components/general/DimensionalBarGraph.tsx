import { useEffect, useMemo, useState } from 'react';

import { useReactiveVar } from '@apollo/client/react';
import type { BarSeriesOption } from 'echarts';
import type { EChartsCoreOption } from 'echarts/core';
import { isEqual } from 'lodash-es';

import { Chart } from '@common/components/Chart';
import { useTheme } from '@common/themes';
import styled from '@common/themes/styled';

import type { DimensionalNodeMetricFragment } from '@/common/__generated__/graphql';
import { activeGoalVar } from '@/common/cache';
import { useTranslation } from '@/common/i18n';
import type { InstanceGoal } from '@/common/instance';
import { useNumberFormatter } from '@/common/numbers';
import { createAxisTooltipFormatter } from '@/components/charts/chartTooltip';
import { DimensionalMetric, type SliceConfig } from '@/data/metric';

const GraphContainer = styled.div`
  margin: 0 auto;
  min-width: 300px;
  max-width: 600px;
`;

const YearLabel = styled.div`
  font-size: 1.25rem;
  font-weight: 700;
`;

// The unit comes from the backend as an HTML snippet (sub/superscripts),
// which ECharts canvas text can't render — so it lives outside the chart.
const UnitLabel = styled.div`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.textColor.secondary};
`;

function getDefaultSliceConfig(cube: DimensionalMetric, activeGoal: InstanceGoal | null) {
  /**
   * By default, we group by the first dimension `metric` has, whatever it is.
   * @todo Is there a better way to select the default?
   *
   * If the currently selected goal has category selections for this metric,
   * we might choose another dimension.
   *
   * NOTE: This is just the default -- the actually active filtering and
   * grouping is controlled by the `sliceConfig` state below.
   */
  const defaultConfig: SliceConfig = {
    dimensionId: cube.dimensions[0]?.id,
    categories: {},
  };

  if (!activeGoal) return defaultConfig;

  const cubeDefault = cube.getChoicesForGoal(activeGoal);
  if (!cubeDefault) return defaultConfig;
  defaultConfig.categories = cubeDefault;
  /**
   * Check if our default dimension to slice by is affected by the
   * goal-based default filters. If so, we should choose another
   * dimension.
   */
  if (defaultConfig.dimensionId && cubeDefault.hasOwnProperty(defaultConfig.dimensionId)) {
    const firstPossible = cube.dimensions.find((dim) => !cubeDefault.hasOwnProperty(dim.id));
    defaultConfig.dimensionId = firstPossible?.id;
  }
  return defaultConfig;
}

type YearData = ReturnType<DimensionalMetric['getSingleYear']>;

function getChartConfig(
  yearData: YearData,
  fallbackColor: string,
  tooltipFormatter: ReturnType<typeof createAxisTooltipFormatter>
): EChartsCoreOption {
  const [rowType, colType] = yearData.categoryTypes;

  const columnLabels = colType.options.map(
    (colId) => yearData.allLabels.find((l) => l.id === colId)?.label ?? colId
  );
  const colTotals = colType.options.map((_, cIdx) =>
    yearData.rows.reduce((acc, row) => acc + (row[cIdx] ?? 0), 0)
  );

  const series: BarSeriesOption[] = rowType.options.flatMap((rowId, rIdx) => {
    const dimDetails = yearData.allLabels.find((l) => l.id === rowId);
    const values = yearData.rows[rIdx];
    // A category with no data in any column would only clutter the legend
    if (values.every((v) => !v)) return [];
    return [
      {
        type: 'bar',
        name: dimDetails?.label ?? rowId,
        stack: 'total',
        barWidth: '50%',
        itemStyle: { color: dimDetails?.color || fallbackColor },
        labelLayout: { hideOverlap: true },
        data: values.map((value, cIdx) => {
          const portion = colTotals[cIdx] ? (value ?? 0) / colTotals[cIdx] : 0;
          return {
            value,
            label: {
              // A label for the whole (portion === 1) or an empty segment is just noise
              show: portion > 0 && portion < 1,
              position: 'inside' as const,
              formatter: portion >= 0.01 ? `${Math.round(portion * 100)}%` : '<1%',
            },
          };
        }),
      },
    ];
  });

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: tooltipFormatter,
    },
    legend: {
      type: 'plain',
      bottom: 0,
    },
    grid: {
      containLabel: true,
      top: 20,
      bottom: 60,
      left: 10,
      right: 10,
    },
    xAxis: {
      type: 'category',
      data: columnLabels,
    },
    yAxis: {
      type: 'value',
    },
    series,
  };
}

type DimensionalBarGraphProps = {
  metric: NonNullable<DimensionalNodeMetricFragment['metricDim']>;
  endYear: number;
  color?: string | null;
};

const DimensionalBarGraph = ({ metric, endYear }: DimensionalBarGraphProps) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const formatNumber = useNumberFormatter();
  const activeGoal = useReactiveVar(activeGoalVar);
  const cube = useMemo(() => new DimensionalMetric(metric), [metric]);
  const defaultConfig = getDefaultSliceConfig(cube, activeGoal);
  const [sliceConfig, setSliceConfig] = useState<SliceConfig>(defaultConfig);

  useEffect(() => {
    /**
     * If the active goal changes, we will reset the grouping + filtering
     * to be compatible with the new choices (if the new goal has common
     * dimensions with our metric).
     */
    if (!activeGoal) return;
    const newDefault = getDefaultSliceConfig(cube, activeGoal);
    if (!newDefault || isEqual(sliceConfig, newDefault)) return;
    setSliceConfig(newDefault);
  }, [activeGoal, cube, sliceConfig]);

  const yearData = useMemo(
    () => cube.getSingleYear(endYear, sliceConfig.categories),
    [cube, endYear, sliceConfig]
  );

  let longUnit = metric.unit.htmlShort;
  // FIXME: Nasty hack to show 'CO2e' where it might be applicable until
  // the backend gets proper support for unit specifiers.
  if (cube.hasDimension('emission_scope') && !cube.hasDimension('greenhouse_gases')) {
    if (metric.unit.short === 't/Einw./a') {
      longUnit = t('tco2-e-inhabitant');
    } else if (metric.unit.short === 'kt/a') {
      longUnit = t('ktco2-e');
    }
  }

  const chartData = useMemo(
    () =>
      getChartConfig(
        yearData,
        theme.graphColors.grey050,
        createAxisTooltipFormatter((value) =>
          value == null ? '—' : `${formatNumber(value)} ${longUnit ?? ''}`
        )
      ),
    [yearData, theme.graphColors.grey050, formatNumber, longUnit]
  );

  return (
    <GraphContainer className="mt-3">
      <YearLabel>{endYear}</YearLabel>
      {!!longUnit && <UnitLabel dangerouslySetInnerHTML={{ __html: longUnit }} />}
      <Chart isLoading={false} data={chartData} height="400px" />
    </GraphContainer>
  );
};

export default DimensionalBarGraph;
