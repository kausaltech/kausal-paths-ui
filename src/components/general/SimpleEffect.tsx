import { useMemo } from 'react';

import { useReactiveVar } from '@apollo/client/react';
import type { BarSeriesOption } from 'echarts';
import type { EChartsCoreOption } from 'echarts/core';
import { useTranslations } from 'next-intl';

import { Chart } from '@common/components/Chart';

import type { ImpactOverviewDetailFragment } from '@/common/__generated__/graphql';
import { activeScenarioVar, yearRangeVar } from '@/common/cache';
import { useAxisLabelFormatter, useNumberFormatter } from '@/common/numbers';
import { ChartWrapper } from '@/components/charts/ChartWrapper';
import type { SortActionsConfig } from '@/types/actions.types';

type VisibleAction = { id: string; name: string };

type Entry = { action: string; simpleEffect: number };

// Actions absent from the overview are omitted rather than coerced to 0, so the
// chart doesn't conflate "no data for this action" with "this action had zero effect".
function buildEntries(
  visibleActions: VisibleAction[],
  startYear: number,
  endYear: number,
  dataset?: ImpactOverviewDetailFragment
): Entry[] {
  return visibleActions.flatMap((vAction) => {
    const overviewAction = dataset?.actions.find((a) => a.action.id === vAction.id);
    if (!overviewAction) return [];
    const totalEffect = overviewAction.effectDim.years.reduce((sum, year, index) => {
      if (year < startYear || year > endYear) return sum;
      return sum + (overviewAction.effectDim.values[index] ?? 0);
    }, 0);
    return [{ action: vAction.name, simpleEffect: totalEffect }];
  });
}

function getChartConfig(
  entries: Entry[],
  unit: string,
  formatNumber: (value: number) => string,
  formatAxisLabel: (value: number) => string,
  sortBy: SortActionsConfig,
  sortAscending: boolean
): EChartsCoreOption {
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
            const value = (params.value as { simpleEffect?: number } | undefined)?.simpleEffect;
            return value ? `${formatNumber(value)} ${unit}` : '';
          },
        },
      } satisfies BarSeriesOption,
    ],
  };
}

type Props = {
  data: ImpactOverviewDetailFragment | undefined; // Single overview
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
  const entries = useMemo(
    () => buildEntries(visibleActions, startYear, endYear, data),
    [visibleActions, startYear, endYear, data]
  );
  const unit = data?.indicatorUnit?.short || '';
  const chartData = useMemo(
    () => getChartConfig(entries, unit, formatNumber, formatAxisLabel, sortBy, sortAscending),
    [entries, unit, sortBy, sortAscending, formatNumber, formatAxisLabel]
  );
  const bars = entries.length;
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
