import React, { useMemo, useState } from 'react';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
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

interface ActionsListProps {
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
}

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

const ActionsList: React.FC<ActionsListProps> = ({
  id,
  actions,
  yearRange,
  sortBy,
  sortAscending,
  refetching,
  onChangeSort,
  onToggleSortDirection,
}) => {
  const theme = useTheme();
  const [openRows, setOpenRows] = useState<Record<string, boolean>>({});

  // Calculate each action's impacts for percentages
  const impacts = useMemo(
    () =>
      actions.map((action) => {
        const metric = action.impactMetric;
        if (!metric) {
          return { id: action.id, yearly: action.impactOnTargetYear, cumulative: 0 };
        }
        const yearly = action.impactOnTargetYear;
        const cumulative = summarizeYearlyValuesBetween(metric, yearRange[0], yearRange[1]);
        return { id: action.id, yearly, cumulative };
      }),
    [actions, yearRange]
  );

  // Compute totals for percentages
  const totals = useMemo(
    () =>
      impacts.reduce(
        (acc, cur) => ({
          totalYearly: acc.totalYearly + cur.yearly,
          totalCumulative: acc.totalCumulative + cur.cumulative,
        }),
        { totalYearly: 0, totalCumulative: 0 }
      ),
    [impacts]
  );

  const sortedActions = useMemo(() => {
    return [...actions].sort((a, b) => {
      if (sortBy.key === 'STANDARD') return 0;
      const aVal = getValueForSorting(a, sortBy, yearRange);
      const bVal = getValueForSorting(b, sortBy, yearRange);
      return sortAscending ? aVal - bVal : bVal - aVal;
    });
  }, [actions, sortBy.key, sortAscending, yearRange]);

  const handleSortClick = (key: SortActionsConfig['key']) => {
    if (sortBy.key === key) {
      onToggleSortDirection?.();
    } else {
      onChangeSort?.(key);
    }
  };

  const renderActionRow = (action: ActionWithEfficiency, rowIndex: number) => {
    const isOpen = Boolean(openRows[action.id]);
    const enabledParam = findActionEnabledParam(action.parameters);
    const isIncluded = !refetching && (enabledParam?.boolValue ?? false);

    const imp = impacts.find((i) => i.id === action.id) || { yearly: 0, cumulative: 0 };
    const { yearly, cumulative } = imp;

    const percentYearly = totals.totalYearly ? (yearly / totals.totalYearly) * 100 : 0;
    const percentTotal = totals.totalCumulative ? (cumulative / totals.totalCumulative) * 100 : 0;

    const groupColor = action.group?.color;

    return (
      <React.Fragment key={action.id}>
        <TableRow
          sx={{
            bgcolor: rowIndex % 2 === 1 ? theme.graphColors.grey010 : 'transparent',
          }}
        >
          <TableCell
            sx={{
              pl: 1,
              borderLeft: `6px solid ${groupColor ?? theme.graphColors.grey090}`,
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
          <TableCell sx={{ pb: 1, pt: 1 }}>
            <Typography variant="h5" component="span">
              {formatNumber(cumulative)}
            </Typography>
            <Typography variant="body2" component="span" sx={{ ml: 0.5 }}>
              {action.impactMetric?.unit?.htmlShort}
            </Typography>
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
                  width: `${percentTotal}%`,
                  height: '100%',
                  backgroundColor: theme.palette.success.main,
                  position: 'absolute',
                  left: 0,
                  top: 0,
                }}
              />
            </Box>
          </TableCell>
          <TableCell sx={{ pb: 1, pt: 1 }}>
            <Typography variant="h5" component="span">
              {formatNumber(yearly)}
            </Typography>
            <Typography variant="body2" component="span" sx={{ ml: 0.5 }}>
              {action.impactMetric?.unit?.htmlShort}
            </Typography>
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
                  width: `${percentYearly}%`,
                  height: '100%',
                  backgroundColor: theme.palette.success.main,
                  position: 'absolute',
                  left: 0,
                  top: 0,
                }}
              />
            </Box>
          </TableCell>
          <TableCell>
            <IconButton
              size="small"
              onClick={() =>
                setOpenRows((prev) => ({
                  ...prev,
                  [action.id]: !prev[action.id],
                }))
              }
            >
              <ExpandMoreIcon
                sx={{
                  transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s',
                }}
              />
            </IconButton>
          </TableCell>
        </TableRow>
        <TableRow sx={{ mt: '-8px' }}>
          <TableCell
            colSpan={6}
            sx={{
              p: 0,
              borderBottom: 'none',
              borderLeft: `6px solid ${groupColor ?? theme.graphColors.grey090}`,
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
                    How is this calculated? &gt;
                  </Typography>
                </ActionLink>
              </Box>
            </Collapse>
          </TableCell>
        </TableRow>
      </React.Fragment>
    );
  };

  return (
    <TableContainer
      id={id}
      sx={{ borderRadius: 1, overflow: 'hidden', boxShadow: theme.shadows[1] }}
    >
      <Table sx={{ borderCollapse: 'collapse' }}>
        <TableHead>
          <TableRow sx={{ backgroundColor: theme.graphColors.blue010 }}>
            <TableCell>Type</TableCell>
            <TableCell>Name</TableCell>
            <TableCell>Included in scenario</TableCell>
            <TableCell>
              <TableSortLabel
                active={sortBy.key === 'CUM_IMPACT'}
                direction={sortBy.key === 'CUM_IMPACT' ? (sortAscending ? 'asc' : 'desc') : 'asc'}
                onClick={() => handleSortClick('CUM_IMPACT')}
              >
                Total impact {yearRange[0]}–{yearRange[1]}
              </TableSortLabel>
            </TableCell>
            <TableCell>Annual impact {yearRange[1]}</TableCell>
            <TableCell />
          </TableRow>
        </TableHead>
        <TableBody>{sortedActions.map((a, i) => renderActionRow(a, i))}</TableBody>
      </Table>
    </TableContainer>
  );
};

export default ActionsList;
