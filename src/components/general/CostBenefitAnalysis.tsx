/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument */
import { useMemo, useState } from 'react';

import { useReactiveVar } from '@apollo/client';
import type { Theme } from '@emotion/react';
import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import { Box } from '@mui/material';
import type { EChartsCoreOption } from 'echarts/core';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import 'overlayscrollbars/styles/overlayscrollbars.css';

import { Chart } from '@common/components/Chart';

import type { ImpactOverviewsQuery } from '@/common/__generated__/graphql';
import { yearRangeVar } from '@/common/cache';
import { useTranslation } from '@/common/i18n';
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

type StakeholderTotal = {
  categoryId: string;
  label: string;
  cost: number;
  benefit: number;
  netBenefit: number;
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
  outcomesLabel: string;
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
  border-bottom: 1px solid ${({ theme }) => theme.graphColors.grey010};

  &:last-child {
    border-bottom: none;
  }
`;

const StyledOutcomesToggle = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  font-size: ${({ theme }) => theme.fontSizeSm};
  color: ${({ theme }) => theme.themeColors.dark};
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
  theme: Theme
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
      top: isFirst ? 70 : 4,
      bottom: 4,
      right: 60,
    },
    legend: isFirst
      ? // TODO: Ensure this isn't clickable
        { data: [{ name: 'Net Benefit', icon: 'circle' }, 'Benefit', 'Cost'], top: 0 }
      : { show: false },
    xAxis: {
      type: 'value',
      position: 'top',
      min: bounds.min,
      max: bounds.max,
      axisLabel: {
        show: isFirst,
        formatter: `{value} ${unitLabel}`,
      },
      axisLine: { show: false },
      splitLine: { show: true },
    },
    yAxis: {
      type: 'category',
      splitArea: { show: true },
      axisLine: { show: false },
      axisLabel: { show: true, width: 200, overflow: 'break', align: 'right' },
      axisTick: { show: false },
      splitLine: { show: false },
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      valueFormatter: (value: number) => `${Math.round(value)} ${unitLabel}`,
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
                  text: `${Math.round(netBenefit)} ${unitLabel}`,
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

function getStakeholderChartConfig(
  stakeholders: StakeholderTotal[],
  bounds: AxisBounds,
  unitLabel: string,
  theme: Theme
): EChartsCoreOption {
  return {
    aria: { enabled: true },
    dataset: {
      dimensions: [
        { name: 'label', type: 'ordinal' },
        { name: 'cost', type: 'number' },
        { name: 'benefit', type: 'number' },
      ],
      source: stakeholders.map((s) => ({ label: s.label, cost: s.cost, benefit: s.benefit })),
    },
    grid: {
      left: LABEL_COLUMN_WIDTH,
      top: 0,
      bottom: 4,
      right: 60,
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      valueFormatter: (value: unknown) => `${Math.round(value as number)} ${unitLabel}`,
    },
    xAxis: {
      type: 'value',
      position: 'top',
      min: bounds.min,
      max: bounds.max,
      axisLabel: { show: false },
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
    series: [
      {
        type: 'bar',
        barCategoryGap: '40%',
        name: 'Benefit',
        encode: { x: 'benefit', y: 'label' },
        itemStyle: { color: theme.graphColors.green010 },
      },
      {
        type: 'bar',
        name: 'Cost',
        encode: { x: 'cost', y: 'label' },
        itemStyle: { color: theme.graphColors.red010 },
      },
    ],
  };
}

/**
 * Returns cost/benefit totals per category for a given dimension, summed over the year range.
 * Negative row values are treated as benefits and positive as costs. Written based on other methods
 * in metric.ts but kjept separate because this is specifically for cost benefits.
 *
 * @param dimensionOriginalId The non-prefixed (canonical) id for the dimension
 * @param startYear Inclusive start year
 * @param endYear Inclusive end year
 */
function getPerCategoryTotals(
  dimensionalMetric: DimensionalMetric,
  dimensionOriginalId: string,
  startYear: number,
  endYear: number
): StakeholderTotal[] {
  const dim = dimensionalMetric.dimensions.find((d) => d.originalId === dimensionOriginalId);

  if (!dim) {
    return [];
  }

  return dim.categories.map((cat) => {
    const [cost, benefit] = dimensionalMetric.rows.reduce<[number, number]>(
      ([cost, benefit], row) => {
        if (
          row.value === 0 ||
          row.value == null ||
          row.year < startYear ||
          row.year > endYear ||
          row.dimCats[dim.id]?.id !== cat.id
        ) {
          return [cost, benefit];
        }

        if (row.value < 0) {
          return [cost, benefit + Math.abs(row.value)];
        }

        return [cost + row.value, benefit];
      },
      [0, 0]
    );

    return { categoryId: cat.id, label: cat.label, cost, benefit, netBenefit: benefit - cost };
  });
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
  outcomesLabel,
  isLoading,
}: ActionRowProps) {
  const theme = useTheme();
  const hasStakeholders = item.metric.hasDimension('stakeholder');

  const actionChartConfig = useMemo(
    () => getActionChartConfig(item.actionName, item.totals, bounds, isFirst, unitLabel, theme),
    [item.actionName, item.totals, bounds, isFirst, unitLabel, theme]
  );

  const stakeholders = useMemo<StakeholderTotal[] | null>(
    () =>
      !isExpanded || !hasStakeholders
        ? null
        : getPerCategoryTotals(item.metric, 'stakeholder', startYear, endYear),
    [isExpanded, hasStakeholders, item.metric, startYear, endYear]
  );

  const stakeholderChartConfig = useMemo(
    () =>
      !stakeholders?.length
        ? null
        : getStakeholderChartConfig(stakeholders, bounds, unitLabel, theme),
    [stakeholders, bounds, unitLabel, theme]
  );

  const actionChartHeight = isFirst ? '120px' : '55px';
  const stakeholderChartHeight = `${(stakeholders?.length ?? 0) * 45 + 10}px`;

  return (
    <StyledActionBlock>
      <Chart
        isLoading={isLoading}
        data={actionChartConfig}
        height={actionChartHeight}
        withResizeLegend={false}
      />
      {hasStakeholders && (
        <StyledOutcomesToggle onClick={onToggle}>
          {outcomesLabel} {isExpanded ? '▲' : '▼'}
        </StyledOutcomesToggle>
      )}
      {isExpanded && stakeholderChartConfig && (
        <Chart
          isLoading={false}
          data={stakeholderChartConfig}
          height={stakeholderChartHeight}
          withResizeLegend={false}
        />
      )}
    </StyledActionBlock>
  );
}

type TActionRow = { metric: DimensionalMetric; actionName: string; actionId: string };

export function CostBenefitAnalysis({ data, isLoading }: Props) {
  const { t } = useTranslation();
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

          // Negative costs are considered benefits
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
    () => [...metricsWithTotals].sort((a, b) => a.totals.netBenefit - b.totals.netBenefit),
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

  return (
    <ChartWrapper title={t('cost-benefit-analysis')} isLoading={isLoading}>
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
                  outcomesLabel={t('outcomes-of-interest')}
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
