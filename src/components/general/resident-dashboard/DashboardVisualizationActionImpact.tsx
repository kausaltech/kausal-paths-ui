import React from 'react';

import { useTheme } from '@emotion/react';
import { Box, Card, CardContent, Divider, Stack, Typography } from '@mui/material';
import type { EChartsCoreOption } from 'echarts/core';
import type { CallbackDataParams } from 'echarts/types/dist/shared';

import { Chart } from '../../charts/Chart';

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
};

type Props = {
  actions: Action[];
  chartLabel?: string;
  unit?: string;
};

const DashboardVisualizationActionImpact = ({ actions, chartLabel, unit }: Props) => {
  const theme = useTheme();
  const fallbackColor = theme.graphColors.grey030;
  const dataWithColors = actions.map((action, idx) => ({
    ...action,
    // Note: color could be an empty string
    color: action.group?.color || action.color || fallbackColor,
  }));
  const groups = new Map(
    actions
      .filter((action): action is Action & { group: ActionGroup } => !!action.group)
      .map((action) => [action.group?.id, { ...action.group }])
  );

  console.log([...groups.values()].map((group) => group.name));

  const chartData: EChartsCoreOption = {
    dataset: [
      {
        dimensions: ['action', 'value', 'group'],
        source: dataWithColors.map((action) => ({
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
      top: 20,
      bottom: 20,
      left: 20,
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
          color: function (params) {
            const group = groups.get(params.data.group);

            return group ? (group?.color ?? params.data.color) : params.data.color;
          },
        },
        label: {
          show: true,
          align: 'right',
          position: 'left',
          formatter: (params: CallbackDataParams) =>
            params.data?.value?.toLocaleString(undefined, { maximumFractionDigits: 1 }),
          fontWeight: 'bold',
        },
      },
    ],
  };

  const totalImpact = dataWithColors.reduce((sum, action) => sum + action.value, 0);
  const chartHeight = actions ? actions.length * 28 + 110 : 400;

  return (
    <Box sx={{ my: 2 }}>
      <Card sx={{ backgroundColor: 'background.default' }}>
        <CardContent>
          {chartLabel && (
            <Typography variant="h5" component="p" sx={{ color: 'text.primary' }}>
              {chartLabel}
            </Typography>
          )}
          {!!unit && (
            <Typography variant="body2" color="text.secondary">
              {unit}
            </Typography>
          )}
          {groups.size > 0 && (
            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
              {[...groups.values()].map((group) => (
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
          )}
          <Chart
            isLoading={false}
            data={chartData}
            height={`${chartHeight}px`}
            withResizeLegend={false}
          />
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mt: 2 }}>
            Total impact {totalImpact > 0 ? '+' : ''}
            {totalImpact.toLocaleString()} {unit || ''} compared to business as usual scenario
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default DashboardVisualizationActionImpact;
