import React, { useMemo, useState } from 'react';

import {
  Box,
  Chip,
  CircularProgress,
  Collapse,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Typography,
} from '@mui/material';

import { useTranslations } from 'next-intl';
import { ChevronDown } from 'react-bootstrap-icons';

import { useTheme } from '@common/themes';

import { DecisionLevel } from '@/common/__generated__/graphql';
import { ActionLink } from '@/common/links';
import { useNumberFormatter } from '@/common/numbers';
import { findActionEnabledParam, summarizeYearlyValuesBetween } from '@/common/preprocess';
import ScenarioChip from '@/components/general/ScenarioChip';
import type {
  ActionWithEfficiency,
  ActiveOverviewInfo,
  SortActionsConfig,
} from '@/types/actions.types';

type ActionsListProps = {
  id?: string;
  actions: ActionWithEfficiency[];
  actionGroups: { id: string; name: string; color: string | null }[];
  displayType: 'displayTypeYearly';
  yearRange: [number, number];
  sortBy: SortActionsConfig;
  sortAscending: boolean;
  isLoading: boolean;
  refetching: boolean;
  activeOverview: ActiveOverviewInfo | null;
  onChangeSort?: (key: SortActionsConfig['key']) => void;
  onToggleSortDirection?: () => void;
};

type ColumnDef = {
  key: SortActionsConfig['key'];
  label: string;
  sortKey?: keyof ActionWithEfficiency;
  getValue: (a: ActionWithEfficiency) => number | null;
  getUnit: (a: ActionWithEfficiency) => string | undefined;
  disableSort?: boolean;
};

const MISSING_VALUE = '—';

const getValueForSorting = (
  action: ActionWithEfficiency,
  sortBy: SortActionsConfig,
  yearRange: [number, number]
): number => {
  // Cost-benefit mode: action.costBenefit is populated, columns read from it.
  const cb = action.costBenefit;
  if (cb) {
    if (sortBy.key === 'CUM_IMPACT') return cb.benefit;
    if (sortBy.key === 'CUM_COST') return cb.cost;
    if (sortBy.key === 'CUM_EFFICIENCY') return cb.netBenefit;
  }
  if (sortBy.key === 'CUM_IMPACT') {
    const metric = action.impactMetric;
    if (!metric) {
      return 0;
    }
    return summarizeYearlyValuesBetween(metric, yearRange[0], yearRange[1]);
  }
  if (sortBy.sortKey) {
    const val = action[sortBy.sortKey as keyof ActionWithEfficiency];
    return typeof val === 'number' ? val : 0;
  }
  return 0;
};

const formatEfficiencyForDisplay = (
  eff: number,
  cap: number | null | undefined,
  formatNumber: (value: number) => string
) => {
  const limit = cap ?? Infinity;
  return Math.abs(eff) < limit ? formatNumber(eff) : '-';
};

const headerText = {
  fontSize: 12,
  lineHeight: 1.2,
  whiteSpace: 'normal' as const,
  wordBreak: 'break-word' as const,
  hyphens: 'auto' as const,
  display: 'block',
  width: 1,
};

const COL1_XS = '18ch';

export default function ActionsList({
  id,
  actions,
  actionGroups,
  yearRange,
  sortBy,
  sortAscending,
  isLoading,
  refetching,
  activeOverview,
  onChangeSort,
  onToggleSortDirection,
}: ActionsListProps) {
  const t = useTranslations('common');
  const formatNumber = useNumberFormatter();
  const theme = useTheme();
  const [openRows, setOpenRows] = useState<Record<string, boolean>>({});
  const cardBgPrimary = theme.cardBackground?.primary ?? theme.palette.background.paper;
  const cardBgSecondary = theme.cardBackground?.secondary ?? theme.palette.background.default;
  const textPrimary = theme.textColor?.primary ?? theme.palette.text.primary;
  const textSecondary = theme.textColor?.secondary ?? theme.palette.text.primary;
  const textTertiary = theme.textColor?.tertiary ?? theme.palette.text.secondary;

  // hide ungrouped actions if at least one group exists
  const filteredActions = useMemo(() => {
    const hasAnyGroup = actions.some((a) => a.group);
    return hasAnyGroup ? actions.filter((a) => a.group) : actions;
  }, [actions]);

  const groupOrder = useMemo(() => new Map(actionGroups.map((g, i) => [g.id, i])), [actionGroups]);

  const originalIndex = useMemo(
    () => new Map(filteredActions.map((a, i) => [a.id, i])),
    [filteredActions]
  );
  const columns: ColumnDef[] = useMemo(() => {
    const graphType = activeOverview?.graphType ?? null;

    // simple_effect and no-overview: impact columns only (from impactMetric)
    if (!graphType || graphType === 'simple_effect') {
      return [
        {
          key: 'CUM_IMPACT',
          label: `${activeOverview?.label ?? t('total-impact')} ${yearRange[0]}–${yearRange[1]}`,
          getValue: (a) =>
            a.cumulativeImpact ??
            (a.impactMetric
              ? summarizeYearlyValuesBetween(a.impactMetric, yearRange[0], yearRange[1])
              : null),
          getUnit: (a) => a.cumulativeImpactUnit ?? a.impactMetric?.yearlyCumulativeUnit?.htmlShort,
        },
        {
          key: 'IMPACT',
          label: `${t('annual-impact')} ${yearRange[1]}`,
          sortKey: 'impactOnTargetYear',
          getValue: (a) => (a.impactMetric ? a.impactOnTargetYear : null),
          getUnit: (a) => a.impactMetric?.unit?.htmlShort,
        },
      ];
    }

    // cost_benefit: Benefit / Cost / Net Benefit (derived from effectDim)
    if (graphType === 'cost_benefit') {
      return [
        {
          key: 'CUM_IMPACT',
          label: t('benefit'),
          getValue: (a) => a.costBenefit?.benefit ?? null,
          getUnit: (a) => a.costBenefit?.unit,
        },
        {
          key: 'CUM_COST',
          label: t('cost'),
          getValue: (a) => a.costBenefit?.cost ?? null,
          getUnit: (a) => a.costBenefit?.unit,
        },
        {
          key: 'CUM_EFFICIENCY',
          label: t('net-benefit'),
          getValue: (a) => a.costBenefit?.netBenefit ?? null,
          getUnit: (a) => a.costBenefit?.unit,
        },
      ];
    }

    // return_on_investment: single ROI column
    if (graphType === 'return_on_investment' && activeOverview) {
      return [
        {
          key: 'CUM_EFFICIENCY',
          label: activeOverview.label,
          sortKey: 'cumulativeEfficiency',
          getValue: (a) => {
            const cost = a.cumulativeCost;
            const impact = a.cumulativeImpact;
            if (cost === undefined || impact === undefined || cost <= 0) return null;
            return (impact / cost) * (a.unitAdjustmentMultiplier ?? 1);
          },
          getUnit: () => activeOverview.indicatorUnit ?? '%',
        },
      ];
    }

    // cost_efficiency: effectDim, costDim, efficiency columns
    const firstWithCost = filteredActions.find((a) => typeof a.cumulativeCost === 'number');
    const firstWithEfficiency = filteredActions.find(
      (a) => typeof a.cumulativeEfficiency === 'number'
    );
    const cols: ColumnDef[] = [
      {
        key: 'CUM_IMPACT',
        label:
          firstWithCost?.cumulativeImpactName ??
          `${t('total-impact')} ${yearRange[0]}–${yearRange[1]}`,
        getValue: (a) => a.cumulativeImpact ?? null,
        getUnit: (a) => a.cumulativeImpactUnit ?? a.impactMetric?.yearlyCumulativeUnit?.htmlShort,
      },
    ];
    if (firstWithCost) {
      cols.push({
        key: 'CUM_COST',
        label:
          firstWithCost.cumulativeCostName ?? `${t('net-cost')} ${yearRange[0]}–${yearRange[1]}`,
        sortKey: 'cumulativeCost',
        getValue: (a) => a.cumulativeCost ?? null,
        getUnit: (a) => a.cumulativeCostUnit,
      });
    }
    if (firstWithEfficiency) {
      cols.push({
        key: 'CUM_EFFICIENCY',
        label: firstWithEfficiency.cumulativeEfficiencyName ?? t('cost-efficiency'),
        sortKey: 'cumulativeEfficiency',
        getValue: (a) => a.cumulativeEfficiency ?? null,
        getUnit: (a) => a.cumulativeEfficiencyUnit,
      });
    }
    return cols;
  }, [filteredActions, yearRange, t, activeOverview]);

  const sortedActions = useMemo(() => {
    const arr = [...filteredActions];
    const isCostBenefit = activeOverview?.graphType === 'cost_benefit';

    if (sortBy.key === 'STANDARD') {
      arr.sort((a, b) => {
        const ga = groupOrder.get(a.group?.id ?? '') ?? Number.MAX_SAFE_INTEGER;
        const gb = groupOrder.get(b.group?.id ?? '') ?? Number.MAX_SAFE_INTEGER;
        if (ga !== gb) return ga - gb;
        return (originalIndex.get(a.id) ?? 0) - (originalIndex.get(b.id) ?? 0);
      });
      return arr;
    }

    // Partition: disabled actions and (in cost_benefit) actions missing
    // costBenefit data — which are hidden from the graph — go to the bottom.
    const included: ActionWithEfficiency[] = [];
    const excluded: ActionWithEfficiency[] = [];
    for (const action of arr) {
      const enabledParam = findActionEnabledParam(action.parameters);
      const isEnabled = !refetching && (enabledParam?.boolValue ?? false);
      const hasCostBenefit = !isCostBenefit || !!action.costBenefit;
      (isEnabled && hasCostBenefit ? included : excluded).push(action);
    }

    included.sort((a, b) => {
      const av = getValueForSorting(a, sortBy, yearRange);
      const bv = getValueForSorting(b, sortBy, yearRange);
      return sortAscending ? av - bv : bv - av;
    });

    return [...included, ...excluded];
  }, [
    filteredActions,
    sortBy,
    sortAscending,
    yearRange,
    groupOrder,
    originalIndex,
    refetching,
    activeOverview,
  ]);

  const handleSortClick = (key: SortActionsConfig['key']) => {
    if (sortBy.key === key) {
      onToggleSortDirection?.();
    } else {
      onChangeSort?.(key);
    }
  };

  // Totals for percent bars — excluded or missing-value actions don't contribute
  const totals = useMemo(() => {
    return columns.reduce(
      (acc, col) => {
        acc[col.key] = filteredActions.reduce((sum, a) => {
          const enabledParam = findActionEnabledParam(a.parameters);
          const isIncluded = !refetching && (enabledParam?.boolValue ?? false);
          const v = col.getValue(a);
          return isIncluded && v !== null ? sum + v : sum;
        }, 0);
        return acc;
      },
      {} as Record<SortActionsConfig['key'], number>
    );
  }, [filteredActions, columns, refetching]);

  const COLSPAN = 4 + columns.length;
  const ROW_GAP = 0.5;

  if (isLoading && sortedActions.length === 0) {
    return (
      <Box
        data-testid="actions-list"
        id={id}
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          py: 8,
        }}
      >
        <CircularProgress aria-label={t('loading')} />
      </Box>
    );
  }

  return (
    <TableContainer
      data-testid="actions-list"
      id={id}
      sx={{
        borderRadius: 1,
        overflowX: { xs: 'auto', md: 'visible' },
        overflowY: 'hidden',
        maxWidth: '100%',
      }}
    >
      <Table
        sx={{
          borderCollapse: 'collapse',
          minWidth: { xs: 880, md: 'auto' },
          '& .MuiTableCell-head': {
            py: { xs: 0.5, md: 0.6 },
            lineHeight: { xs: 1.2, md: 1.25 },
            verticalAlign: 'middle',
          },
          '--col1-xs': COL1_XS,
        }}
      >
        <TableHead>
          <TableRow
            sx={{
              backgroundColor: theme.graphColors.grey020,
              '& .MuiTableSortLabel-root': { lineHeight: 'inherit', whiteSpace: 'normal' },
              '& > .MuiTableCell-head:nth-of-type(1)': { minWidth: { xs: '18ch', md: 'auto' } },
              '& > .MuiTableCell-root:nth-of-type(3)': {
                minWidth: { xs: '22ch', md: 160 },
                width: { md: 160 },
              },
              '& > .MuiTableCell-head:nth-of-type(2)': {
                position: { xs: 'sticky', md: 'static' },
                left: { xs: 0, md: 'auto' },
                zIndex: { xs: 3, md: 'auto' },
                backgroundColor: theme.graphColors.grey020,
                boxShadow: { xs: '2px 0 0 rgba(0,0,0,0.06)', md: 'none' },
              },
            }}
          >
            <TableCell>
              <Box component="span" sx={headerText}>
                {t('actions-group-type')}
              </Box>
            </TableCell>

            <TableCell>
              <Box component="span" sx={headerText}>
                {t('action-name')}
              </Box>
            </TableCell>

            <TableCell>
              <Box component="span" sx={headerText}>
                {t('included-in-scenario')}
              </Box>
            </TableCell>

            {columns.map((col) => (
              <TableCell key={col.key} sx={{ minWidth: { xs: '16ch', md: '12' } }}>
                {col.disableSort ? (
                  <Box component="span" sx={headerText}>
                    {col.label}
                  </Box>
                ) : (
                  <TableSortLabel
                    active={sortBy.key === col.key}
                    direction={sortBy.key === col.key ? (sortAscending ? 'asc' : 'desc') : 'asc'}
                    onClick={() => handleSortClick(col.key)}
                  >
                    <Box component="span" sx={headerText}>
                      {col.label}
                    </Box>
                  </TableSortLabel>
                )}
              </TableCell>
            ))}

            <TableCell
              sx={{
                position: 'relative',
              }}
            >
              <Box
                component="span"
                sx={{
                  position: 'absolute',
                  width: '1px',
                  height: '1px',
                  p: 0,
                  m: '-1px',
                  overflow: 'hidden',
                  clip: 'rect(0 0 0 0)',
                  whiteSpace: 'nowrap',
                  border: 0,
                }}
              >
                {t('details')}
              </Box>
            </TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          <TableRow aria-hidden>
            <TableCell colSpan={COLSPAN} sx={{ p: 0, border: 0 }}>
              <Box sx={{ height: theme.spacing(ROW_GAP) }} />
            </TableCell>
          </TableRow>

          {sortedActions.map((action, rowIndex) => {
            const isOpen = Boolean(openRows[action.id]);
            const enabledParam = findActionEnabledParam(action.parameters);
            const isIncluded = !refetching && (enabledParam?.boolValue ?? false);
            const detailsId = `action-details-${action.id}`;

            const colors = {
              bg: isIncluded ? cardBgPrimary : cardBgSecondary,
              text: isIncluded ? textSecondary : textTertiary,
              title: isIncluded ? textPrimary : textTertiary,
            };
            const rowBg = colors.bg;

            return (
              <React.Fragment key={action.id}>
                <TableRow
                  sx={{
                    bgcolor: rowBg,
                    color: colors.text,
                    '& > .MuiTableCell-root': {
                      backgroundColor: 'inherit',
                      color: 'inherit',
                      borderBottom: isOpen ? 'none' : undefined,
                    },
                    '& > .MuiTableCell-root:nth-of-type(1)': {
                      minWidth: { xs: '18ch', md: 'auto' },
                    },
                    '& > .MuiTableCell-root:nth-of-type(2)': {
                      position: { xs: 'sticky', md: 'static' },
                      left: { xs: 0, md: 'auto' },
                      zIndex: { xs: 2, md: 'auto' },
                      backgroundColor: rowBg,
                      boxShadow: { xs: '2px 0 0 rgba(0,0,0,0.06)', md: 'none' },
                    },
                  }}
                >
                  <TableCell
                    sx={{
                      pl: 1,
                      borderLeft: `6px solid ${action.group?.color ?? theme.graphColors.grey090}`,
                    }}
                  >
                    {action.group?.name}
                  </TableCell>

                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ActionLink action={action}>
                        <Typography
                          component="span"
                          variant="h6"
                          sx={{ color: colors.title, textDecoration: 'none', cursor: 'pointer' }}
                        >
                          {action.name}
                        </Typography>
                      </ActionLink>
                      {action.decisionLevel === DecisionLevel.Nation && (
                        <Chip
                          size="small"
                          label={t('decision-national')}
                          sx={{
                            height: 24,
                            borderRadius: 0,
                            bgcolor: theme.graphColors?.blue010 ?? theme.palette.action.selected,
                            color: theme.graphColors?.blue090 ?? theme.palette.primary.main,
                            border: `1px solid ${theme.graphColors?.blue030 ?? 'transparent'}`,
                            '& .MuiChip-label': { px: 0.75, py: 0 },
                          }}
                        />
                      )}
                    </Box>
                  </TableCell>

                  <ScenarioChip checked={isIncluded} label={t('included-in-scenario')} />

                  {columns.map((col) => {
                    const val = col.getValue(action);
                    const isImpactCol = col.key === 'CUM_IMPACT' || col.key === 'IMPACT';
                    const hideImpact = !isIncluded && isImpactCol;
                    const isMissing = val === null;
                    const total = totals[col.key] || 0;
                    const percent = !isMissing && total ? (val / total) * 100 : 0;

                    let display: string;
                    let unit: string | undefined;

                    if (isMissing) {
                      display = MISSING_VALUE;
                      unit = undefined;
                    } else if (col.key === 'CUM_EFFICIENCY') {
                      display = formatEfficiencyForDisplay(val, action.efficiencyCap, formatNumber);
                      unit = action.cumulativeEfficiencyUnit;
                    } else {
                      display = formatNumber(val);
                      unit = col.getUnit(action);
                    }

                    return (
                      <TableCell key={col.key} sx={{ pb: 1, pt: 1 }}>
                        {!hideImpact && (
                          <>
                            <Typography variant="h5" component="span" sx={{ color: colors.title }}>
                              {display}
                            </Typography>
                            {unit && (
                              <Typography
                                variant="body2"
                                component="span"
                                sx={{ ml: 0.5, color: colors.text }}
                              >
                                {unit}
                              </Typography>
                            )}
                          </>
                        )}
                        {isImpactCol && !hideImpact && !isMissing && (
                          <Box
                            sx={{
                              position: 'relative',
                              height: 4,
                              width: '100%',
                              backgroundColor: theme.palette.grey[300],
                              mt: 0.5,
                            }}
                          >
                            <Box
                              sx={{
                                width: `${Math.abs(percent)}%`,
                                height: '100%',
                                backgroundColor:
                                  val < 0 ? theme.palette.success.main : theme.palette.error.main,
                                position: 'absolute',
                                left: val < 0 ? 'auto' : 0,
                                right: val < 0 ? 0 : 'auto',
                                top: 0,
                              }}
                            />
                          </Box>
                        )}
                      </TableCell>
                    );
                  })}

                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() =>
                        setOpenRows((prev) => ({ ...prev, [action.id]: !prev[action.id] }))
                      }
                      aria-label={
                        isOpen
                          ? t('hide-details', { action: action.name })
                          : t('show-details', { action: action.name })
                      }
                      aria-expanded={isOpen ? true : false}
                      aria-controls={detailsId}
                    >
                      <ChevronDown
                        size={20}
                        aria-hidden="true"
                        focusable="false"
                        style={{
                          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.2s',
                        }}
                      />
                    </IconButton>
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell
                    colSpan={COLSPAN}
                    sx={{
                      p: 0,
                      borderBottom: 'none',
                      borderLeft: `6px solid ${action.group?.color ?? theme.graphColors.grey090}`,
                      bgcolor: rowBg,
                      color: colors.text,
                      '& .MuiCollapse-root, & .MuiCollapse-root *': {
                        backgroundColor: 'inherit',
                        color: 'inherit',
                      },
                    }}
                  >
                    <Collapse
                      id={detailsId}
                      in={isOpen}
                      timeout="auto"
                      unmountOnExit
                      role="region"
                      aria-label={t('action-details-for', { action: action.name })}
                    >
                      <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Typography variant="body2" sx={{ color: colors.text }}>
                          {(action.goal || action.shortDescription)?.replace(/(<([^>]+)>)/gi, '')}
                        </Typography>
                        <ActionLink action={action}>
                          <Typography
                            component="span"
                            variant="h6"
                            sx={{
                              color: colors.title,
                              textDecoration: 'none',
                              cursor: 'pointer',
                              '&:hover': { textDecoration: 'underline' },
                            }}
                          >
                            {t('how-calculated')} &gt;
                          </Typography>
                        </ActionLink>
                      </Box>
                    </Collapse>
                  </TableCell>
                </TableRow>

                {rowIndex < sortedActions.length - 1 && (
                  <TableRow aria-hidden>
                    <TableCell colSpan={COLSPAN} sx={{ p: 0, border: 0 }}>
                      <Box sx={{ height: theme.spacing(ROW_GAP) }} />
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
