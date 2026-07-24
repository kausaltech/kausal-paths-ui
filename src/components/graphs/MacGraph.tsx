import { useCallback, useEffect, useMemo, useState } from 'react';

import { Grid } from '@mui/material';

import type {
  CustomSeriesOption,
  CustomSeriesRenderItemAPI,
  CustomSeriesRenderItemParams,
} from 'echarts';
import type { EChartsCoreOption } from 'echarts/core';
import { useTranslations } from 'next-intl';

import { Chart } from '@common/components/Chart';
import { useTheme } from '@common/themes';
import styled from '@common/themes/styled';

import type { ActionListQuery } from '@/common/__generated__/graphql';
import { Link } from '@/common/links';
import { useAxisLabelFormatter, useNumberFormatter } from '@/common/numbers';
import { stripHtml, truncateLabel } from '@/components/charts/chartTooltip';
import Icon from '@/components/common/icon';

const GraphContainer = styled.div`
  margin-bottom: 1rem;
`;

const ActionDescription = styled.div`
  margin-bottom: 2rem;
  padding: 1rem;
  border-radius: 0;
  font-size: 1rem;
  background-color: ${(props) => props.theme.graphColors.grey010};

  h4 {
    margin-bottom: 1rem;
  }
`;

const HoverValue = styled.div``;

const HoverGroupTag = styled.span`
  font-size: 80%;
  color: ${(props) => props.color};
`;

const HoverValueTitle = styled.div`
  line-height: 1;
  margin-bottom: 0.5rem;
`;

const HoverValueValue = styled.span`
  font-size: 1.75rem;
  font-weight: 700;
  line-height: 1;
  margin-right: 0.5rem;
`;

const HoverValueUnit = styled.span``;

const EmptyPlot = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 450px;
  margin: 0 0 2rem;
`;

type MacGraphProps = {
  data: {
    ids: string[];
    actions: string[];
    colors: string[];
    groups: string[];
    cost: number[];
    efficiency: number[];
    impact: number[];
  };
  effectUnit: string;
  impactName: string;
  indicatorUnit: string;
  efficiencyName: string;
  actionIds: string[];
  costName: string;
  costUnit: string;
  actionGroups: ActionListQuery['instance']['actionGroups'];
};

function MacGraph(props: MacGraphProps) {
  const {
    data,
    effectUnit,
    impactName,
    indicatorUnit,
    efficiencyName,
    actionIds,
    costName,
    costUnit,
    actionGroups,
  } = props;
  const theme = useTheme();
  const t = useTranslations('common');
  const formatNumber = useNumberFormatter();
  const formatAxisLabel = useAxisLabelFormatter();

  const [hoverId, setHoverId] = useState<number | null>(null);

  useEffect(() => {
    setHoverId(null);
  }, [data]);
  // TODO: Add sorting of data here

  const isEmpty = data.actions?.length < 1;

  // Each bar's x-range, laid end-to-end: bar width = impact. Positive impacts
  // tile rightwards from zero, negative ones leftwards.
  const { bars, negativeSideWidth } = useMemo(() => {
    const items: { start: number; end: number }[] = [];
    let positiveWidth = 0;
    let negativeWidth = 0;
    data.impact.forEach((impact) => {
      const width = Math.abs(impact);
      if (impact < 0) {
        items.push({ start: -negativeWidth - width, end: -negativeWidth });
        negativeWidth += width;
      } else {
        items.push({ start: positiveWidth, end: positiveWidth + width });
        positiveWidth += width;
      }
    });
    return { bars: items, negativeSideWidth: negativeWidth };
  }, [data]);

  const chartData: EChartsCoreOption = useMemo(() => {
    const renderBar = (params: CustomSeriesRenderItemParams, api: CustomSeriesRenderItemAPI) => {
      const topLeft = api.coord([api.value(0), api.value(2)]);
      const bottomRight = api.coord([api.value(1), 0]);
      return {
        type: 'rect' as const,
        shape: {
          x: topLeft[0],
          y: Math.min(topLeft[1], bottomRight[1]),
          width: bottomRight[0] - topLeft[0],
          height: Math.abs(bottomRight[1] - topLeft[1]),
        },
        style: {
          // `||` rather than `??`: actions without an own or group color get ''
          fill: data.colors[params.dataIndex] || theme.graphColors.grey050,
          stroke: theme.themeColors.white,
          lineWidth: 2,
          opacity: 0.9,
        },
        styleEmphasis: {
          stroke: theme.graphColors.grey090,
          lineWidth: 3,
        },
      };
    };

    const series: CustomSeriesOption = {
      type: 'custom',
      name: impactName,
      // Both range edges feed the x-axis extent so the last bar isn't clipped
      encode: { x: [0, 1], y: 2 },
      data: bars.map((bar, i) => ({
        name: data.actions[i],
        value: [bar.start, bar.end, data.efficiency[i]],
      })),
      renderItem: renderBar,
      // Red backdrop marking the negative (net-saving) side
      markArea:
        negativeSideWidth > 0
          ? {
              silent: true,
              itemStyle: {
                color: theme.graphColors.red030,
                opacity: 0.2,
              },
              data: [[{ xAxis: -negativeSideWidth }, { xAxis: 0 }]],
            }
          : undefined,
      markLine:
        negativeSideWidth > 0
          ? {
              silent: true,
              symbol: 'none',
              label: { show: false },
              lineStyle: {
                color: theme.graphColors.red030,
                width: 1,
              },
              data: [{ xAxis: 0 }],
            }
          : undefined,
    };

    return {
      tooltip: {
        trigger: 'item',
        formatter: (params: unknown) => {
          // Axis-pointer-triggered calls pass an array of per-series params
          const p = Array.isArray(params) ? (params[0] as unknown) : params;
          const i = (p as { dataIndex?: number } | undefined)?.dataIndex;
          if (typeof i !== 'number' || data.actions[i] == null) return '';
          return (
            `<b>${truncateLabel(data.actions[i])}</b><br/>` +
            `${efficiencyName}: <b>${formatNumber(data.efficiency[i])}</b> ${indicatorUnit}<br/>` +
            `${impactName}: <b>${formatNumber(data.impact[i])}</b> ${effectUnit}`
          );
        },
      },
      grid: {
        containLabel: true,
        left: 10,
        right: 10,
        top: 10,
        bottom: 10,
      },
      xAxis: {
        type: 'value',
        name: `${impactName} (${stripHtml(effectUnit)})`,
        nameLocation: 'middle',
        nameGap: 30,
        axisLabel: {
          formatter: (value: number) => `${formatAxisLabel(value)} ${stripHtml(effectUnit)}`,
        },
        // Track the pointer across the whole plot so hovering above or below
        // a bar still selects the action under the cursor; the label callout
        // would show the meaningless internal x-position, so hide it. The
        // tooltip is item-triggered — the axis pointer must not also trigger
        // it (that path passes array params the formatter isn't meant for).
        axisPointer: {
          show: true,
          snap: false,
          triggerTooltip: false,
          label: { show: false },
          lineStyle: {
            color: theme.graphColors.grey030,
            width: 1,
          },
        },
      },
      yAxis: {
        type: 'value',
        name: `${efficiencyName} (${stripHtml(indicatorUnit)})`,
        nameLocation: 'middle',
        nameGap: 55,
        axisLabel: {
          formatter: (value: number) => formatAxisLabel(value),
        },
      },
      series: [series],
    };
  }, [
    bars,
    data,
    negativeSideWidth,
    impactName,
    effectUnit,
    efficiencyName,
    indicatorUnit,
    formatNumber,
    formatAxisLabel,
    theme,
  ]);

  // The bars tile the x-axis contiguously, so the axis-pointer position maps
  // directly to a bar's x-range (mirrors Plotly's hovermode 'x' snapping).
  const handleAxisPointer = useCallback(
    (params: unknown) => {
      const value = (params as { axesInfo?: { value?: unknown }[] }).axesInfo?.[0]?.value;
      if (typeof value !== 'number') return;
      const index = bars.findIndex((bar) => value >= bar.start && value <= bar.end);
      if (index >= 0) setHoverId(index);
    },
    [bars]
  );
  const onEvents = useMemo(() => ({ updateAxisPointer: handleAxisPointer }), [handleAxisPointer]);

  const plot = useMemo(
    () =>
      isEmpty ? (
        <EmptyPlot>
          <h4>{t('actions-count', { shown: 0, total: 0 })}</h4>
        </EmptyPlot>
      ) : (
        <Chart
          isLoading={false}
          data={chartData}
          height="450px"
          withResizeLegend={false}
          onEvents={onEvents}
        />
      ),
    [isEmpty, t, chartData, onEvents]
  );

  return (
    <GraphContainer>
      {plot}
      {hoverId !== null && (
        <ActionDescription>
          <Link href={`/actions/${actionIds[hoverId]}/`}>
            <HoverGroupTag color={data.colors[hoverId] || theme.graphColors.grey050}>
              {actionGroups.find((group) => group.id === data.groups[hoverId])?.name}
            </HoverGroupTag>
            <h4>
              {data.actions[hoverId]} <Icon name="arrowRight" />
            </h4>
          </Link>
          <Grid container spacing={2}>
            <Grid size={{ md: 3 }} sx={{ display: 'flex', alignItems: 'end' }}>
              <HoverValue>
                <HoverValueTitle>{impactName}</HoverValueTitle>
                <HoverValueValue>{formatNumber(data.impact[hoverId])}</HoverValueValue>
                <HoverValueUnit dangerouslySetInnerHTML={{ __html: effectUnit }} />
              </HoverValue>
            </Grid>
            <Grid size={{ md: 3 }} sx={{ display: 'flex', alignItems: 'end' }}>
              <HoverValue>
                <HoverValueTitle>{costName}</HoverValueTitle>
                <HoverValueValue>{formatNumber(data.cost[hoverId])}</HoverValueValue>
                <HoverValueUnit dangerouslySetInnerHTML={{ __html: costUnit }} />
              </HoverValue>
            </Grid>
            <Grid size={{ md: 3 }} sx={{ display: 'flex', alignItems: 'end' }}>
              <HoverValue>
                <HoverValueTitle>{efficiencyName}</HoverValueTitle>
                <HoverValueValue>{formatNumber(data.efficiency[hoverId])}</HoverValueValue>
                <HoverValueUnit dangerouslySetInnerHTML={{ __html: indicatorUnit }} />
              </HoverValue>
            </Grid>
          </Grid>
        </ActionDescription>
      )}
    </GraphContainer>
  );
}

export default MacGraph;
