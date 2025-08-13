import React, { useMemo, useState } from 'react';
import { useTranslation } from 'next-i18next';
import { ChevronDown } from 'react-bootstrap-icons';
import {
  Box,
  Checkbox,
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
  useTheme,
} from '@mui/material';

import { ActionLink } from '@/common/links';
import {
  findActionEnabledParam,
  formatNumber,
  summarizeYearlyValuesBetween,
} from '@/common/preprocess';
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

const ActionsList = ({
  id,
  actions,
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

    if (actions.some((a) => typeof a.cumulativeCost === 'number')) {
      base.push({
        key: 'CUM_COST',
        label: `${t('net-cost')} ${yearRange[0]}–${yearRange[1]}`,
        sortKey: 'cumulativeCost',
        getValue: (a) => a.cumulativeCost ?? 0,
        getUnit: (a) => a.cumulativeCostUnit,
      });
    }

    if (actions.some((a) => typeof a.cumulativeEfficiency === 'number')) {
      base.push({
        key: 'CUM_EFFICIENCY',
        label: t('cost-efficiency'),
        sortKey: 'cumulativeEfficiency',
        getValue: (a) => a.cumulativeEfficiency ?? 0,
        getUnit: (a) => a.cumulativeEfficiencyUnit,
      });
    }
    return base;
  }, [actions, yearRange]);

  const sortedActions = useMemo(() => {
    return [...actions].sort((a, b) => {
      if (sortBy.key === 'STANDARD') return 0;
      const aVal = getValueForSorting(a, sortBy, yearRange);
      const bVal = getValueForSorting(b, sortBy, yearRange);
      return sortAscending ? aVal - bVal : bVal - aVal;
    });
  }, [actions, sortBy, sortAscending, yearRange]);

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
        acc[col.key] = actions.reduce((sum, a) => sum + col.getValue(a), 0);
        return acc;
      },
      {} as Record<SortActionsConfig['key'], number>
    );
  }, [actions, columns]);

  const COLSPAN = 4 + columns.length;
  const ROW_GAP = 0.5;
  
  return (
    <TableContainer
      id={id}
      sx={{ borderRadius: 1, overflow: 'hidden' }}
    >
      <Table sx={{ borderCollapse: 'collapse' }}>
        <TableHead >
          <TableRow 
            sx={{
              backgroundColor: theme.graphColors.blue010,
              '& .MuiTableCell-root': {
                py: 0.6,     
                lineHeight: 1.2,
              },
              '& .MuiTableSortLabel-root': {
                lineHeight: 1.2,
              },
            }}>
            <TableCell>{t('actions-group-type')}</TableCell>
            <TableCell>{t('action-name')}</TableCell>
            <TableCell>{t('included-in-scenario')}</TableCell>

            {columns.map((col) => (
              <TableCell key={col.key}>
                <TableSortLabel
                  active={sortBy.key === col.key}
                  direction={sortBy.key === col.key ? (sortAscending ? 'asc' : 'desc') : 'asc'}
                  onClick={() => handleSortClick(col.key)}
                >
                  {col.label}
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

            const rowBg = isOpen ? theme.palette.action.hover : 'transparent';

            return (
              <React.Fragment key={action.id}>
                <TableRow
                  sx={{
                    bgcolor: rowBg,
                    '& > .MuiTableCell-root': { borderBottom: isOpen ? 'none' : undefined },

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
                    <ActionLink action={action}>
                      <Typography
                        component="a"
                        variant="h6"
                        sx={{ color: 'inherit', textDecoration: 'none', cursor: 'pointer' }}
                      >
                        {action.name}
                      </Typography>
                    </ActionLink>
                  </TableCell>
                  <TableCell>
                    <Checkbox checked={isIncluded} disabled />
                  </TableCell>

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
                      display = formatNumber(val);          
                      unit = col.getUnit(action);            
                    }

                    return (
                      <TableCell key={col.key} sx={{ pb: 1, pt: 1 }}>
                        <Typography variant="h5" component="span">
                           {display}
                        </Typography>
                        {unit && (
                          <Typography variant="body2" component="span" sx={{ ml: 0.5 }}>
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
                                backgroundColor: val < 0 ? theme.palette.success.main : theme.palette.error.main,
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
                    >
                      <ChevronDown
                        size={20}
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
                    }}
                  >
                    <Collapse in={isOpen} timeout="auto" unmountOnExit>
                      <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Typography variant="body2">
                          {(action.goal || action.shortDescription)?.replace(/<[^>]+>/g, '')}
                        </Typography>
                        <ActionLink action={action}>
                          <Typography
                            component="a"
                            variant="h6"
                            sx={{
                              color: 'primary.main',
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
