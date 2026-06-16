import { useMemo } from 'react';

import { useReactiveVar } from '@apollo/client/react';
import type { LineSeriesOption, TooltipComponentFormatterCallbackParams } from 'echarts';
import type { EChartsCoreOption } from 'echarts/core';

import { Chart } from '@common/components/Chart';
import { useTheme } from '@common/themes';

import type { ImpactOverviewDetailFragment } from '@/common/__generated__/graphql';
import { activeScenarioVar } from '@/common/cache';
import { useAxisLabelFormatter, useNumberFormatter } from '@/common/numbers';
import { ChartWrapper } from '@/components/charts/ChartWrapper';
import { truncateLabel } from '@/components/charts/chartTooltip';

type ActionLookupEntry = {
  id: string;
  name?: string;
  color?: string | null;
  group?: { color?: string | null } | null;
};

type WedgeEntry = NonNullable<ImpactOverviewDetailFragment['wedge']>[0];

type NodeGoal = ImpactOverviewDetailFragment['effectNode']['goals'][0];

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

function goalValuesForYears(goals: readonly NodeGoal[], years: number[]): (number | null)[] {
  const map = new Map<number, number>();
  goals.forEach((g) => map.set(g.year, g.value));
  return years.map((y) => map.get(y) ?? null);
}

function getChartConfig(
  years: number[],
  floorValues: (number | null)[],
  ceilingValues: (number | null)[],
  bands: ActionBand[],
  goalValues: (number | null)[] | null,
  floorLabel: string,
  ceilingLabel: string,
  goalLabel: string,
  unit: string,
  formatNumber: (value: number) => string,
  formatAxisLabel: (value: number) => string,
  forecastAreaStartIndex: number,
  forecastBackgroundColor: string,
  forecastLabel: string,
  floorLineColor: string,
  ceilingLineColor: string,
  goalLineColor: string
): EChartsCoreOption {
  // Stacked baseline carrying floor values so action bands sit on top of
  // current_scenario instead of zero. Drawn prominently for debugging — the
  // line should trace the actual current_scenario trajectory.
  const floorSeries: LineSeriesOption = {
    type: 'line',
    name: floorLabel,
    stack: 'wedge',
    data: floorValues,
    symbol: 'none',
    lineStyle: {
      width: 2,
      color: floorLineColor,
    },
    areaStyle: { opacity: 0 },
    itemStyle: { color: floorLineColor },
    z: 4,
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

  const goalSeries: LineSeriesOption | null = goalValues
    ? {
        type: 'line',
        name: goalLabel,
        data: goalValues,
        symbol: 'circle',
        symbolSize: 8,
        showSymbol: true,
        smooth: true,
        connectNulls: true,
        lineStyle: {
          type: 'dashed',
          width: 2,
          color: goalLineColor,
        },
        itemStyle: { color: goalLineColor },
        z: 5,
      }
    : null;

  const legendData = [
    floorLabel,
    ...bands.map((b) => b.name),
    ceilingLabel,
    ...(goalSeries ? [goalLabel] : []),
  ];

  const series: LineSeriesOption[] = [
    floorSeries,
    ...bandSeries,
    ceilingSeries,
    ...(goalSeries ? [goalSeries] : []),
  ];

  // Tooltip shows action bands as percentages of that year's gap
  // (ceiling − floor), computed client-side until the backend provides shares
  // directly. The chart itself stays in absolute units; the scenario and goal
  // lines keep absolute values since they are the totals a share is measured
  // against.
  const bandNames = new Set(bands.map((b) => b.name));
  const gaps = years.map((_, i) => {
    const f = floorValues[i];
    const c = ceilingValues[i];
    return f != null && c != null ? c - f : null;
  });
  const formatTooltip = (params: TooltipComponentFormatterCallbackParams): string => {
    const items = Array.isArray(params) ? params : [params];
    const rows = items.map((p) => {
      const value = typeof p.value === 'number' ? p.value : null;
      let formatted = '—';
      if (value != null) {
        if (p.seriesName != null && bandNames.has(p.seriesName)) {
          const gap = gaps[p.dataIndex];
          formatted = gap ? `${formatNumber((value / gap) * 100)} %` : '—';
        } else {
          formatted = `${formatNumber(value)} ${unit}`;
        }
      }
      const marker = typeof p.marker === 'string' ? p.marker : '';
      return `${marker}${truncateLabel(p.seriesName ?? '')}&nbsp;&nbsp;<b>${formatted}</b>`;
    });
    return [`<b>${items[0]?.name ?? ''}</b>`, ...rows].join('<br/>');
  };

  return {
    legend: {
      type: 'plain',
      bottom: 0,
      data: legendData,
    },
    tooltip: {
      trigger: 'axis',
      formatter: formatTooltip,
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
    series,
  };
}

type Props = {
  data: ImpactOverviewDetailFragment | undefined;
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
  console.log('Rendering WedgeDiagram with data:', data);
  // Stable reference for useMemo deps — `data?.wedge ?? []` would allocate
  // a new empty array each render.
  const wedge = useMemo(() => data?.wedge ?? [], [data]);
  const { floor, ceiling, bands: bandEntries } = useMemo(() => partition(wedge), [wedge]);

  // Goals from the effectNode (target values for the indicator). Independent
  // of the wedge stack — rendered as connected dots overlaying the chart.
  const goals = useMemo(() => data?.effectNode?.goals ?? [], [data]);

  // Union of years across wedge entries AND goal years, filtered to yearRange.
  // Including goal years means a goal at e.g. 2035 still gets a tick on the
  // x-axis even if no wedge entry reports that year.
  const years = useMemo(() => {
    const set = new Set<number>();
    for (const e of wedge) {
      for (const y of e.metric.years) {
        if (y >= startYear && y <= endYear) set.add(y);
      }
    }
    for (const g of goals) {
      if (g.year >= startYear && g.year <= endYear) set.add(g.year);
    }
    return [...set].sort((a, b) => a - b);
  }, [wedge, goals, startYear, endYear]);

  const floorValues = useMemo(
    () => (floor ? valuesForYears(floor, years) : years.map(() => null)),
    [floor, years]
  );
  const ceilingValues = useMemo(
    () => (ceiling ? valuesForYears(ceiling, years) : years.map(() => null)),
    [ceiling, years]
  );

  const goalValues = useMemo(
    () => (goals.length > 0 ? goalValuesForYears(goals, years) : null),
    [goals, years]
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
  const floorLabel = floor?.label ?? 'Current scenario';
  const ceilingLabel = ceiling?.label ?? 'Baseline scenario';
  const goalLabel = 'Goal';

  const chartData = useMemo(
    () =>
      getChartConfig(
        years,
        floorValues,
        ceilingValues,
        bands,
        goalValues,
        floorLabel,
        ceilingLabel,
        goalLabel,
        unit,
        formatNumber,
        formatAxisLabel,
        forecastAreaStartIndex,
        theme.graphColors.blue030,
        'Forecast',
        theme.graphColors.grey090,
        theme.graphColors.grey060,
        theme.graphColors.red090
      ),
    [
      years,
      floorValues,
      ceilingValues,
      bands,
      goalValues,
      floorLabel,
      ceilingLabel,
      goalLabel,
      unit,
      formatNumber,
      formatAxisLabel,
      forecastAreaStartIndex,
      theme.graphColors.blue030,
      theme.graphColors.grey090,
      theme.graphColors.grey060,
      theme.graphColors.red090,
    ]
  );

  const title = `${data?.label || 'Wedge diagram'} (${startYear} - ${endYear})`;
  const subtitle =
    data?.indicatorLabel ||
    `Contributions of actions in "${activeScenario?.name ?? ''}" scenario compared to ${ceilingLabel}.`;

  return (
    <ChartWrapper title={title} subtitle={subtitle} isLoading={isLoading}>
      <Chart isLoading={false} data={chartData} height="500px" />
    </ChartWrapper>
  );
}
