import React from 'react';

import { useTheme } from '@emotion/react';
import { Box, Card, CardContent, Typography } from '@mui/material';

import { Chart } from '@common/components/Chart';

type Data = {
  id: string;
  name: string;
  color?: string;
  value: number;
  year: number;
};

type Props = {
  data: Data[];
  chartLabel?: string;
  unit?: string;
};

const DashboardVisualizationDimension = ({ data, chartLabel, unit }: Props) => {
  const theme = useTheme();
  const year = data?.[0]?.year;
  const fallbackColors = [
    theme.graphColors.blue030,
    theme.graphColors.green030,
    theme.graphColors.red030,
    theme.graphColors.yellow030,
    theme.graphColors.grey030,
  ];

  // Assign colors, fallback to theme if not provided
  const dataWithColors = data.map((src, idx) => ({
    ...src,
    color: src.color || fallbackColors[idx % fallbackColors.length],
  }));

  const chartData = {
    tooltip: {
      trigger: 'item',
      valueFormatter: (value: number) =>
        `${value.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${unit}`,
    },
    legend: {
      orient: 'vertical',
      left: 'right',
      top: 'center',
      textStyle: {
        width: 200,
        overflow: 'break',
      },
      data: dataWithColors.map((src) => src.name),
    },
    series: [
      {
        name: chartLabel,
        type: 'pie',
        radius: ['60%', '90%'],
        center: ['25%', '50%'],
        avoidLabelOverlap: false,
        label: {
          show: true,
          position: 'center',
          formatter: () => {
            const total = dataWithColors.reduce((sum, src) => sum + src.value, 0);
            return total
              ? total.toLocaleString(undefined, { maximumFractionDigits: 0 }) +
                  (unit ? ` ${unit}` : '')
              : '';
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
              {chartLabel} {year && `(${year})`}
            </Typography>
          )}
          {!!unit && (
            <Typography variant="body2" color="text.secondary">
              {unit}
            </Typography>
          )}
          <Box sx={{ overflowX: 'scroll' }}>
            <Box sx={{ maxWidth: 500, minWidth: 400, mx: 'auto' }}>
              <Chart isLoading={false} data={chartData} height="260px" withResizeLegend={false} />
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default DashboardVisualizationDimension;
