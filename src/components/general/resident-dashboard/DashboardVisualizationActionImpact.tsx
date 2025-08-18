import React from 'react';

import { useTheme } from '@emotion/react';
import { Box, Card, CardContent, Divider, Stack, Typography } from '@mui/material';
import type { EChartsCoreOption } from 'echarts/core';
import type { CallbackDataParams } from 'echarts/types/dist/shared';

import { Chart } from '@common/components/Chart';

import { useTranslation } from '@/common/i18n';

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
    <Stack direction="row" spacing={1} sx={{ mt: 2, mb: 1 }}>
      {groups.map((group) => (
        <Stack key={group.id} direction="row" spacing={0.5} alignItems="center">
          <Box
            sx={{
              backgroundColor: group.color,
              width: 20,
              height: 20,
              borderRadius: theme.badgeBorderRadius,
            }}
          />
          <Typography color="text.secondary">{group.name}</Typography>
        </Stack>
      ))}
    </Stack>
  );
};

type Props = {
  actions: Action[];
  chartLabel?: string;
  unit?: string;
};

const DashboardVisualizationActionImpact = ({ actions, chartLabel, unit }: Props) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const fallbackColor = theme.graphColors.grey030;
  const year = actions[0]?.year;
  const filteredActions = actions
    .filter((action) => action.isEnabled)
    .map((action) => ({
      ...action,
      // Note: color could be an empty string
      color: action.group?.color || action.color || fallbackColor,
    }));

  // Used to separate actions typically by sector e.g. "Energy", "Transport" etc
  const groups = new Map(
    filteredActions
      .filter((action): action is Action & { color: string; group: ActionGroup } => !!action.group)
      .map((action) => [action.group?.id, { ...action.group }])
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
      left: 0,
      right: 0,
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
            const group = groups.get(params.data.group ?? '');

            return group ? (group?.color ?? params.data.color) : params.data.color;
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

          {groups.size > 0 && <Legend groups={Array.from(groups.values())} />}

          <Chart
            isLoading={false}
            data={chartData}
            height={`${chartHeight}px`}
            withResizeLegend={false}
          />

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle1">
            {t('impact-compared-to-baseline', {
              impact:
                totalImpact > 0
                  ? `+${totalImpact.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                  : totalImpact.toLocaleString(undefined, { maximumFractionDigits: 0 }),
              unit: unit || '',
            })}
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default DashboardVisualizationActionImpact;
