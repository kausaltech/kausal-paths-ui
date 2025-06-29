import { useMemo } from 'react';

import { useReactiveVar } from '@apollo/client';
import type { GetImpactOverviewsQuery } from 'common/__generated__/graphql';
import { yearRangeVar } from 'common/cache';
import { Chart } from 'components/charts/Chart';
import { ChartWrapper } from 'components/charts/ChartWrapper';
import type { EChartsCoreOption } from 'echarts/core';
import round from 'lodash/round';
import { useTranslation } from 'react-i18next';

const formatValue = (value: number, unit: string) => `${round(value, 2)} ${unit}`;

function getChartConfig(
  startYear: number,
  endYear: number,
  data?: GetImpactOverviewsQuery
): EChartsCoreOption {
  const dataset = data?.impactOverviews.find((dataset) => dataset.graphType === 'simple_effect');

  const unit = dataset?.indicatorUnit?.short || '';

  return {
    dataset: dataset
      ? [
          {
            dimensions: ['action', 'simpleEffect'],
            source: dataset.actions.map((action) => {
              const totals = action.effectDim.years.reduce(
                ({ totalEffect }, year, index) => {
                  if (year < startYear || year > endYear) {
                    return { totalEffect };
                  }

                  return {
                    totalEffect: totalEffect + (action.effectDim.values[index] ?? 0),
                  };
                },
                { totalEffect: 0 }
              );

              // const effect = totals.totalEffect;

              return {
                action: action.action.name,
                simpleEffect: totals.totalEffect,
              };
            }),
          },
          {
            transform: {
              type: 'sort',
              config: { dimension: 'simpleEffect', order: 'asc' },
            },
          },
        ]
      : [],
    tooltip: {
      trigger: 'axis',
      valueFormatter: (value: number) => formatValue(value, unit),
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
        formatter: `{value} ${unit}`,
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
          x: 'simpleEffect',
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

            return value ? formatValue(value, unit) : '';
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

export function SimpleEffect({ data, isLoading }: Props) {
  const { t } = useTranslation();
  const [startYear, endYear] = useReactiveVar(yearRangeVar);
  const chartData = useMemo(
    () => getChartConfig(startYear, endYear, data),
    [data, startYear, endYear]
  );
  const d = data?.impactOverviews.find(({ graphType }) => graphType === 'simple_effect');
  const bars = d?.actions.length;
  const chartHeight = bars ? bars * 60 + 110 : 400;
  const title = d.label || t('simple-effect');
  const subtitle = d.indicatorLabel || t('simple-effect-subtitle');

  return (
    <ChartWrapper title={title} subtitle={subtitle} isLoading={isLoading}>
      <Chart isLoading={isLoading} data={chartData} height={`${chartHeight}px`} />
    </ChartWrapper>
  );
}
