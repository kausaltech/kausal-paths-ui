import { useMemo } from 'react';

import { useReactiveVar } from '@apollo/client/react';
import type { LineSeriesOption } from 'echarts';
import type { EChartsCoreOption } from 'echarts/core';

import { Chart } from '@common/components/Chart';
import { useTheme } from '@common/themes';

import type { ImpactOverviewsQuery } from '@/common/__generated__/graphql';
import { activeScenarioVar } from '@/common/cache';
import { useAxisLabelFormatter, useNumberFormatter } from '@/common/numbers';
import { ChartWrapper } from '@/components/charts/ChartWrapper';

type ActionLookupEntry = {
  id: string;
  name?: string;
  color?: string | null;
  group?: { color?: string | null } | null;
};

type WedgeEntry = NonNullable<ImpactOverviewsQuery['impactOverviews'][0]['wedge']>[0];

type ActionBand = {
  id: string;
  name: string;
  color: string | undefined;
  values: (number | null)[];
};

// Backend invariant from the wedge-diagram spec:
// - wedge[0] is current_scenario (floor)
// - wedge[1] is baseline_scenario (ceiling)
// - wedge[2..] are action bands, already scaled so they sum to (ceiling - floor)
function partition(wedge: readonly WedgeEntry[]): {
  floor: WedgeEntry | null;
  ceiling: WedgeEntry | null;
  bands: WedgeEntry[];
} {
  const scenarios = wedge.filter((e) => e.isScenario);
  const bands = wedge.filter((e) => !e.isScenario);
  // Match by id when possible, but the doc pins the order so fall back to that.
  const floor = scenarios.find((e) => e.id === 'current_scenario') ?? scenarios[0] ?? null;
  const ceiling = scenarios.find((e) => e.id === 'baseline_scenario') ?? scenarios[1] ?? null;
  return { floor, ceiling, bands };
}

function valuesForYears(entry: WedgeEntry, years: number[]): (number | null)[] {
  const map = new Map<number, number>();
  entry.metric.years.forEach((y, i) => map.set(y, entry.metric.values[i] ?? 0));
  return years.map((y) => map.get(y) ?? null);
}

function getChartConfig(
  years: number[],
  floorValues: (number | null)[],
  ceilingValues: (number | null)[],
  bands: ActionBand[],
  ceilingLabel: string,
  unit: string,
  formatNumber: (value: number) => string,
  formatAxisLabel: (value: number) => string,
  forecastAreaStartIndex: number,
  forecastBackgroundColor: string,
  forecastLabel: string,
  ceilingLineColor: string
): EChartsCoreOption {
  // Invisible baseline series carrying floor values so stacked bands sit on
  // top of current_scenario instead of zero. Excluded from legend/tooltip.
  const floorSeries: LineSeriesOption = {
    type: 'line',
    name: '__floor__',
    stack: 'wedge',
    data: floorValues,
    symbol: 'none',
    lineStyle: { opacity: 0 },
    areaStyle: { opacity: 0 },
    tooltip: { show: false },
    silent: true,
    z: 1,
  };

  const bandSeries: LineSeriesOption[] = bands.map((b) => ({
    type: 'line',
    name: b.name,
    stack: 'wedge',
    data: b.values,
    symbol: 'none',
    lineStyle: { opacity: 0 },
    areaStyle: {
      opacity: 0.7,
      color: b.color,
    },
    itemStyle: b.color ? { color: b.color } : undefined,
    emphasis: { focus: 'series' },
    z: 2,
  }));

  // Non-stacked dashed line for baseline_scenario. By construction it sits on
  // top of the action stack — overlaying it gives a visual sanity check.
  const ceilingSeries: LineSeriesOption = {
    type: 'line',
    name: ceilingLabel,
    data: ceilingValues,
    symbol: 'none',
    lineStyle: {
      type: 'dashed',
      width: 2,
      color: ceilingLineColor,
    },
    itemStyle: { color: ceilingLineColor },
    z: 3,
    // Forecast markArea attached here (rather than on a band) so a single
    // overlay covers the chart regardless of band visibility.
    markArea:
      forecastAreaStartIndex > -1
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
  };

  return {
    legend: {
      type: 'plain',
      bottom: 0,
      // Hide the invisible floor series from the legend.
      data: [...bands.map((b) => b.name), ceilingLabel],
    },
    tooltip: {
      trigger: 'axis',
      valueFormatter: (value: number | null) =>
        value == null ? '—' : `${formatNumber(value)} ${unit}`,
    },
    grid: {
      containLabel: true,
      top: 20,
      bottom: 60,
      left: 20,
      right: 20,
    },
    xAxis: {
      type: 'category',
      data: years.map(String),
      boundaryGap: false,
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: (v: number) => `${formatAxisLabel(v)} ${unit}`,
      },
    },
    series: [floorSeries, ...bandSeries, ceilingSeries],
  };
}

type Props = {
  data: ImpactOverviewsQuery['impactOverviews'][0] | undefined;
  actionLookup: ActionLookupEntry[];
  isLoading: boolean;
  yearRange: [number, number];
};

export function WedgeDiagram({ data, actionLookup, isLoading, yearRange }: Props) {
  const theme = useTheme();
  const formatNumber = useNumberFormatter();
  const formatAxisLabel = useAxisLabelFormatter();
  const activeScenario = useReactiveVar(activeScenarioVar);
  const [startYear, endYear] = yearRange;

  // Stable reference for useMemo deps — `data?.wedge ?? []` would allocate
  // a new empty array each render.
  const wedge = useMemo(() => data?.wedge ?? [], [data]);
  const { floor, ceiling, bands: bandEntries } = useMemo(() => partition(wedge), [wedge]);

  // Union of years across all wedge entries, filtered to yearRange. Mirrors
  // StackedRawImpact — entries may report slightly different ranges.
  const years = useMemo(() => {
    const set = new Set<number>();
    for (const e of wedge) {
      for (const y of e.metric.years) {
        if (y >= startYear && y <= endYear) set.add(y);
      }
    }
    return [...set].sort((a, b) => a - b);
  }, [wedge, startYear, endYear]);

  const floorValues = useMemo(
    () => (floor ? valuesForYears(floor, years) : years.map(() => null)),
    [floor, years]
  );
  const ceilingValues = useMemo(
    () => (ceiling ? valuesForYears(ceiling, years) : years.map(() => null)),
    [ceiling, years]
  );

  // Build action bands in backend-given order. Look up display name/color
  // from the parent action list so the wedge legend matches the rest of the
  // page; fall back to the wedge entry's own label/id.
  const bands: ActionBand[] = useMemo(() => {
    const lookup = new Map<string, ActionLookupEntry>(actionLookup.map((a) => [a.id, a]));
    return bandEntries.map((e) => {
      const action = lookup.get(e.id);
      return {
        id: e.id,
        name: action?.name ?? e.label,
        color: action?.color ?? action?.group?.color ?? undefined,
        values: valuesForYears(e, years),
      };
    });
  }, [bandEntries, actionLookup, years]);

  // Earliest forecastFrom across all wedge entries (floor, ceiling, bands).
  const forecastFrom = useMemo(() => {
    let min: number | null = null;
    for (const e of wedge) {
      const f = e.metric.forecastFrom;
      if (f == null) continue;
      if (min == null || f < min) min = f;
    }
    return min;
  }, [wedge]);

  const forecastAreaStartIndex = useMemo(() => {
    if (forecastFrom == null) return -1;
    return years.findIndex((y) => y >= forecastFrom);
  }, [years, forecastFrom]);

  const unit = data?.indicatorUnit?.short || '';
  const ceilingLabel = ceiling?.label ?? 'Baseline scenario';

  const chartData = useMemo(
    () =>
      getChartConfig(
        years,
        floorValues,
        ceilingValues,
        bands,
        ceilingLabel,
        unit,
        formatNumber,
        formatAxisLabel,
        forecastAreaStartIndex,
        theme.graphColors.blue030,
        'Forecast',
        theme.graphColors.grey060
      ),
    [
      years,
      floorValues,
      ceilingValues,
      bands,
      ceilingLabel,
      unit,
      formatNumber,
      formatAxisLabel,
      forecastAreaStartIndex,
      theme.graphColors.blue030,
      theme.graphColors.grey060,
    ]
  );

  const title = `${data?.label || 'Wedge diagram'} (${startYear} - ${endYear})`;
  const subtitle =
    data?.indicatorLabel ||
    `Contributions of actions closing the gap between current and baseline scenarios in "${activeScenario?.name ?? ''}".`;

  return (
    <ChartWrapper title={title} subtitle={subtitle} isLoading={isLoading}>
      <Chart isLoading={false} data={chartData} height="500px" />
    </ChartWrapper>
  );
}
