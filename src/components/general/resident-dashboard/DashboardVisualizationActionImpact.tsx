import React from 'react';

import { useTheme } from '@emotion/react';
import { Box, Card, CardContent, Divider, Stack, type Theme, Typography } from '@mui/material';
import type { EChartsCoreOption } from 'echarts/core';
import type { CallbackDataParams } from 'echarts/types/dist/shared';
import { useTranslation } from 'react-i18next';

import { Chart } from '@common/components/Chart';

import { ScenarioKind } from '@/common/__generated__/graphql';
import { Trans } from '@/common/i18n';
import { useSiteWithSetter } from '@/context/site';

type ActionGroup = {
  id: string;
  name: string;
  color?: string | null;
};

type Action = {
  id: string;
  name: string;
  color?: string;
  value: number;
  group?: ActionGroup;
  year: number;
  isEnabled: boolean;
};

type Datum = {
  action: string;
  value: number;
  color: string;
  group: string | undefined;
};

const Legend = ({ groups }: { groups: ActionGroup[] }) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        my: 2,
        gap: 1,
      }}
    >
      {groups
        .filter((group) => !!group.color)
        .map((group) => (
          <Stack key={group.id} direction="row" spacing={0.5} alignItems="center">
            <Box
              sx={{
                flexShrink: 0,
                backgroundColor: group.color,
                width: 16,
                height: 16,
                borderRadius: theme.badgeBorderRadius,
              }}
            />
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ lineHeight: (theme) => theme.lineHeightSm }}
            >
              {group.name}
            </Typography>
          </Stack>
        ))}
    </Box>
  );
};

type Props = {
  actions: Action[];
  chartLabel?: string;
  unit?: string;
};

function getActionColor(action: Action, theme: Theme) {
  const fallbackColor = theme.graphColors.grey030;

  // Note: color could be an empty string
  return action.group?.color || action.color || fallbackColor;
}

function getGroupColor(group: ActionGroup, theme: Theme, index: number) {
  const fallbacks = [
    theme.graphColors.blue030,
    theme.graphColors.green030,
    theme.graphColors.yellow030,
    theme.graphColors.red030,
    theme.graphColors.blue070,
    theme.graphColors.green070,
    theme.graphColors.yellow070,
    theme.graphColors.red070,
  ];

  // Note: color could be an empty string
  return group.color || fallbacks[index % fallbacks.length];
}

const DashboardVisualizationActionImpact = ({ actions, chartLabel, unit }: Props) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const [site] = useSiteWithSetter();
  const year = actions[0]?.year;
  const baselineScenario = site.scenarios.find(({ kind }) => kind === ScenarioKind.Baseline);

  const filteredActions = actions
    .filter((action) => action.isEnabled)
    .map((action) => ({
      ...action,
      color: getActionColor(action, theme),
    }));

  // Used to separate actions typically by sector e.g. "Energy", "Transport" etc
  const groups = new Map(
    filteredActions
      .filter((action): action is Action & { color: string; group: ActionGroup } => !!action.group)
      .map((action) => [action.group?.id, { ...action.group }])
  );

  // In case a group has no color, we store a separate group color map with fallback colors
  const groupColors = new Map(
    [...groups.entries()].map(([id, group], i) => [id, getGroupColor(group, theme, i)])
  );

  const chartData: EChartsCoreOption = {
    dataset: [
      {
        dimensions: ['action', 'value', 'group'],
        source: filteredActions.map((action) => ({
          action: action.name,
          value: action.value,
          color: action.color,
          group: action.group?.id,
        })),
      },
      {
        transform: {
          type: 'sort',
          config: { dimension: 'value', order: 'desc' },
        },
      },
    ],
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      valueFormatter: (value: number) =>
        `${value.toLocaleString(undefined, { maximumFractionDigits: 1 })} ${unit}`,
    },
    grid: {
      containLabel: true,
      top: 0,
      bottom: 0,
      left: 40,
      right: 40,
    },
    legend: {
      show: false,
    },
    xAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { show: false },
      axisLabel: { show: false },
    },
    yAxis: {
      type: 'category',
      position: 'right',
      splitArea: { show: true },
      axisLine: { show: true, lineStyle: { color: theme.textColor.secondary } },
      axisLabel: { show: true, width: 250, overflow: 'truncate' },
      axisTick: { show: false },
      splitLine: { show: false },
    },
    series: [
      {
        type: 'bar',
        encode: {
          x: 'value',
          y: 'action',
        },
        datasetIndex: 1,
        itemStyle: {
          color: function (params: CallbackDataParams & { data: Datum }) {
            // If the group has a color, use it first. This ensures actions that belong to a group with no color on the backend are colored consistently.
            const groupColor = groupColors.get(params.data.group ?? '');

            return groupColor || params.data.color;
          },
        },
        label: {
          show: true,
          align: 'right',
          position: 'left',
          formatter: (params: CallbackDataParams & { data: Datum }) =>
            params.data.value.toLocaleString(undefined, { maximumFractionDigits: 1 }),
          fontWeight: 'bold',
        },
      },
    ],
  };

  const totalImpact = filteredActions.reduce((sum, action) => sum + action.value, 0);
  const chartHeight = filteredActions ? filteredActions.length * 28 + 110 : 400;

  return (
    <Box sx={{ my: 2 }}>
      <Card sx={{ backgroundColor: 'background.default' }}>
        <CardContent>
          {chartLabel && (
            <Typography variant="h5" component="p" sx={{ color: 'text.primary' }}>
              {chartLabel} {year && `(${year})`}
            </Typography>
          )}

          {!!unit && (
            <Typography variant="body2" color="text.secondary">
              {unit}
            </Typography>
          )}

          {groups.size > 0 && (
            <Legend
              groups={[...groups.values()].map((group) => ({
                ...group,
                color: groupColors.get(group.id),
              }))}
            />
          )}

          <Chart
            isLoading={false}
            data={chartData}
            height={`${chartHeight}px`}
            withResizeLegend={false}
          />

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle1" sx={{ textAlign: 'right' }}>
            <Trans
              i18nKey="impact-compared-to-baseline"
              values={{
                impact:
                  totalImpact > 0
                    ? `+${totalImpact.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                    : totalImpact.toLocaleString(undefined, { maximumFractionDigits: 0 }),
                unit: unit || '',
                baseline: baselineScenario?.name || t('plot-baseline'),
              }}
            />
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default DashboardVisualizationActionImpact;
