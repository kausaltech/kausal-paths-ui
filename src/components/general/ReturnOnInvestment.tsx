import { ChartWrapper } from 'components/charts/ChartWrapper';
import { Chart } from 'components/charts/Chart';
import { useTranslation } from 'react-i18next';
import { useReactiveVar } from '@apollo/client';
import { GetImpactOverviewsQuery } from 'common/__generated__/graphql';
import { yearRangeVar } from 'common/cache';
import { useMemo } from 'react';
import round from 'lodash/round';

const formatPercentage = (value: number) => `${round(value, 2)} %`;

function getChartData(activeYear: number, data?: GetImpactOverviewsQuery): echarts.EChartsOption {
  const dataset = data?.impactOverviews.find(
    (dataset) => dataset.graphType === 'return_of_investment'
  );

  return {
    dataset: dataset
      ? [
          {
            dimensions: ['action', ...dataset.actions[0].costDim.years.map(String)],
            source: dataset.actions.map((action) => [
              action.action.name,
              ...action.costDim.years.map((_, index) => {
                const impact = action.impactDim.values[index];
                const cost = action.costDim.values[index];

                return impact && cost ? (impact / cost - 1) * 100 : null;
              }),
            ]),
          },
          {
            transform: {
              type: 'sort',
              config: { dimension: activeYear.toString(), order: 'desc' },
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
          x: activeYear.toString(),
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
  const yearRange = useReactiveVar(yearRangeVar);
  const endYear = yearRange[1];
  const chartData = useMemo(() => getChartData(endYear, data), [data, endYear]);

  return (
    <ChartWrapper
      title={t('return-of-investment')}
      subtitle={
        'Higher percentages indicate actions with a more favorable ROI, demonstrating greater returns relative to the initial investment.'
      }
      isLoading={isLoading}
    >
      <Chart isLoading={isLoading} data={chartData} />
    </ChartWrapper>
  );
}
