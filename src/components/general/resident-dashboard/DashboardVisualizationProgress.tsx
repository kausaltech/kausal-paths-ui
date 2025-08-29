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

import { Chart } from '@common/components/Chart';

import type {
  ScenarioValueFieldsFragment,
  UnitFieldsFragment,
} from '@/common/__generated__/graphql';
import { type InstanceContextType, useInstance } from '@/common/instance';

export enum ProgressType {
  SCENARIO = 'ScenarioProgressBarBlock',
  CURRENT = 'CurrentProgressBarBlock',
  GOAL = 'GoalProgressBarBlock',
  REFERENCE = 'ReferenceProgressBarBlock',
}

export type DashboardProgressItem = {
  type: ProgressType;
  title: string;
  chartLabel?: string;
  color?: string;
  value?: number;
  goalValue?: number;
  description?: string;
  scenarioId?: string;
};

type Props = {
  items?: DashboardProgressItem[];
  scenarioValues?: ScenarioValueFieldsFragment[];
  maxValue: number;
  unit?: Omit<UnitFieldsFragment, '__typename'>;
  goalYear?: number;
};

function getBarColor(
  defaultColor: string | undefined,
  theme: Theme,
  value?: number,
  target?: number
) {
  if (typeof value === 'number' && typeof target === 'number') {
    return value > target ? theme.graphColors.red030 : theme.graphColors.green010;
  }

  // defaultColor may be an empty string
  return defaultColor ? defaultColor : theme.graphColors.blue050;
}

const getBarOption = (item: DashboardProgressItem, theme: Theme, max: number) => {
  const value = item.value;
  const min = 0;
  const target = item.goalValue;
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

  if (
    typeof item.value !== 'number' ||
    typeof item.goalValue !== 'number' ||
    item.value === item.goalValue
  ) {
    return null;
  }

  const isAboveTarget = item.value > item.goalValue;
  const badgeColor = getBarColor(undefined, theme, item.value, item.goalValue);
  const percentageAboveOrBelowTarget = Math.max(
    1,
    Math.round(Math.abs((item.value - item.goalValue) / item.goalValue) * 100)
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

function getYear(
  item: DashboardProgressItem,
  instance: InstanceContextType,
  scenarioValues: ScenarioValueFieldsFragment[],
  goalYear?: number
) {
  if (item.type === ProgressType.SCENARIO) {
    return scenarioValues.find((scenario) => scenario.scenario.id === item.scenarioId)?.year;
  }

  if (item.type === ProgressType.CURRENT) {
    return instance.maximumHistoricalYear;
  }

  if (item.type === ProgressType.GOAL) {
    return goalYear;
  }

  if (item.type === ProgressType.REFERENCE) {
    return instance.referenceYear;
  }
}

const DashboardVisualizationProgress = ({
  items = [],
  scenarioValues,
  unit,
  maxValue,
  goalYear,
}: Props) => {
  const [expanded, setExpanded] = useState<number[]>([]);

  const instance = useInstance();
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
          const year = getYear(item, instance, scenarioValues ?? [], goalYear);

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

                  {typeof item.value === 'number' && (
                    <Typography sx={{ minWidth: 100, textAlign: 'right', mx: 1 }}>
                      <Typography
                        variant="h4"
                        component="span"
                        sx={{ color: 'text.primary', fontWeight: 'fontWeightRegular' }}
                      >
                        {item.value.toLocaleString()}{' '}
                      </Typography>

                      {unit && <span>{unit.short}</span>}
                    </Typography>
                  )}
                </Box>
              </AccordionSummary>

              <AccordionDetails>
                <Card sx={{ backgroundColor: 'background.default' }}>
                  <CardContent>
                    <Typography variant="h5" component="p" sx={{ color: 'text.primary' }}>
                      {item.chartLabel} {year ? `(${year})` : ''}
                    </Typography>

                    {!!unit && (
                      <Typography variant="body2" color="text.secondary">
                        {unit.short}
                      </Typography>
                    )}

                    <Chart
                      isLoading={false}
                      data={getBarOption(item, theme, maxValue)}
                      height="80px"
                      withResizeLegend={false}
                    />

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
