import { useMemo } from 'react';

import { useReactiveVar } from '@apollo/client';
import { useTheme } from '@emotion/react';
import type { Theme } from '@kausal/themes/types';
import type { EChartsCoreOption } from 'echarts/core';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';

import type { GetImpactOverviewsQuery } from '@/common/__generated__/graphql';
import { yearRangeVar } from '@/common/cache';
import { Chart } from '@/components/charts/Chart';
import { ChartWrapper } from '@/components/charts/ChartWrapper';
import { DimensionalMetric } from '@/data/metric';

/**
 * For cost-benefit visualisations, only effectDim is used.
 * Previously, costs were in costDim and benefits in effectDim.
 * But it makes more sense to have everything in one node so that
 * positive category values are costs and negative are benefits.
 */

type Props = {
  data?: GetImpactOverviewsQuery;
  isLoading: boolean;
};

type Cubes = {
  metric: DimensionalMetric;
  totals: {
    cost: number;
    benefit: number;
    netBenefit: number;
  };
};

function getChartData(data: Cubes[], theme: Theme, t: TFunction): EChartsCoreOption {
  const sortedData = data.sort((a, b) => a.totals.netBenefit - b.totals.netBenefit);
  const unit = sortedData.length > 0 ? sortedData[0].metric?.data.unit.short : undefined;
  const unitLabel = typeof unit === 'string' ? t(unit) : '';

  const config: EChartsCoreOption = {
    dataset: {
      dimensions: [
        { name: 'action', type: 'ordinal' },
        { name: 'cost', type: 'number' },
        { name: 'benefit', type: 'number' },
        { name: 'netBenefit', type: 'number' },
      ],
      source: sortedData.map((item) => {
        return {
          action: item.metric.data.name,
          cost: item.totals.cost,
          benefit: item.totals.benefit,
          netBenefit: item.totals.netBenefit,
        };
      }),
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
      valueFormatter: (value) => `${Math.round(value)} ${unitLabel}`,
    },
    legend: {
      data: [{ name: 'Net Benefit', icon: 'circle' }, 'Benefit', 'Cost'],
    },
    grid: {
      containLabel: true,
      top: 80,
      bottom: 30,
    },
    xAxis: {
      type: 'value',
      position: 'top',
      axisLabel: {
        formatter: `{value} ${unitLabel}`,
      },
    },
    yAxis: {
      type: 'category',
      splitArea: { show: true },
      axisLine: { show: false },
      axisLabel: { show: true, width: 200, overflow: 'break', align: 'right' },
      axisTick: { show: false },
      splitLine: { show: false },
    },
    series: [
      {
        type: 'custom',
        name: 'Net Benefit',
        itemStyle: {
          color: theme.themeColors.black,
          borderWidth: 2,
        },
        renderItem: function (params, api) {
          const categoryIndex = api.value('action');
          const netBenefit = api.value('netBenefit');
          const highPoint = api.coord([netBenefit, categoryIndex]);
          const height = api.size([0, 1])[1];
          const halfHeight = height / 2;
          const OFFSET = 5;
          const color = api.visual('color');
          const style = api.style({ stroke: color, fill: color });

          return {
            name: 'Net benefit',
            type: 'group',
            barCategoryGap: '50%',
            groupPadding: 20,
            children: [
              {
                type: 'circle',
                transition: ['shape'],
                shape: {
                  cx: highPoint[0],
                  cy: highPoint[1] - halfHeight + OFFSET,
                  r: 4,
                },
                style: style,
              },
              {
                label: {
                  show: false,
                },
                type: 'line',
                transition: ['shape'],
                shape: {
                  x1: highPoint[0],
                  y1: highPoint[1] - halfHeight + OFFSET,
                  x2: highPoint[0],
                  y2: highPoint[1] + halfHeight - OFFSET,
                },
                style: style,
              },
              {
                type: 'text',
                style: {
                  text: `${Math.round(netBenefit)} ${unitLabel}`,
                  font: '12px sans-serif',
                  fill: theme.themeColors.black,
                  textAlign: 'left',
                  textBaseline: 'middle',
                },
                position: [highPoint[0] + 10, highPoint[1] - halfHeight + OFFSET],
              },
            ],
          };
        },
        encode: { x: 'netBenefit', y: 'action' },
        z: 100,
      },
      {
        type: 'bar',
        barCategoryGap: '40%',
        name: 'Benefit',
        encode: { x: 'benefit', y: 'action' },
        itemStyle: { color: theme.graphColors.green030 },
      },
      {
        type: 'bar',
        name: 'Cost',
        encode: { x: 'cost', y: 'action' },
        itemStyle: { color: theme.graphColors.red030 },
      },
    ],
  };

  return config;
}

export function CostBenefitAnalysis({ data, isLoading }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const [startYear, endYear] = useReactiveVar(yearRangeVar);

  const dimensionalMetrics = useMemo(() => {
    const costBenefitData = data?.impactOverviews.find(
      (dataset) => dataset.graphType === 'cost_benefit'
    );

    if (!costBenefitData) {
      return [];
    }

    return costBenefitData.actions
      .map((action) => (action.effectDim ? new DimensionalMetric(action.effectDim) : undefined))
      .filter((metric): metric is DimensionalMetric => metric !== undefined);
  }, [data]);

  // Calculate the cost, benefit and net benefit for each metric
  const metricsWithTotals = useMemo(() => {
    const metrics = dimensionalMetrics.map((metric) => {
      const [cost, benefit] = metric.rows.reduce(
        ([cost, benefit], row) => {
          if (row.value === 0 || row.value == null || row.year < startYear || row.year > endYear) {
            return [cost, benefit];
          }

          // Negative costs are considered benefits
          if (row.value < 0) {
            return [cost, benefit + Math.abs(row.value)];
          }

          return [cost + row.value, benefit];
        },
        [0, 0]
      );

      return {
        metric,
        totals: { cost, benefit, netBenefit: benefit - cost },
      };
    });

    return metrics;
  }, [dimensionalMetrics, startYear, endYear]);

  const chartData = useMemo(() => {
    return metricsWithTotals ? getChartData(metricsWithTotals, theme, t) : undefined;
  }, [metricsWithTotals, theme, t]);

  const barCount = metricsWithTotals.length;
  const chartHeight = barCount ? barCount * 50 + 150 : 400;

  return (
    <ChartWrapper title={t('cost-benefit-analysis')} isLoading={isLoading}>
      <Chart isLoading={isLoading} data={chartData} height={`${chartHeight}px`} />
    </ChartWrapper>
  );
}
