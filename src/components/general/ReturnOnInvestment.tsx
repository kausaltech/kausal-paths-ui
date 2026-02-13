import { useMemo } from 'react';

import { useReactiveVar } from '@apollo/client';
import type { EChartsCoreOption } from 'echarts/core';
import type { CallbackDataParams } from 'echarts/types/dist/shared';
import { useTranslation } from 'react-i18next';

import { Chart } from '@common/components/Chart';

import type { ImpactOverviewsQuery } from '@/common/__generated__/graphql';
import { yearRangeVar } from '@/common/cache';
import { ChartWrapper } from '@/components/charts/ChartWrapper';

const formatValue = (value: number | null, unit: string) => `${(value || 0).toFixed(2)} ${unit}`;

function getChartConfig(
  startYear: number,
  endYear: number,
  dataset?: ImpactOverviewsQuery['impactOverviews'][0]
): EChartsCoreOption {
  const unit = dataset?.indicatorUnit?.short || '';

  return {
    aria: {
      enabled: true,
    },
    dataset: dataset
      ? [
          {
            dimensions: ['action', 'returnOnInvestment'],
            source: dataset.actions
              .map((action) => {
                const totals = action.effectDim.years.reduce(
                  ({ totalCost, totalEffect }, year, index) => {
                    if (year < startYear || year > endYear) {
                      return { totalCost, totalEffect };
                    }

                    return {
                      totalCost: totalCost + (action.costDim?.values[index] ?? 0),
                      totalEffect: totalEffect + (action.effectDim.values[index] ?? 0),
                    };
                  },
                  { totalCost: 0, totalEffect: 0 }
                );

                const roi =
                  totals.totalCost > 0
                    ? (totals.totalEffect / totals.totalCost) *
                      (action.unitAdjustmentMultiplier ?? 1)
                    : null;

                return {
                  action: action.action.name,
                  returnOnInvestment: roi,
                };
              })
              .filter((item) => item.returnOnInvestment !== null), // Remove actions with no cost
          },
          {
            transform: {
              type: 'sort',
              config: { dimension: 'returnOnInvestment', order: 'asc' },
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
          x: 'returnOnInvestment',
          y: 'action',
        },
        datasetIndex: 1,
        label: {
          show: true,
          align: 'left',
          position: 'right',
          formatter(params: CallbackDataParams) {
            const activeIndex: number | undefined = params.encode?.x[0];
            const value: number | null = activeIndex ? Number(params.value?.[activeIndex]) : null;

            return value ? formatValue(value, unit) : '';
          },
        },
      },
    ],
  };
}

type Props = {
  data: ImpactOverviewsQuery['impactOverviews'][0] | undefined; // Single overview
  isLoading: boolean;
};

export function ReturnOnInvestment({ data, isLoading }: Props) {
  const { t } = useTranslation();
  const [startYear, endYear] = useReactiveVar(yearRangeVar);
  const chartData = useMemo(
    () => getChartConfig(startYear, endYear, data),
    [data, startYear, endYear]
  );
  const bars = data?.actions.length;
  const chartHeight = bars ? bars * 60 + 110 : 400;
  const title = data?.label || t('return-on-investment');
  // TODO: Add subtitle translation return-on-investment-subtitle
  const subtitle = data?.indicatorLabel || '';

  return (
    <ChartWrapper title={title} subtitle={subtitle} isLoading={isLoading}>
      <Chart isLoading={isLoading} data={chartData} height={`${chartHeight}px`} />
    </ChartWrapper>
  );
}
