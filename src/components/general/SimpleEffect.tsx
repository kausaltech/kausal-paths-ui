/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument */
import { useMemo } from 'react';

import { useReactiveVar } from '@apollo/client/react';
import type { BarSeriesOption } from 'echarts';
import type { EChartsCoreOption } from 'echarts/core';
import { useTranslations } from 'next-intl';

import { Chart } from '@common/components/Chart';

import type { ImpactOverviewsQuery } from '@/common/__generated__/graphql';
import { yearRangeVar } from '@/common/cache';
import { useAxisLabelFormatter, useNumberFormatter } from '@/common/numbers';
import { ChartWrapper } from '@/components/charts/ChartWrapper';

function getChartConfig(
  startYear: number,
  endYear: number,
  formatNumber: (value: number) => string,
  formatAxisLabel: (value: number) => string,
  dataset?: ImpactOverviewsQuery['impactOverviews'][0]
): EChartsCoreOption {
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
      valueFormatter: (value: number) => `${formatNumber(value)} ${unit}`,
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
        formatter: (v: number) => `${formatAxisLabel(v)} ${unit}`,
      },
    },

    yAxis: {
      type: 'category',
      splitArea: { show: true },
      axisLine: { show: false },
      axisLabel: { show: true, width: 175, overflow: 'break' },
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

            return value ? `${formatNumber(value)} ${unit}` : '';
          },
        },
      } satisfies BarSeriesOption,
    ],
  };
}

type Props = {
  data: ImpactOverviewsQuery['impactOverviews'][0] | undefined; // Single overview
  isLoading: boolean;
};

export function SimpleEffect({ data, isLoading }: Props) {
  const t = useTranslations('common');
  const formatNumber = useNumberFormatter();
  const formatAxisLabel = useAxisLabelFormatter();
  const [startYear, endYear] = useReactiveVar(yearRangeVar);
  const chartData = useMemo(
    () => getChartConfig(startYear, endYear, formatNumber, formatAxisLabel, data),
    [data, startYear, endYear, formatNumber, formatAxisLabel]
  );
  const bars = data?.actions.length;
  const chartHeight = bars ? bars * 60 + 110 : 400;
  const title = data?.label || t('simple-effect');
  const subtitle = data?.indicatorLabel || t('simple-effect-subtitle');

  return (
    <ChartWrapper title={title} subtitle={subtitle} isLoading={isLoading}>
      <Chart isLoading={isLoading} data={chartData} height={`${chartHeight}px`} />
    </ChartWrapper>
  );
}
