import { ChartWrapper } from 'components/charts/ChartWrapper';
import { Chart } from 'components/charts/Chart';
import { useTranslation } from 'react-i18next';
import type { GetImpactOverviewsQuery } from '@/common/__generated__/graphql';
import type { EChartsCoreOption } from 'echarts/core';
import { useReactiveVar } from '@apollo/client';
import { yearRangeVar } from '@/common/cache';
import { useMemo } from 'react';
import { DimensionalMetric } from '@/data/metric';
import type { Theme } from '@kausal/themes/types';
import { useTheme } from 'styled-components';

/**
 * For cost-benefit visualisations, only costDim is used.
 * Previously, costs were in costDim and benefits in impactDim.
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

function getChartData(data: Cubes[], theme: Theme): EChartsCoreOption {
  const sortedData = data.sort((a, b) => a.totals.netBenefit - b.totals.netBenefit);

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
      valueFormatter: (value) => `${Math.round(value)} M €`,
      // formatter: (params, ...rest) => {
      //   console.log(params, rest);
      //   const actionName = params[0].name;
      //   const cost = params[0].value;
      //   const benefit = params[1].value;
      //   const netBenefit = params[2].value;

      //   return `
      //     <strong>${actionName}</strong><br/>
      //     Cost: ${cost.toFixed(2)}<br/>
      //     Benefit: ${benefit.toFixed(2)}<br/>
      //     Net Benefit: ${netBenefit.toFixed(2)}
      //   `;
      // },
    },
    legend: {
      data: [/** { name: 'Net Benefit' }, **/ 'Benefit', 'Cost'],
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
        formatter: '{value} M €',
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
      // {
      //   type: 'custom',
      //   name: 'Net Benefit',
      //   itemStyle: {
      //     color: theme.graphColors.green090,
      //     borderWidth: 1,
      //   },
      //   renderItem: function (params, api) {
      //     const categoryIndex = api.value('action');
      //     const netBenefit = api.value('netBenefit');
      //     const highPoint = api.coord([netBenefit, categoryIndex]);
      //     const height = api.size([0, 1])[1];
      //     const halfHeight = height / 2;
      //     const OFFSET = 5;
      //     const color = api.visual('color');
      //     const style = api.style({ stroke: color, fill: color });

      //     return {
      //       name: 'Net benefit',
      //       type: 'group',
      //       barCategoryGap: '50%',
      //       groupPadding: 20,
      //       children: [
      //         {
      //           type: 'circle',
      //           transition: ['shape'],
      //           shape: {
      //             cx: highPoint[0],
      //             cy: highPoint[1] - halfHeight + OFFSET,
      //             r: 2,
      //           },
      //           style: style,
      //         },
      //         {
      //           type: 'line',
      //           transition: ['shape'],
      //           shape: {
      //             x1: highPoint[0],
      //             y1: highPoint[1] - halfHeight + OFFSET,
      //             x2: highPoint[0],
      //             y2: highPoint[1] + halfHeight - OFFSET,
      //           },
      //           style: style,
      //         },
      //       ],
      //     };
      //   },
      //   label: {
      //     show: true,
      //     offset: [10, 0],
      //     textBorderWidth: 0,
      //     color: theme.graphColors.green090,
      //     align: 'left',
      //     formatter: (params) => `${Math.round(params.value.netBenefit)} M €`,
      //   },
      //   encode: { x: 'netBenefit', y: 'action' },
      //   z: 100,
      // },
      {
        type: 'bar',
        barCategoryGap: '40%',
        name: 'Benefit',
        encode: { x: 'benefit', y: 'action' },
        itemStyle: { color: theme.graphColors.green050 },
      },
      {
        type: 'bar',
        name: 'Cost',
        encode: { x: 'cost', y: 'action' },
        itemStyle: { color: theme.graphColors.red050 },
      },
    ],
  };

  return config;
}

export function CostBenefitAnalysis({ data, isLoading }: Props) {
  const { t } = useTranslation();
  const [startYear, endYear] = useReactiveVar(yearRangeVar);
  const costBenefitData = data?.impactOverviews.find(
    (dataset) => dataset.graphType === 'cost_benefit'
  );

  const cubes = useMemo(() => {
    const metrics = costBenefitData?.actions
      .map((action) => action.costDim)
      .filter(Boolean)
      .map((metric) => {
        const dimensionalMetric = new DimensionalMetric(metric);

        const [cost, benefit] = dimensionalMetric.rows.reduce(
          ([cost, benefit], row) => {
            if (
              row.value === 0 ||
              row.value == null ||
              row.year < startYear ||
              row.year > endYear
            ) {
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
          metric: dimensionalMetric,
          totals: { cost, benefit, netBenefit: benefit - cost },
        };
      });

    return metrics ?? null;
  }, [costBenefitData, startYear, endYear]);

  const theme = useTheme();

  const chartData = useMemo(() => {
    return cubes ? getChartData(cubes, theme) : null;
  }, [cubes, theme]);

  const bars = costBenefitData?.actions.length;
  const chartHeight = bars ? bars * 50 + 110 : 400;

  return (
    <ChartWrapper title={t('cost-benefit-analysis')} isLoading={isLoading}>
      <Chart isLoading={isLoading} data={chartData} height={`${chartHeight}px`} />
    </ChartWrapper>
  );
}
