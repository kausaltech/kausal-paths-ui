import React, { useState } from 'react';

import { type Theme, useTheme } from '@emotion/react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Stack,
  Typography,
} from '@mui/material';
import type { LabelLayoutOptionCallbackParams } from 'echarts';
import type { EChartsCoreOption } from 'echarts/core';
import { readableColor } from 'polished';
import { Dash, Plus } from 'react-bootstrap-icons';
import { useTranslation } from 'react-i18next';

import { Chart } from '../charts/Chart';

export type DashboardProgressItem = {
  title: string;
  chartLabel?: string;
  color?: string;
  value: number;
  targetValue?: number;
  min?: number;
  max?: number;
  unit?: string;
  description?: string;
};

type Props = {
  items?: DashboardProgressItem[];
};

function getBarColor(
  defaultColor: string | undefined,
  theme: Theme,
  value: number,
  target: number | undefined
) {
  if (typeof target === 'number') {
    return value > target ? theme.graphColors.red030 : theme.graphColors.green010;
  }

  return defaultColor ?? theme.graphColors.blue050;
}

const getBarOption = (item: DashboardProgressItem, theme: Theme) => {
  const value = item.value;
  const { min = 0, max = value } = item;
  const target = item.targetValue;
  const barColor = getBarColor(item.color, theme, value, target);

  const config: EChartsCoreOption = {
    grid: { left: 5, right: 20, top: 40, bottom: 20 },
    xAxis: { min, max, axisTick: { show: false }, axisLabel: { customValues: [min, max] } },
    yAxis: {
      type: 'category',
      axisLine: {
        show: false,
      },
      data: [''],
      show: false,
    },
    series: [
      {
        silent: true,
        showBackground: true,
        backgroundStyle: {
          color: theme.graphColors.grey010,
        },
        labelLine: {
          show: true,
          lineStyle: {
            color: barColor,
          },
        },
        labelLayout(params: LabelLayoutOptionCallbackParams) {
          return {
            verticalAlign: 'bottom',
            align: 'center',
            x: params.labelRect.x - 6,
            y: params.labelRect.y - 10,
          };
        },
        label: {
          show: true,
          position: 'right',
          backgroundColor: barColor,
          borderRadius: 16,
          padding: [4, 8],
          color: readableColor(barColor, theme.textColor.primary, theme.themeColors.white),
        },
        type: 'bar',
        data: [value],
        barWidth: 20,
        itemStyle: {
          color: barColor,
        },
        ...(target
          ? {
              markLine: {
                symbol: 'square',
                animation: false,
                symbolSize: 4,
                label: { show: false },
                symbolOffset: [
                  [0, -3],
                  [0, -3],
                ],
                lineStyle: {
                  dashOffset: 3,
                  color: theme.graphColors.red050,
                  type: 'dotted',
                  width: 2,
                },
                data: [
                  {
                    xAxis: target,
                  },
                ],
              },
            }
          : {}),
      },
    ],
    tooltip: {
      show: false,
    },
  };

  return config;
};

function TargetVariation({ item }: { item: DashboardProgressItem }) {
  const theme = useTheme();
  const { t } = useTranslation();

  if (!item.targetValue || item.value === item.targetValue) {
    return null;
  }

  const isAboveTarget = item.value > item.targetValue;
  const badgeColor = getBarColor(undefined, theme, item.value, item.targetValue);
  const percentageAboveOrBelowTarget = Math.max(
    1,
    Math.round(Math.abs((item.value - item.targetValue) / item.targetValue) * 100)
  );

  return (
    <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 1 }}>
      <Chip
        size="small"
        label={`${percentageAboveOrBelowTarget}%`}
        sx={{
          borderRadius: 8,
          p: 0,
          backgroundColor: badgeColor,
          color: readableColor(badgeColor, theme.textColor.primary, theme.themeColors.white),
        }}
      />
      <Typography variant="body2" sx={{ fontWeight: 'fontWeightBold', color: 'text.secondary' }}>
        {isAboveTarget ? t('above-target') : t('below-target')}
      </Typography>
    </Stack>
  );
}

const DashboardVisualizationProgress = ({ items = [] }: Props) => {
  const [expanded, setExpanded] = useState<number[]>([]);

  const theme = useTheme();
  const { t } = useTranslation();

  const allExpanded = items.length > 0 && expanded.length === items.length;

  const handleExpandAll = () => {
    setExpanded(items.map((_, i) => i));
  };

  const handleCollapseAll = () => {
    setExpanded([]);
  };

  const handleChange = (idx: number) => (_: unknown, isExpanded: boolean) => {
    setExpanded((prev) => (isExpanded ? [...prev, idx] : prev.filter((i) => i !== idx)));
  };

  return (
    <Box sx={{ my: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', color: 'text.secondary' }}>
        {allExpanded ? (
          <Button
            color="inherit"
            size="small"
            onClick={handleCollapseAll}
            sx={{ color: 'inherit', fontWeight: 'fontWeightRegular', textDecoration: 'underline' }}
          >
            {t('collapse-all')}
          </Button>
        ) : (
          <Button
            color="inherit"
            variant="text"
            size="small"
            onClick={handleExpandAll}
            sx={{ color: 'inherit', fontWeight: 'fontWeightRegular', textDecoration: 'underline' }}
          >
            {t('expand-all')}
          </Button>
        )}
      </Box>

      <Stack>
        {items.map((item, idx) => {
          const isItemExpanded = expanded.includes(idx);

          return (
            <Accordion
              key={idx}
              expanded={isItemExpanded}
              onChange={handleChange(idx)}
              disableGutters
              slotProps={{ transition: { unmountOnExit: true } }}
            >
              <AccordionSummary
                expandIcon={isItemExpanded ? <Dash size={30} /> : <Plus size={30} />}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  <Typography variant="h4" component="p" sx={{ color: 'text.primary', flex: 1 }}>
                    {item.title}
                  </Typography>

                  <Typography sx={{ minWidth: 100, textAlign: 'right', mx: 1 }}>
                    <Typography
                      variant="h4"
                      component="span"
                      sx={{ color: 'text.primary', fontWeight: 'fontWeightRegular' }}
                    >
                      {item.value}{' '}
                    </Typography>

                    {item.unit && <span>{item.unit}</span>}
                  </Typography>
                </Box>
              </AccordionSummary>

              <AccordionDetails>
                <Card sx={{ backgroundColor: 'background.default' }}>
                  <CardContent>
                    <Typography variant="h5" component="p" sx={{ color: 'text.primary' }}>
                      {item.chartLabel}
                    </Typography>

                    {!!item.unit && (
                      <Typography variant="body2" color="text.secondary">
                        {item.unit}
                      </Typography>
                    )}
                    <Chart isLoading={false} data={getBarOption(item, theme)} height="80px" />
                    <TargetVariation item={item} />
                  </CardContent>
                </Card>

                {item.description && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {item.description}
                  </Typography>
                )}
              </AccordionDetails>
            </Accordion>
          );
        })}
      </Stack>
    </Box>
  );
};

export default DashboardVisualizationProgress;
