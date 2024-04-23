import { ChartWrapper } from 'components/charts/ChartWrapper';
import { Chart } from 'components/charts/Chart';
import { useTranslation } from 'react-i18next';
import { useReactiveVar } from '@apollo/client';
import { GetImpactOverviewsQuery } from 'common/__generated__/graphql';
import { yearRangeVar } from 'common/cache';
import { EChartsCoreOption } from 'echarts';
import { useMemo } from 'react';
import round from 'lodash/round';

const formatPercentage = (value: number) => `${round(value, 2)} %`;

function getChartData(
  activeYear: number,
  data?: GetImpactOverviewsQuery
): EChartsCoreOption {
  const dataset = data?.impactOverviews.find(
    (dataset) => dataset.graphType === 'return_of_investment'
  );

  console.log(dataset);

  return {
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
      splitLine: {
        lineStyle: {
          type: 'dashed',
        },
      },
    },
    yAxis: {
      type: 'category',
      axisLine: { show: false },
      axisLabel: { show: true },
      axisTick: { show: false },
      splitLine: { show: false },
    },
    series: [
      {
        label: {
          show: true,
          align: 'left',
          position: 'right',
          formatter(params) {
            const value = params.value[params.encode.x[0]];
            return formatPercentage(value);
          },
        },
        type: 'bar',
        encode: {
          x: activeYear.toString(),
          y: 'action',
        },
        datasetIndex: 1,
      },
    ],

    dataset: dataset?.actions.length
      ? [
          {
            source: [
              [
                'action',
                ...dataset.actions[0].costDim.years.map((year) =>
                  year.toString()
                ),
              ],
              ...dataset.actions.map((action) => [
                action.action.name,
                ...action.costDim.values,
              ]),
              // ['Set policies to support EV charging', 40, 86],
              // ['Build safe parking space for bicycles', 10, 62],
              // ['The city builds EV charging infrastructure', 2, 44],
              // ['City supports bus transportation', 1, 6],
              // ['Companies to sponsor micro mobility stations', -10, -6],
              // ['Offer shared micro mobility system', -2, -21],
              // ['Build biodiesel stations', -20, -39],
            ],
          },
          {
            transform: {
              type: 'sort',
              config: { dimension: activeYear.toString(), order: 'asc' },
            },
          },
        ]
      : [],
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
      title={t('return-on-investment')}
      subtitle={
        'Higher percentages indicate actions with a more favorable ROI, demonstrating greater returns relative to the initial investment.'
      }
      isLoading={isLoading}
    >
      <Chart isLoading={isLoading} data={chartData} />
    </ChartWrapper>
  );
}
