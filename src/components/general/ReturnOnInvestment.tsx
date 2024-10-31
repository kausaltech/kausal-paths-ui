import { ChartWrapper } from 'components/charts/ChartWrapper';
import { Chart } from 'components/charts/Chart';
import { useTranslation } from 'react-i18next';
import { useReactiveVar } from '@apollo/client';
import type { GetImpactOverviewsQuery } from 'common/__generated__/graphql';
import { yearRangeVar } from 'common/cache';
import { useMemo } from 'react';
import round from 'lodash/round';
import type { EChartsCoreOption } from 'echarts/core';

const formatPercentage = (value: number) => `${round(value, 2)} %`;

function getChartConfig(
  startYear: number,
  endYear: number,
  data?: GetImpactOverviewsQuery
): EChartsCoreOption {
  const dataset = data?.impactOverviews.find(
    (dataset) => dataset.graphType === 'return_of_investment'
  );

  return {
    dataset: dataset
      ? [
          {
            dimensions: ['action', 'returnOnInvestment'],
            source: dataset.actions.map((action) => ({
              action: action.action.name,
              // Sums the cumulative impact and cost across the selected year range, then calculates ROI
              returnOnInvestment: action.costDim.years.reduce(
                ({ totalCost, totalImpact, roi }, year, index) => {
                  if (year < startYear || year > endYear) {
                    return { totalCost, totalImpact, roi };
                  }

                  const impact = totalImpact + (action.impactDim.values[index] ?? 0);
                  const cost = totalCost + (action.costDim.values[index] ?? 0);

                  return {
                    totalCost: cost,
                    totalImpact: impact,
                    roi: impact && cost ? (impact / cost - 1) * 100 : 0,
                  };
                },
                { totalCost: 0, totalImpact: 0, roi: 0 }
              ).roi,
            })),
          },
          {
            transform: {
              type: 'sort',
              config: { dimension: 'returnOnInvestment', order: 'desc' },
            },
          },
        ]
      : [],
    tooltip: {
      trigger: 'axis',
      valueFormatter: formatPercentage,
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
        formatter: '{value}%',
      },
    },

    yAxis: {
      type: 'category',
      splitArea: { show: true },
      axisLine: { show: false },
      axisLabel: { show: true },
      axisTick: { show: false },
      splitLine: { show: false },
    },

    series: [
      {
        type: 'bar',
        encode: {
          x: 'returnOnInvestment',
          y: 'action',
        },
        datasetIndex: 1,
        label: {
          show: true,
          align: 'left',
          position: 'right',
          formatter(params) {
            const activeIndex = params.encode?.x[0];
            const value = activeIndex ? params.value?.[activeIndex] : null;

            return value ? formatPercentage(value) : '';
          },
        },
      },
    ],
  };
}

type Props = {
  data?: GetImpactOverviewsQuery;
  isLoading: boolean;
};

export function ReturnOnInvestment({ data, isLoading }: Props) {
  const { t } = useTranslation();
  const [startYear, endYear] = useReactiveVar(yearRangeVar);
  const chartData = useMemo(
    () => getChartConfig(startYear, endYear, data),
    [data, startYear, endYear]
  );
  const bars = data?.impactOverviews.find(({ graphType }) => graphType === 'return_of_investment')
    ?.actions?.length;
  const chartHeight = bars ? bars * 60 + 110 : 400;

  return (
    <ChartWrapper
      title={t('return-on-investment')}
      subtitle={
        'Higher percentages indicate actions with a more favorable ROI, demonstrating greater returns relative to the initial investment.'
      }
      isLoading={isLoading}
    >
      <Chart isLoading={isLoading} data={chartData} height={`${chartHeight}px`} />
    </ChartWrapper>
  );
}
