import React from 'react';

import { useTheme } from '@emotion/react';
import { Box, Card, CardContent, Typography } from '@mui/material';

import { Chart } from '../charts/Chart';

export type EmissionSourceNode = {
  id: string;
  name: string;
  color?: string;
  value: number;
};

type Props = {
  sources: EmissionSourceNode[];
  chartLabel?: string;
  unit?: string;
  referenceYear?: number;
};

const DashboardVisualizationEmissionSources = ({
  sources,
  chartLabel = 'Emission sources',
  unit = 'ktCO2e',
  referenceYear,
}: Props) => {
  const theme = useTheme();
  const fallbackColors = [
    theme.graphColors.blue030,
    theme.graphColors.green030,
    theme.graphColors.red030,
    theme.graphColors.yellow030,
    theme.graphColors.grey030,
  ];

  // Assign colors, fallback to theme if not provided
  const dataWithColors = sources.map((src, idx) => ({
    ...src,
    color: src.color || fallbackColors[idx % fallbackColors.length],
  }));

  const chartData = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ' + (unit || '') + ' ({d}%)',
    },
    legend: {
      orient: 'vertical',
      left: 'right',
      top: 'center',
      data: dataWithColors.map((src) => src.name),
    },
    series: [
      {
        name: chartLabel,
        type: 'pie',
        radius: ['60%', '90%'],
        avoidLabelOverlap: false,
        label: {
          show: true,
          position: 'center',
          formatter: () => {
            const total = dataWithColors.reduce((sum, src) => sum + src.value, 0);
            return total ? total.toLocaleString() + (unit ? ` ${unit}` : '') : '';
          },
          fontSize: 18,
          fontWeight: 'bold',
        },
        labelLine: {
          show: false,
        },
        data: dataWithColors.map((src) => ({
          value: src.value,
          name: src.name,
          itemStyle: { color: src.color },
        })),
      },
    ],
  };

  return (
    <Box sx={{ my: 2 }}>
      <Card sx={{ backgroundColor: 'background.default' }}>
        <CardContent>
          {chartLabel && (
            <Typography variant="h5" component="p" sx={{ color: 'text.primary' }}>
              {chartLabel} ({referenceYear})
            </Typography>
          )}
          {!!unit && (
            <Typography variant="body2" color="text.secondary">
              {unit}
            </Typography>
          )}
          <Chart isLoading={false} data={chartData} height="260px" />
        </CardContent>
      </Card>
    </Box>
  );
};

export default DashboardVisualizationEmissionSources;
