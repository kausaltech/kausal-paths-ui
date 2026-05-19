import { useMemo } from 'react';

import { useReactiveVar } from '@apollo/client/react';
import type { EChartsCoreOption } from 'echarts/core';
import type { CallbackDataParams } from 'echarts/types/dist/shared';
import { useTranslations } from 'next-intl';

import { Chart } from '@common/components/Chart';

import type { ImpactOverviewsQuery } from '@/common/__generated__/graphql';
import { activeScenarioVar, yearRangeVar } from '@/common/cache';
import { useAxisLabelFormatter, useNumberFormatter } from '@/common/numbers';
import { ChartWrapper } from '@/components/charts/ChartWrapper';

type Entry = { action: string; returnOnInvestment: number };

// Actions with no cost (or no data in range) are omitted — they don't have a
// meaningful ROI so showing them as a zero bar would distort the chart.
function buildEntries(
  startYear: number,
  endYear: number,
  dataset?: ImpactOverviewsQuery['impactOverviews'][0]
): Entry[] {
  if (!dataset) return [];
  return dataset.actions.flatMap((action) => {
    const totals = action.effectDim.years.reduce(
      ({ totalCost, totalEffect }, year, index) => {
        if (year < startYear || year > endYear) return { totalCost, totalEffect };
        return {
          totalCost: totalCost + (action.costDim?.values[index] ?? 0),
          totalEffect: totalEffect + (action.effectDim.values[index] ?? 0),
        };
      },
      { totalCost: 0, totalEffect: 0 }
    );
    if (totals.totalCost <= 0) return [];
    const roi = (totals.totalEffect / totals.totalCost) * (action.unitAdjustmentMultiplier ?? 1);
    return [{ action: action.action.name, returnOnInvestment: roi }];
  });
}

function getChartConfig(
  entries: Entry[],
  unit: string,
  formatNumber: (value: number) => string,
  formatAxisLabel: (value: number) => string
): EChartsCoreOption {
  return {
    aria: {
      enabled: true,
    },
    dataset: [
      {
        dimensions: ['action', 'returnOnInvestment'],
        source: entries,
      },
      {
        transform: {
          type: 'sort',
          config: { dimension: 'returnOnInvestment', order: 'asc' },
        },
      },
    ],
    tooltip: {
      trigger: 'axis',
      valueFormatter: (value: number) => `${formatNumber(value || 0)} ${unit}`,
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

            return value ? `${formatNumber(value)} ${unit}` : '';
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
  const t = useTranslations('common');
  const formatNumber = useNumberFormatter();
  const formatAxisLabel = useAxisLabelFormatter();
  const [startYear, endYear] = useReactiveVar(yearRangeVar);
  const activeScenario = useReactiveVar(activeScenarioVar);
  const entries = useMemo(() => buildEntries(startYear, endYear, data), [data, startYear, endYear]);
  const unit = data?.indicatorUnit?.short || '';
  const chartData = useMemo(
    () => getChartConfig(entries, unit, formatNumber, formatAxisLabel),
    [entries, unit, formatNumber, formatAxisLabel]
  );
  const bars = entries.length;
  const chartHeight = bars ? bars * 60 + 110 : 400;
  const title = `${data?.label || t('return-on-investment')} (${startYear} - ${endYear})`;
  const subtitle = t('return-on-investment-subtitle', {
    activeScenario: activeScenario?.name ?? '',
  });

  return (
    <ChartWrapper title={title} subtitle={subtitle} isLoading={isLoading}>
      <Chart isLoading={isLoading} data={chartData} height={`${chartHeight}px`} />
    </ChartWrapper>
  );
}
