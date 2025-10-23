import React, { useMemo, useState } from 'react';

import { useTheme } from '@emotion/react';
import {
  Box,
  Chip,
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
import { useTranslation } from 'next-i18next';
import { ChevronDown } from 'react-bootstrap-icons';

import { DecisionLevel } from '@/common/__generated__/graphql';
import { ActionLink } from '@/common/links';
import {
  findActionEnabledParam,
  formatNumber,
  summarizeYearlyValuesBetween,
} from '@/common/preprocess';
import ScenarioChip from '@/components/general/ScenarioChip';
import type { ActionWithEfficiency, SortActionsConfig } from '@/types/actions.types';

type ActionsListProps = {
  id?: string;
  actions: ActionWithEfficiency[];
  actionGroups: { id: string; name: string; color: string | null }[];
  displayType: 'displayTypeYearly';
  yearRange: [number, number];
  sortBy: SortActionsConfig;
  sortAscending: boolean;
  refetching: boolean;
  onChangeSort?: (key: SortActionsConfig['key']) => void;
  onToggleSortDirection?: () => void;
};

type ColumnDef = {
  key: SortActionsConfig['key'];
  label: string;
  sortKey?: keyof ActionWithEfficiency;
  getValue: (a: ActionWithEfficiency) => number;
  getUnit: (a: ActionWithEfficiency) => string | undefined;
};

const getValueForSorting = (
  action: ActionWithEfficiency,
  sortBy: SortActionsConfig,
  yearRange: [number, number]
): number => {
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
  eff: number | null | undefined,
  cap: number | null | undefined,
  lang: string
) => {
  const value = eff ?? 0;
  const limit = cap ?? Infinity;
  return Math.abs(value) < limit ? formatNumber(value, lang) : '-';
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

const ActionsList = ({
  id,
  actions,
  actionGroups,
  yearRange,
  sortBy,
  sortAscending,
  refetching,
  onChangeSort,
  onToggleSortDirection,
}: ActionsListProps) => {
  const { t, i18n } = useTranslation();
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
    const base: ColumnDef[] = [
      {
        key: 'CUM_IMPACT',
        label: `${t('total-impact')} ${yearRange[0]}–${yearRange[1]}`,
        getValue: (a) =>
          a.impactMetric
            ? summarizeYearlyValuesBetween(a.impactMetric, yearRange[0], yearRange[1])
            : 0,
        getUnit: (a) => a.impactMetric?.yearlyCumulativeUnit?.htmlShort,
      },
      {
        key: 'IMPACT',
        label: `${t('annual-impact')} ${yearRange[1]}`,
        sortKey: 'impactOnTargetYear',
        getValue: (a) => a.impactOnTargetYear,
        getUnit: (a) => a.impactMetric?.unit?.htmlShort,
      },
    ];

    if (filteredActions.some((a) => typeof a.cumulativeCost === 'number')) {
      base.push({
        key: 'CUM_COST',
        label: `${t('net-cost')} ${yearRange[0]}–${yearRange[1]}`,
        sortKey: 'cumulativeCost',
        getValue: (a) => a.cumulativeCost ?? 0,
        getUnit: (a) => a.cumulativeCostUnit,
      });
    }

    if (filteredActions.some((a) => typeof a.cumulativeEfficiency === 'number')) {
      base.push({
        key: 'CUM_EFFICIENCY',
        label: t('cost-efficiency'),
        sortKey: 'cumulativeEfficiency',
        getValue: (a) => a.cumulativeEfficiency ?? 0,
        getUnit: (a) => a.cumulativeEfficiencyUnit,
      });
    }
    return base;
  }, [filteredActions, yearRange, t]);

  const sortedActions = useMemo(() => {
    const arr = [...filteredActions];

    if (sortBy.key === 'STANDARD') {
      arr.sort((a, b) => {
        const ga = groupOrder.get(a.group?.id ?? '') ?? Number.MAX_SAFE_INTEGER;
        const gb = groupOrder.get(b.group?.id ?? '') ?? Number.MAX_SAFE_INTEGER;
        if (ga !== gb) return ga - gb;
        return (originalIndex.get(a.id) ?? 0) - (originalIndex.get(b.id) ?? 0);
      });
      return arr;
    }

    arr.sort((a, b) => {
      const av = getValueForSorting(a, sortBy, yearRange);
      const bv = getValueForSorting(b, sortBy, yearRange);
      return sortAscending ? av - bv : bv - av;
    });

    return arr;
  }, [filteredActions, sortBy, sortAscending, yearRange, groupOrder, originalIndex]);

  const handleSortClick = (key: SortActionsConfig['key']) => {
    if (sortBy.key === key) {
      onToggleSortDirection?.();
    } else {
      onChangeSort?.(key);
    }
  };

  // Totals for percent bars
  const totals = useMemo(() => {
    return columns.reduce(
      (acc, col) => {
        acc[col.key] = filteredActions.reduce((sum, a) => sum + col.getValue(a), 0);
        return acc;
      },
      {} as Record<SortActionsConfig['key'], number>
    );
  }, [filteredActions, columns]);

  const COLSPAN = 4 + columns.length;
  const ROW_GAP = 0.5;

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
              backgroundColor: theme.graphColors.blue010,
              '& .MuiTableSortLabel-root': { lineHeight: 'inherit', whiteSpace: 'normal' },
              '& > .MuiTableCell-head:nth-of-type(1)': { minWidth: { xs: '18ch', md: 'auto' } },
              '& > .MuiTableCell-root:nth-of-type(3)': { minWidth: { xs: '22ch', md: 160 }, width: { md: 160 } },
              '& > .MuiTableCell-head:nth-of-type(2)': {
                position: { xs: 'sticky', md: 'static' },
                left:     { xs: 0, md: 'auto' },
                zIndex:   { xs: 3, md: 'auto' },
                backgroundColor: theme.graphColors.blue010,
                boxShadow: { xs: '2px 0 0 rgba(0,0,0,0.06)', md: 'none' },
              },
            }}
          >
            <TableCell >
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
              <TableCell
                key={col.key}
                sx={{ minWidth: { xs: '16ch', md: 'auto' } }}
              >
                <TableSortLabel
                  active={sortBy.key === col.key}
                  direction={sortBy.key === col.key ? (sortAscending ? 'asc' : 'desc') : 'asc'}
                  onClick={() => handleSortClick(col.key)}
                >
                  <Box component="span" sx={headerText}>
                    {col.label}
                  </Box>
                </TableSortLabel>
              </TableCell>
            ))}

            <TableCell />
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
                    '& > .MuiTableCell-root:nth-of-type(1)': { minWidth: { xs: '18ch', md: 'auto' } },
                    '& > .MuiTableCell-root:nth-of-type(2)': {
                      position: { xs: 'sticky', md: 'static' },
                      left:     { xs: 0, md: 'auto' },
                      zIndex:   { xs: 2, md: 'auto' },
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
                          component="a"
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
                    const total = totals[col.key] || 0;
                    const percent = total ? (val / total) * 100 : 0;

                    let display: string;
                    let unit: string | undefined;

                    if (col.key === 'CUM_EFFICIENCY') {
                      display = formatEfficiencyForDisplay(
                        action.cumulativeEfficiency,
                        action.efficiencyCap,
                        i18n.language
                      );
                      unit = action.cumulativeEfficiencyUnit;
                    } else {
                      display = formatNumber(val, i18n.language);
                      unit = col.getUnit(action);
                    }

                    return (
                      <TableCell key={col.key} sx={{ pb: 1, pt: 1 }}>
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
                        {(col.key === 'CUM_IMPACT' || col.key === 'IMPACT') && (
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
                            component="a"
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
};

export default ActionsList;