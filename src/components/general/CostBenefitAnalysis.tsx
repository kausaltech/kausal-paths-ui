/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
import { useMemo, useState } from 'react';

import { useReactiveVar } from '@apollo/client';
import type { Theme } from '@emotion/react';
import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import { Box, Card, CardContent, Collapse, Grid, Typography } from '@mui/material';
import type { EChartsCoreOption } from 'echarts/core';
import { useTranslations } from 'next-intl';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import 'overlayscrollbars/styles/overlayscrollbars.css';
import { ChevronDown, ChevronUp } from 'react-bootstrap-icons';

import { Chart } from '@common/components/Chart';

import type { ImpactOverviewsQuery } from '@/common/__generated__/graphql';
import { yearRangeVar } from '@/common/cache';
import { useAxisLabelFormatter, useNumberFormatter } from '@/common/numbers';
import { ChartWrapper } from '@/components/charts/ChartWrapper';
import { DimensionalMetric } from '@/data/metric';

/**
 * For cost-benefit visualisations, only effectDim is used.
 * Positive values are costs, negative values are benefits.
 */

type Props = {
  data: ImpactOverviewsQuery['impactOverviews'][0] | undefined;
  isLoading: boolean;
};

type AxisBounds = { min: number; max: number };

type Cubes = {
  metric: DimensionalMetric;
  actionName: string;
  actionId: string;
  totals: { cost: number; benefit: number; netBenefit: number };
};

type CostTypeInfo = { originalId: string; label: string; color: string; isCost: boolean };

type StakeholderCostTypeData = {
  costTypes: CostTypeInfo[];
  rows: Record<string, number | string>[];
};

type ActionRowProps = {
  item: Cubes;
  bounds: AxisBounds;
  isFirst: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  unitLabel: string;
  startYear: number;
  endYear: number;
  isLoading: boolean;
};

// Fixed pixel width reserved for the y-axis label column
// Needed for axis consistency as each action row is rendered as a separate chart
const LABEL_COLUMN_WIDTH = 220;

const StyledScrollArea = styled.div`
  position: relative;
  .os-top-scrollbar {
    .os-scrollbar-horizontal {
      top: 0;
      bottom: auto;
    }
  }
`;

const StyledChartColumn = styled.div`
  padding-top: 0.75rem;
`;

const StyledActionBlock = styled.div`
  position: relative;
  border-bottom: 1px solid ${({ theme }) => theme.graphColors.grey010};

  &:last-child {
    border-bottom: none;
  }
`;

// The top position is calculated by the parent based on the size of this action row's chart. The size may vary
// as the first chart includes a legend. This button needs to be absolute to avoid breaking the vertical tick
// lines on the x-axis and to position the button just below the action name within the chart area.
const StyledOutcomesToggle = styled.button<{ $top: string }>`
  position: absolute;
  top: ${({ $top }) => $top};
  transition: none;
  background: none;
  border: none;
  cursor: pointer;
  font-size: ${({ theme }) => theme.fontSizeSm};
  color: ${({ theme }) => theme.linkColor};
  display: block;
  width: ${LABEL_COLUMN_WIDTH}px;
  text-align: right;
  padding: ${({ theme }) => theme.spaces.s025};

  &:hover {
    text-decoration: underline;
  }
`;

function getAxisBounds(metricsWithTotals: Cubes[]): AxisBounds {
  if (!metricsWithTotals.length) return { min: 0, max: 100 };

  const allValues = metricsWithTotals.flatMap((m) => [
    m.totals.cost,
    m.totals.benefit,
    m.totals.netBenefit,
  ]);

  const minVal = Math.min(0, ...allValues);
  const maxVal = Math.max(0, ...allValues);
  const range = maxVal - minVal || 1;

  // Leave some padding between the min/max values and the edge of the chart
  return { min: minVal - range * 0.1, max: maxVal + range * 0.25 };
}

// Each action row is a separate chart, allowing us to implement
// expanding sub-charts. Some special configs are applied to the first chart
// like showing the legend and having additional padding.
function getActionChartConfig(
  actionName: string,
  totals: Cubes['totals'],
  bounds: AxisBounds,
  isFirst: boolean,
  unitLabel: string,
  theme: Theme,
  formatNumber: (value: number) => string,
  formatAxisLabel: (value: number) => string
): EChartsCoreOption {
  return {
    aria: { enabled: true },
    dataset: {
      dimensions: [
        { name: 'label', type: 'ordinal' },
        { name: 'cost', type: 'number' },
        { name: 'benefit', type: 'number' },
        { name: 'netBenefit', type: 'number' },
      ],
      source: [
        {
          label: actionName,
          cost: totals.cost,
          benefit: totals.benefit,
          netBenefit: totals.netBenefit,
        },
      ],
    },
    grid: {
      left: LABEL_COLUMN_WIDTH,
      top: isFirst ? 70 : 0,
      bottom: 0,
      right: 60,
    },
    legend: isFirst
      ? {
          selectedMode: false,
          data: [{ name: 'Net Benefit', icon: 'circle' }, 'Benefit', 'Cost'],
          top: 0,
        }
      : { show: false },
    xAxis: {
      type: 'value',
      position: 'top',
      min: bounds.min,
      max: bounds.max,
      axisLabel: {
        show: isFirst,
        formatter: (value: number) => `${formatAxisLabel(value)} ${unitLabel}`,
        showMinLabel: false,
        showMaxLabel: false,
      },
      axisLine: { show: false },
      splitLine: { show: true },
    },
    yAxis: {
      type: 'category',
      splitArea: { show: true },
      axisLine: { show: false },
      axisLabel: { show: true, width: 200, overflow: 'break', align: 'right', fontSize: 14 },
      axisTick: { show: false },
      splitLine: { show: false },
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      valueFormatter: (value: number) => `${formatNumber(value)} ${unitLabel}`,
    },
    series: [
      {
        type: 'custom',
        name: 'Net Benefit',
        itemStyle: { color: theme.themeColors.black, borderWidth: 2 },
        renderItem: function (params, api) {
          const categoryIndex = api.value('label');
          const netBenefit = api.value('netBenefit');
          const highPoint = api.coord([netBenefit, categoryIndex]);
          const height = api.size([0, 1])[1];
          const halfHeight = height / 2;
          const OFFSET = 5;
          const color = api.visual('color');
          const style = api.style({ stroke: color, fill: color });
          return {
            name: 'Net benefit',
            type: 'group',
            children: [
              {
                type: 'circle',
                transition: ['shape'],
                shape: {
                  cx: highPoint[0],
                  cy: highPoint[1] - halfHeight + OFFSET,
                  r: 4,
                },
                style,
              },
              {
                type: 'line',
                transition: ['shape'],
                shape: {
                  x1: highPoint[0],
                  y1: highPoint[1] - halfHeight + OFFSET,
                  x2: highPoint[0],
                  y2: highPoint[1] + halfHeight - OFFSET,
                },
                style,
              },
              {
                type: 'text',
                style: {
                  text: `${formatNumber(netBenefit as number)} ${unitLabel}`,
                  font: '12px sans-serif',
                  fill: theme.themeColors.black,
                  textAlign: 'left',
                  textBaseline: 'middle',
                },
                position: [highPoint[0] + 10, highPoint[1] - halfHeight + OFFSET],
              },
            ],
          };
        },
        encode: { x: 'netBenefit', y: 'label' },
        z: 100,
      },
      {
        type: 'bar',
        barCategoryGap: '40%',
        name: 'Benefit',
        encode: { x: 'benefit', y: 'label' },
        itemStyle: { color: theme.graphColors.green030 },
      },
      {
        type: 'bar',
        name: 'Cost',
        encode: { x: 'cost', y: 'label' },
        itemStyle: { color: theme.graphColors.red030 },
      },
    ],
  };
}

const COST_SHADES = [
  'red090',
  'red070',
  'red050',
  'red030',
  'red010',
  'yellow050',
  'yellow030',
  'yellow010',
] as const;

const BENEFIT_SHADES = [
  'green090',
  'green070',
  'green050',
  'green030',
  'green010',
  'blue070',
  'blue050',
  'blue030',
  'blue010',
] as const;

function getStakeholderCostTypeData(
  metric: DimensionalMetric,
  startYear: number,
  endYear: number,
  theme: Theme
): StakeholderCostTypeData | null {
  const stakeholderDim = metric.dimensions.find((d) => d.originalId === 'stakeholder');
  const costTypeDim = metric.dimensions.find((d) => d.originalId === 'cost_type');

  if (!stakeholderDim || !costTypeDim) return null;

  // Calculate total per cost type to determine the sign and
  // filter out cost types with no data in the selected year range.
  const costTypeAggregates = new Map<string, number>();

  for (const row of metric.rows) {
    if (row.value == null || row.year < startYear || row.year > endYear) {
      continue;
    }

    const costTypeId = row.dimCats[costTypeDim.id]?.id;

    if (costTypeId) {
      costTypeAggregates.set(costTypeId, (costTypeAggregates.get(costTypeId) ?? 0) + row.value);
    }
  }

  // Positive aggregate = cost (red), negative = benefit (green), zero = exclude
  const costs = costTypeDim.categories
    .filter((c) => c.originalId != null && (costTypeAggregates.get(c.id) ?? 0) > 0)
    .sort((a, b) => (costTypeAggregates.get(b.id) ?? 0) - (costTypeAggregates.get(a.id) ?? 0)); // largest cost first

  const benefits = costTypeDim.categories
    .filter((c) => c.originalId != null && (costTypeAggregates.get(c.id) ?? 0) < 0)
    .sort((a, b) => (costTypeAggregates.get(a.id) ?? 0) - (costTypeAggregates.get(b.id) ?? 0)); // largest benefit first

  const costTypes: CostTypeInfo[] = [
    ...costs.map((category, i) => ({
      originalId: category.originalId!,
      label: category.label,
      color: theme.graphColors[COST_SHADES[i % COST_SHADES.length]],
      isCost: true,
    })),
    ...benefits.map((category, i) => ({
      originalId: category.originalId!,
      label: category.label,
      color: theme.graphColors[BENEFIT_SHADES[i % BENEFIT_SHADES.length]],
      isCost: false,
    })),
  ];

  const rows: Record<string, number | string>[] = stakeholderDim.categories.map(
    (stakeholderCategory) => {
      const row: Record<string, number | string> = { label: stakeholderCategory.label };

      for (const costType of costTypes) {
        const costCategory = costTypeDim.categories.find(
          (c) => c.originalId === costType.originalId
        );

        if (!costCategory) {
          row[costType.originalId] = 0;
        } else {
          const rawSum = metric.rows.reduce<number>((sum, metricRow) => {
            if (
              metricRow.value == null ||
              metricRow.year < startYear ||
              metricRow.year > endYear ||
              metricRow.dimCats[stakeholderDim.id]?.id !== stakeholderCategory.id ||
              metricRow.dimCats[costTypeDim.id]?.id !== costCategory.id
            ) {
              return sum;
            }

            return sum + metricRow.value;
          }, 0);

          // Use absolute values so both costs and benefits plot as positive (right-going) bars,
          // matching the convention of the action-level chart.
          row[costType.originalId] = Math.abs(rawSum);
        }
      }

      return row;
    }
  );

  return { costTypes, rows };
}

function getStakeholderChartConfig(
  data: StakeholderCostTypeData,
  unitLabel: string,
  formatNumber: (value: number) => string,
  formatAxisLabel: (value: number) => string
): EChartsCoreOption {
  return {
    animation: false,
    aria: { enabled: true },
    dataset: {
      dimensions: ['label', ...data.costTypes.map((costType) => costType.originalId)],
      source: data.rows,
    },
    grid: {
      left: LABEL_COLUMN_WIDTH,
      top: 24,
      bottom: 40,
      right: 60,
    },
    legend: {
      type: 'scroll',
      orient: 'horizontal',
      bottom: 0,
      data: data.costTypes.map((costType) => ({
        name: costType.label,
        itemStyle: { color: costType.color },
      })),
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (() => {
        // Build label → originalId map so we can look up the correct dataset column per series.
        const labelToId = new Map(
          data.costTypes.map((costType) => [costType.label, costType.originalId])
        );

        return (params: unknown) => {
          type TooltipParam = { marker: string; seriesName: string; value: Record<string, number> };

          return (params as TooltipParam[])
            .flatMap((param) => {
              const id = labelToId.get(param.seriesName);
              const val = id != null ? param.value[id] : null;

              if (val == null || val === 0) {
                return [];
              }

              return [
                `${param.marker}${param.seriesName}: <b>${formatNumber(val)} ${unitLabel}</b>`,
              ];
            })
            .join('<br/>');
        };
      })(),
    },
    xAxis: {
      type: 'value',
      position: 'top',
      axisLabel: {
        show: true,
        formatter: (value: number) => `${formatAxisLabel(value)} ${unitLabel}`,
        showMinLabel: false,
        showMaxLabel: false,
      },
      axisTick: { show: true },
      axisLine: { show: false },
      splitLine: { show: true },
    },
    yAxis: {
      type: 'category',
      axisLine: { show: false },
      axisLabel: { show: true, width: 200, overflow: 'break', align: 'right' },
      axisTick: { show: false },
      splitLine: { show: false },
    },
    series: data.costTypes.map((costType) => ({
      type: 'bar',
      name: costType.label,
      // Costs and benefits use separate stacks so they form two grouped bar sets,
      // matching the same approach of the action-level chart above
      stack: costType.isCost ? 'costs' : 'benefits',
      encode: { x: costType.originalId, y: 'label' },
      itemStyle: { color: costType.color },
    })),
  };
}

function ActionRow({
  item,
  bounds,
  isFirst,
  isExpanded,
  onToggle,
  unitLabel,
  startYear,
  endYear,
  isLoading,
}: ActionRowProps) {
  const theme = useTheme();
  const t = useTranslations('common');
  const formatNumber = useNumberFormatter();
  const formatAxisLabel = useAxisLabelFormatter();
  const hasStakeholders = item.metric.hasDimension('stakeholder');

  const actionChartConfig = useMemo(
    () =>
      getActionChartConfig(
        item.actionName,
        item.totals,
        bounds,
        isFirst,
        unitLabel,
        theme,
        formatNumber,
        formatAxisLabel
      ),
    [item.actionName, item.totals, bounds, isFirst, unitLabel, theme, formatNumber, formatAxisLabel]
  );

  const stakeholderData = useMemo<StakeholderCostTypeData | null>(
    () =>
      !isExpanded || !hasStakeholders
        ? null
        : getStakeholderCostTypeData(item.metric, startYear, endYear, theme),
    [isExpanded, hasStakeholders, item.metric, startYear, endYear, theme]
  );

  const stakeholderChartConfig = useMemo(
    () =>
      !stakeholderData?.rows.length
        ? null
        : getStakeholderChartConfig(stakeholderData, unitLabel, formatNumber, formatAxisLabel),
    [stakeholderData, unitLabel, formatNumber, formatAxisLabel]
  );

  const SPACE_FOR_OUTCOMES_TOGGLE = 40;

  // The first action chart has a bigger height to fit the legend
  const actionChartHeight = isFirst
    ? `${120 + SPACE_FOR_OUTCOMES_TOGGLE}px`
    : `${55 + SPACE_FOR_OUTCOMES_TOGGLE}px`;
  const stakeholderChartHeight = `${(stakeholderData?.rows.length ?? 0) * 45 + 50}px`;

  return (
    <StyledActionBlock>
      <Chart
        isLoading={isLoading}
        data={actionChartConfig}
        height={actionChartHeight}
        withResizeLegend={false}
      />
      {hasStakeholders && (
        <StyledOutcomesToggle onClick={onToggle} $top={`calc(${actionChartHeight} - 25px)`}>
          {t('outcomes-of-interest')} {isExpanded ? <ChevronUp /> : <ChevronDown />}
        </StyledOutcomesToggle>
      )}

      <Collapse in={!!(isExpanded && stakeholderChartConfig)} mountOnEnter unmountOnExit>
        <Card sx={{ ml: 6, mt: 1, mb: 2 }}>
          <CardContent>
            <Grid container>
              <Grid size={{ xs: 12, md: 4, lg: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  {t('outcomes-of-interest-description')}
                </Typography>
              </Grid>

              <Grid size={{ xs: 12, md: 8, lg: 10 }}>
                <Chart
                  isLoading={false}
                  data={stakeholderChartConfig ?? undefined}
                  height={stakeholderChartHeight}
                  withResizeLegend={false}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Collapse>
    </StyledActionBlock>
  );
}

type TActionRow = { metric: DimensionalMetric; actionName: string; actionId: string };

export function CostBenefitAnalysis({ data, isLoading }: Props) {
  const t = useTranslations('common');
  const [startYear, endYear] = useReactiveVar(yearRangeVar);
  const [expandedActions, setExpandedActions] = useState<Set<string>>(new Set());

  const dimensionalMetrics = useMemo(() => {
    if (!data || data.graphType !== 'cost_benefit') {
      return [] as TActionRow[];
    }
    return data.actions
      .map((action) => {
        if (!action?.effectDim) return undefined;
        const metric = new DimensionalMetric(action.effectDim);
        const actionName = action.action?.name ?? '';
        const actionId = action.action?.id ?? actionName;
        if (!actionName) return undefined;
        return { metric, actionName, actionId };
      })
      .filter((v): v is TActionRow => v !== undefined);
  }, [data]);

  // Calculate the cost, benefit and net benefit for each metric
  const metricsWithTotals = useMemo((): Cubes[] => {
    return dimensionalMetrics.map(({ metric, actionName, actionId }) => {
      const [cost, benefit] = metric.rows.reduce(
        ([cost, benefit], row) => {
          if (row.value === 0 || row.value == null || row.year < startYear || row.year > endYear) {
            return [cost, benefit];
          }

          // Positive values are costs, negative values are benefits
          if (row.value < 0) {
            return [cost, benefit + Math.abs(row.value)];
          }

          return [cost + row.value, benefit];
        },
        [0, 0]
      );
      return {
        metric,
        actionName,
        actionId,
        totals: { cost, benefit, netBenefit: benefit - cost },
      };
    });
  }, [dimensionalMetrics, startYear, endYear]);

  const sortedMetrics = useMemo(
    () => [...metricsWithTotals].sort((a, b) => b.totals.netBenefit - a.totals.netBenefit),
    [metricsWithTotals]
  );

  const axisBounds = useMemo(() => getAxisBounds(metricsWithTotals), [metricsWithTotals]);

  const unitLabel = data?.effectUnit?.short ?? '';

  function handleToggleACtion(actionId: string) {
    setExpandedActions((prev) => {
      const next = new Set(prev);

      if (next.has(actionId)) {
        next.delete(actionId);
      } else {
        next.add(actionId);
      }

      return next;
    });
  }

  const MIN_WIDTH_XS = 820;
  const title = `${data?.label || t('cost-benefit-analysis')} (${startYear} - ${endYear})`;
  const subtitle = '-';

  return (
    <ChartWrapper title={title} subtitle={subtitle} isLoading={isLoading}>
      <StyledScrollArea>
        <OverlayScrollbarsComponent
          defer
          className="os-top-scrollbar"
          options={{
            scrollbars: { autoHide: 'never' },
            overflow: { x: 'scroll', y: 'hidden' },
          }}
        >
          <StyledChartColumn>
            <Box sx={{ minWidth: { xs: MIN_WIDTH_XS, md: 'auto' }, width: '100%' }}>
              {sortedMetrics.map((item, index) => (
                <ActionRow
                  key={item.actionId}
                  item={item}
                  bounds={axisBounds}
                  isFirst={index === 0}
                  isExpanded={expandedActions.has(item.actionId)}
                  onToggle={() => handleToggleACtion(item.actionId)}
                  unitLabel={unitLabel}
                  startYear={startYear}
                  endYear={endYear}
                  isLoading={isLoading}
                />
              ))}
            </Box>
          </StyledChartColumn>
        </OverlayScrollbarsComponent>
      </StyledScrollArea>
    </ChartWrapper>
  );
}
