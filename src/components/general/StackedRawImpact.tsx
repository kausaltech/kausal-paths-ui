import { useMemo } from 'react';

import { useReactiveVar } from '@apollo/client/react';
import type { BarSeriesOption } from 'echarts';
import type { EChartsCoreOption } from 'echarts/core';
import { useTranslations } from 'next-intl';

import { Chart } from '@common/components/Chart';
import { useTheme } from '@common/themes';

import type { ImpactOverviewDetailFragment } from '@/common/__generated__/graphql';
import { activeScenarioVar } from '@/common/cache';
import { useAxisLabelFormatter, useNumberFormatter } from '@/common/numbers';
import { ChartWrapper } from '@/components/charts/ChartWrapper';
import type { SortActionsConfig } from '@/types/actions.types';

type VisibleAction = {
  id: string;
  name: string;
  color?: string | null;
  group?: { color?: string | null } | null;
};

type OverviewAction = ImpactOverviewDetailFragment['actions'][0];

type ActionSeries = {
  id: string;
  name: string;
  color: string | undefined;
  values: (number | null)[];
  total: number;
};

// Walk visibleActions (which carry display order, name, color) and pair with
// the matching overview entry. Years outside [startYear, endYear] are dropped.
// Returns null entries inside the values array where the overview is missing
// a year, rather than coercing to 0 — keeps "no data" distinct from "zero".
function buildSeries(
  visibleActions: VisibleAction[],
  overviewActions: readonly OverviewAction[],
  years: number[]
): ActionSeries[] {
  return visibleActions.flatMap((vAction) => {
    const overviewAction = overviewActions.find((a) => a.action.id === vAction.id);
    if (!overviewAction) return [];
    const { years: overviewYears, values } = overviewAction.effectDim;
    const yearToValue = new Map<number, number>();
    overviewYears.forEach((y, i) => yearToValue.set(y, values[i] ?? 0));
    const seriesValues = years.map((y) => yearToValue.get(y) ?? null);
    const total = seriesValues.reduce<number>((sum, v) => sum + (v ?? 0), 0);
    return [
      {
        id: vAction.id,
        name: vAction.name,
        color: vAction.color ?? vAction.group?.color ?? undefined,
        values: seriesValues,
        total,
      },
    ];
  });
}

function getChartConfig(
  series: ActionSeries[],
  years: number[],
  unit: string,
  formatNumber: (value: number) => string,
  formatAxisLabel: (value: number) => string,
  forecastAreaStartIndex: number,
  forecastBackgroundColor: string,
  forecastLabel: string
): EChartsCoreOption {
  const barSeries: BarSeriesOption[] = series.map((s, idx) => ({
    type: 'bar',
    name: s.name,
    stack: 'impact',
    data: s.values,
    itemStyle: s.color ? { color: s.color } : undefined,
    emphasis: { focus: 'series' },
    // Attach the forecast markArea to the first series only — ECharts renders
    // it once per chart but it has to live on a series.
    markArea:
      idx === 0 && forecastAreaStartIndex > -1
        ? {
            silent: true,
            itemStyle: {
              color: forecastBackgroundColor,
              opacity: 0.1,
            },
            label: {
              position: [0, -15],
              fontSize: 11,
            },
            data: [[{ name: forecastLabel, xAxis: forecastAreaStartIndex }, { x: '100%' }]],
          }
        : undefined,
  }));

  return {
    legend: {
      // 'plain' (default) wraps to multiple lines when items overflow the width,
      // unlike 'scroll' which keeps everything on a single scrollable line.
      type: 'plain',
      bottom: 0,
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      valueFormatter: (value: number | null) =>
        value == null ? '—' : `${formatNumber(value)} ${unit}`,
    },
    grid: {
      // `containLabel: true` keeps axis labels inside the box; the legend at the
      // bottom is sized via the Chart wrapper's `withResizeLegend` behaviour.
      containLabel: true,
      top: 20,
      bottom: 60,
      left: 20,
      right: 20,
    },
    xAxis: {
      type: 'category',
      data: years.map(String),
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: (v: number) => `${formatAxisLabel(v)} ${unit}`,
      },
    },
    series: barSeries,
  };
}

type Props = {
  data: ImpactOverviewDetailFragment | undefined;
  visibleActions: VisibleAction[];
  sortBy: SortActionsConfig;
  sortAscending: boolean;
  isLoading: boolean;
  yearRange: [number, number];
};

export function StackedRawImpact({
  data,
  visibleActions,
  sortBy,
  sortAscending,
  isLoading,
  yearRange,
}: Props) {
  const t = useTranslations('common');
  const theme = useTheme();
  const formatNumber = useNumberFormatter();
  const formatAxisLabel = useAxisLabelFormatter();
  const activeScenario = useReactiveVar(activeScenarioVar);
  const [startYear, endYear] = yearRange;

  // Union of years across all overview actions, filtered to yearRange.
  // Actions may report different year sets; using a union keeps the x-axis
  // complete and lines up everything via the year-keyed map in buildSeries.
  const years = useMemo(() => {
    const set = new Set<number>();
    for (const a of data?.actions ?? []) {
      for (const y of a.effectDim.years) {
        if (y >= startYear && y <= endYear) set.add(y);
      }
    }
    return [...set].sort((a, b) => a - b);
  }, [data, startYear, endYear]);

  const series = useMemo(() => {
    const built = buildSeries(visibleActions, data?.actions ?? [], years);
    if (sortBy.key === 'STANDARD') return built;
    return [...built].sort((a, b) => (sortAscending ? 1 : -1) * (a.total - b.total));
  }, [visibleActions, data, years, sortBy, sortAscending]);

  // Earliest forecastFrom across all action series. Each action carries its
  // own forecastFrom; in practice they match, but take the min so the
  // background area covers everything that is forecast for any series.
  const forecastFrom = useMemo(() => {
    let min: number | null = null;
    for (const a of data?.actions ?? []) {
      const f = a.effectDim.forecastFrom;
      if (f == null) continue;
      if (min == null || f < min) min = f;
    }
    return min;
  }, [data]);

  const forecastAreaStartIndex = useMemo(() => {
    if (forecastFrom == null) return -1;
    return years.findIndex((y) => y >= forecastFrom);
  }, [years, forecastFrom]);

  const unit = data?.indicatorUnit?.short || '';

  const chartData = useMemo(
    () =>
      getChartConfig(
        series,
        years,
        unit,
        formatNumber,
        formatAxisLabel,
        forecastAreaStartIndex,
        theme.graphColors.blue030,
        t('forecast')
      ),
    [
      series,
      years,
      unit,
      formatNumber,
      formatAxisLabel,
      forecastAreaStartIndex,
      theme.graphColors.blue030,
      t,
    ]
  );

  const title = `${data?.label || t('stacked-raw-impact')} (${startYear} - ${endYear})`;
  // Subtitle assumes that StackedRawImpact is only used for budgeting
  // so we can use words like "costs" and "savings"
  const subtitle =
    data?.indicatorLabel ||
    t('stacked-raw-impact-subtitle', { activeScenario: activeScenario?.name ?? '' });

  return (
    <ChartWrapper title={title} subtitle={subtitle} isLoading={isLoading}>
      <Chart isLoading={false} data={chartData} height="500px" />
    </ChartWrapper>
  );
}
