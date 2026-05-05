/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument */
import { useMemo } from 'react';

import { useReactiveVar } from '@apollo/client/react';
import type { BarSeriesOption } from 'echarts';
import type { EChartsCoreOption } from 'echarts/core';
import { useTranslations } from 'next-intl';

import { Chart } from '@common/components/Chart';

import type { ImpactOverviewsQuery } from '@/common/__generated__/graphql';
import { activeScenarioVar, yearRangeVar } from '@/common/cache';
import { useAxisLabelFormatter, useNumberFormatter } from '@/common/numbers';
import { ChartWrapper } from '@/components/charts/ChartWrapper';
import type { SortActionsConfig } from '@/types/actions.types';

type VisibleAction = { id: string; name: string };

function getChartConfig(
  startYear: number,
  endYear: number,
  formatNumber: (value: number) => string,
  formatAxisLabel: (value: number) => string,
  visibleActions: VisibleAction[],
  sortBy: SortActionsConfig,
  sortAscending: boolean,
  dataset?: ImpactOverviewsQuery['impactOverviews'][0]
): EChartsCoreOption {
  const unit = dataset?.indicatorUnit?.short || '';

  const entries = visibleActions.map((vAction) => {
    const overviewAction = dataset?.actions.find((a) => a.action.id === vAction.id);
    const totalEffect = overviewAction
      ? overviewAction.effectDim.years.reduce((sum, year, index) => {
          if (year < startYear || year > endYear) return sum;
          return sum + (overviewAction.effectDim.values[index] ?? 0);
        }, 0)
      : 0;
    return {
      action: vAction.name,
      simpleEffect: totalEffect,
    };
  });

  const sorted =
    sortBy.key === 'STANDARD'
      ? entries
      : [...entries].sort((a, b) => (sortAscending ? 1 : -1) * (a.simpleEffect - b.simpleEffect));

  return {
    dataset: [
      {
        dimensions: ['action', 'simpleEffect'],
        source: sorted,
      },
    ],
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
  visibleActions: VisibleAction[];
  sortBy: SortActionsConfig;
  sortAscending: boolean;
  isLoading: boolean;
};

export function SimpleEffect({ data, visibleActions, sortBy, sortAscending, isLoading }: Props) {
  const t = useTranslations('common');
  const formatNumber = useNumberFormatter();
  const formatAxisLabel = useAxisLabelFormatter();
  const [startYear, endYear] = useReactiveVar(yearRangeVar);
  const activeScenario = useReactiveVar(activeScenarioVar);
  const chartData = useMemo(
    () =>
      getChartConfig(
        startYear,
        endYear,
        formatNumber,
        formatAxisLabel,
        visibleActions,
        sortBy,
        sortAscending,
        data
      ),
    [data, visibleActions, sortBy, sortAscending, startYear, endYear, formatNumber, formatAxisLabel]
  );
  const bars = visibleActions.length;
  const chartHeight = bars ? bars * 60 + 110 : 400;
  const title = `${data?.label || t('simple-effect')} (${startYear} - ${endYear})`;
  const subtitle =
    data?.indicatorLabel ||
    t('simple-effect-subtitle', { activeScenario: activeScenario?.name ?? '' });

  return (
    <ChartWrapper title={title} subtitle={subtitle} isLoading={isLoading}>
      <Chart isLoading={false} data={chartData} height={`${chartHeight}px`} />
    </ChartWrapper>
  );
}
