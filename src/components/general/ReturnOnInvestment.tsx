import { ChartWrapper } from 'components/charts/ChartWrapper';
import { Chart } from 'components/charts/Chart';
import { useTranslation } from 'react-i18next';
import { useQuery, useReactiveVar } from '@apollo/client';
import { GET_IMPACT_OVERVIEWS } from 'queries/getImpactOverviews';
import { GetImpactOverviewsQuery } from 'common/__generated__/graphql';
import { yearRangeVar } from 'common/cache';
import { EChartsCoreOption } from 'echarts';
import { useMemo } from 'react';

const labelRight = {
  position: 'right',
} as const;

function getChartData(
  activeYear: number,
  data?: GetImpactOverviewsQuery
): EChartsCoreOption {
  const dataset = data?.impactOverviews.find(
    (dataset) => dataset.graphType === 'return_of_investment'
  );

  return {
    tooltip: {
      trigger: 'axis',
      valueFormatter: (value) => `${value} %`,
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
              // ['action', '2010', '2030'],
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
    //   series: [
    //     {
    //       name: 'Return on investment',
    //       type: 'bar',
    //       stack: 'Total',
    //       label: {
    //         show: true,
    //         formatter: '{c} %',
    //       },
    //       transform: {
    //         type: 'sort',
    //         config: { dimension: 'score', order: 'desc' },
    //       },
    //       data: [
    //         { value: 86, label: labelRight },
    //         { value: 62, label: labelRight },
    //         { value: 44, label: labelRight },
    //         { value: 6, label: labelRight },
    //         { value: -6, label: labelRight },
    //         { value: -21, label: labelRight },
    //         { value: -39, label: labelRight },
    //       ],
    //     },
    //   ],
  };
}

type Props = {
  isLoading: boolean;
};

export function ReturnOnInvestment({ isLoading }: Props) {
  const { t } = useTranslation();
  const yearRange = useReactiveVar(yearRangeVar);
  const { error, loading, data, previousData } =
    useQuery<GetImpactOverviewsQuery>(GET_IMPACT_OVERVIEWS, {
      fetchPolicy: 'cache-and-network',
    });

  const chartData = useMemo(
    () => getChartData(yearRange[1], data),
    [data, yearRange[1]]
  );

  console.log('GET_IMPACT_OVERVIEWS', error, loading, data, previousData);
  console.log('yearRange', yearRange);
  console.log('---');

  return (
    <ChartWrapper
      title={t('return-on-investment')}
      subtitle={
        'Higher percentages indicate actions with a more favorable ROI, demonstrating greater returns relative to the initial investment.'
      }
      isLoading={isLoading}
    >
      <Chart isLoading={isLoading || loading} data={chartData} />
    </ChartWrapper>
  );
}
