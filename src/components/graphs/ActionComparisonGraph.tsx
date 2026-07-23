import { useCallback, useEffect, useMemo, useState } from 'react';

import { Grid } from '@mui/material';

import type { BarSeriesOption } from 'echarts';
import type { EChartsCoreOption } from 'echarts/core';
import { useTranslations } from 'next-intl';

import { Chart } from '@common/components/Chart';
import { useTheme } from '@common/themes';
import styled from '@common/themes/styled';

import { Link } from '@/common/links';
import { useNumberFormatter } from '@/common/numbers';
import { createAxisTooltipFormatter } from '@/components/charts/chartTooltip';
import Icon from '@/components/common/icon';

const GraphContainer = styled.div`
  margin-bottom: 1rem;
`;

const ActionDescription = styled.div`
  margin-bottom: 2rem;
  padding: 1rem;
  border-radius: 0;
  border-left: 5px solid ${(props) => props.color};
  font-size: 1rem;
  background-color: ${(props) => props.theme.graphColors.grey010};

  h4 {
    margin-bottom: 1rem;
  }
`;

const HoverValue = styled.div``;

const HoverGroupTag = styled.span`
  font-size: 80%;
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

type ActionComparisonData = {
  actions: string[];
  impact: number[];
  colors: (string | null | undefined)[];
  groups: (string | undefined)[];
};

type ActionComparisonGraphProps = {
  data: ActionComparisonData;
  effectUnit: string | undefined;
  impactName: string;
  actionIds: string[];
  actionGroups: { id: string; name: string }[];
};

function ActionComparisonGraph(props: ActionComparisonGraphProps) {
  const { data, effectUnit, impactName, actionIds, actionGroups } = props;
  const theme = useTheme();
  const t = useTranslations('common');
  const formatNumber = useNumberFormatter();

  const [hoverId, setHoverId] = useState<number | null>(null);

  useEffect(() => {
    setHoverId(null);
  }, [data]);

  const chartData: EChartsCoreOption = useMemo(() => {
    // The unit arrives as an HTML snippet (sub/superscripts); axis titles are
    // canvas text, so strip the markup there (the tooltip below keeps it).
    const plainUnit = (effectUnit ?? '').replace(/<[^>]*>/g, '');
    const series: BarSeriesOption = {
      type: 'bar',
      name: impactName,
      data: data.impact.map((value, i) => ({
        value,
        itemStyle: {
          color: data.colors[i] ?? theme.graphColors.grey050,
          opacity: 0.9,
          borderColor: theme.themeColors.white,
          borderWidth: 2,
        },
      })),
    };

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: createAxisTooltipFormatter((value) =>
          value == null ? '—' : `${formatNumber(value)} ${effectUnit ?? ''}`
        ),
      },
      grid: {
        containLabel: true,
        left: 10,
        right: 10,
        top: 10,
        bottom: 10,
      },
      xAxis: {
        type: 'category',
        data: data.actions,
        name: t('actions'),
        nameLocation: 'middle',
        nameGap: 16,
        axisLabel: { show: false },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        name: `${impactName} (${plainUnit})`,
        nameLocation: 'middle',
        nameGap: 45,
      },
      series: [series],
    };
  }, [data, effectUnit, impactName, formatNumber, t, theme]);

  // Fires when the axis pointer moves to another category, so hovering
  // anywhere in a column selects the action — even when its bar is tiny.
  const handleAxisPointer = useCallback(
    (params: unknown) => {
      const axesInfo = (params as { axesInfo?: { value?: unknown }[] }).axesInfo;
      const value = axesInfo?.[0]?.value;
      if (typeof value !== 'number') return;
      const index = Math.round(value);
      if (index >= 0 && index < data.actions.length) {
        setHoverId(index);
      }
    },
    [data.actions.length]
  );
  const onEvents = useMemo(() => ({ updateAxisPointer: handleAxisPointer }), [handleAxisPointer]);

  if (data.actions?.length < 1) return null;

  return (
    <GraphContainer>
      <Chart
        isLoading={false}
        data={chartData}
        height="300px"
        withResizeLegend={false}
        onEvents={onEvents}
      />
      {hoverId !== null && (
        <ActionDescription color={data.colors[hoverId] ?? undefined}>
          <Link href={`/actions/${actionIds[hoverId]}/`}>
            <HoverGroupTag color={data.colors[hoverId] ?? undefined}>
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
                <HoverValueUnit dangerouslySetInnerHTML={{ __html: effectUnit ?? '' }} />
              </HoverValue>
            </Grid>
            <Grid size={{ md: 3 }} sx={{ display: 'flex', alignItems: 'end' }} />
            <Grid size={{ md: 3 }} sx={{ display: 'flex', alignItems: 'end' }} />
          </Grid>
        </ActionDescription>
      )}
    </GraphContainer>
  );
}

export default ActionComparisonGraph;
