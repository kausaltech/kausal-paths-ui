import React from 'react';

import { useTheme } from '@emotion/react';
import { Box, Card, CardContent, Divider, Typography } from '@mui/material';
import type { EChartsCoreOption } from 'echarts/core';

import { Chart } from '../../charts/Chart';

export type ActionImpactNode = {
  id: string;
  name: string;
  color?: string;
  value: number;
  category?: string;
};

type Props = {
  actions: ActionImpactNode[];
  chartLabel?: string;
  unit?: string;
};

const DashboardVisualizationActionImpact = ({ actions, chartLabel, unit }: Props) => {
  const theme = useTheme();
  const fallbackColors = [
    theme.graphColors.blue030,
    theme.graphColors.green030,
    theme.graphColors.red030,
    theme.graphColors.yellow030,
    theme.graphColors.grey030,
  ];

  const dataWithColors = actions.map((action, idx) => ({
    ...action,
    color: action.color || fallbackColors[idx % fallbackColors.length],
  }));

  const chartData: EChartsCoreOption = {
    dataset: [
      {
        dimensions: ['action', 'value'],
        source: dataWithColors.map((action) => ({
          action: action.name,
          value: action.value,
        })),
      },
      {
        transform: {
          type: 'sort',
          config: { dimension: 'value', order: 'desc' },
        },
      },
    ],
    grid: {
      containLabel: true,
      left: 10,
      right: '20%',
      top: 30,
      bottom: 30,
    },
    legend: {
      show: false,
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params) => {
        const p = Array.isArray(params) ? params[0] : params;
        return `${p.name}: <b>${p.value}</b> ${unit || ''}`;
      },
    },
    xAxis: {
      type: 'value',
      axisLabel: { formatter: `{value}${unit ? ' ' + unit : ''}` },
    },
    yAxis: {
      type: 'category',
      splitArea: { show: true },
      axisLine: { show: false },
      axisLabel: { show: false },
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
        barWidth: 18,
        label: {
          show: true,
          position: 'right',
          formatter: (params) => params.data.action, // Show the action name
          fontWeight: 'bold',
        },
      },
    ],
  };

  const totalImpact = dataWithColors.reduce((sum, action) => sum + action.value, 0);

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
          <Chart isLoading={false} data={chartData} height="340px" />
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
