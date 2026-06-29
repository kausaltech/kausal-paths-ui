import { useMemo } from 'react';

import { Box, CircularProgress, Container } from '@mui/material';

import { useTranslations } from 'next-intl';

import {
  type ActionListQuery,
  type ImpactOverviewDetailFragment,
} from '@/common/__generated__/graphql';
import type { ActionWithEfficiency, SortActionsConfig } from '@/types/actions.types';
import ActionsComparison from './ActionsComparison';
import { CostBenefitAnalysis } from './CostBenefitAnalysis';
import EfficiencyGraph from './EfficiencyGraph';
import { ReturnOnInvestment } from './ReturnOnInvestment';
import { SimpleEffect } from './SimpleEffect';
import { StackedRawImpact } from './StackedRawImpact';
import { WedgeDiagram } from './WedgeDiagram';

type ActionListGraphViewProps = {
  usableActions: ActionWithEfficiency[];
  visibleActionIds: Set<string>;
  activeOverviewDetail: ImpactOverviewDetailFragment | null;
  /** True while the active overview detail is being fetched without cached data. */
  detailPending: boolean;
  instanceActionGroups: ActionListQuery['instance']['actionGroups'];
  sortBy: SortActionsConfig;
  sortAscending: boolean;
  refetching: boolean;
  yearRange: [number, number];
};

export function ActionListGraphView({
  usableActions,
  visibleActionIds,
  activeOverviewDetail,
  detailPending,
  instanceActionGroups,
  sortBy,
  sortAscending,
  refetching,
  yearRange,
}: ActionListGraphViewProps) {
  const t = useTranslations('common');

  const graphType = activeOverviewDetail?.graphType;

  const filteredOverview = useMemo(
    () =>
      activeOverviewDetail
        ? {
            ...activeOverviewDetail,
            actions: activeOverviewDetail.actions.filter((a) => visibleActionIds.has(a.action.id)),
            // Keep scenario entries (floor/ceiling) regardless of the action-id
            // filter so the wedge always has its bounding lines.
            wedge:
              activeOverviewDetail.wedge?.filter(
                (w) => w.isScenario || visibleActionIds.has(w.id)
              ) ?? null,
          }
        : undefined,
    [activeOverviewDetail, visibleActionIds]
  );
  const visibleUsableActions = useMemo(
    () => usableActions.filter((a) => visibleActionIds.has(a.id)),
    [usableActions, visibleActionIds]
  );
  const actionsInOverview = useMemo(() => {
    const overviewActionIds = new Set(filteredOverview?.actions.map((a) => a.action.id) ?? []);
    return visibleUsableActions.filter((a) => overviewActionIds.has(a.id));
  }, [filteredOverview, visibleUsableActions]);

  // Avoid flashing the default (ActionsComparison) graph while the detail loads
  if (detailPending) {
    return (
      <Box
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

  switch (graphType) {
    case 'cost_efficiency': {
      return (
        <EfficiencyGraph
          id="efficiency-view"
          actions={actionsInOverview}
          impactOverviews={filteredOverview}
          actionGroups={instanceActionGroups}
          sortBy={sortBy.sortKey}
          sortAscending={sortAscending}
          refetching={refetching}
        />
      );
    }
    case 'cost_benefit':
      return <CostBenefitAnalysis data={filteredOverview} isLoading={detailPending} />;
    case 'return_on_investment':
      return <ReturnOnInvestment data={filteredOverview} isLoading={detailPending} />;
    case 'simple_effect':
      return (
        <SimpleEffect
          data={filteredOverview}
          visibleActions={visibleUsableActions}
          sortBy={sortBy}
          sortAscending={sortAscending}
          isLoading={detailPending}
        />
      );
    case 'stacked_raw_impact':
      return (
        <StackedRawImpact
          data={filteredOverview}
          visibleActions={visibleUsableActions}
          sortBy={sortBy}
          sortAscending={sortAscending}
          isLoading={detailPending}
          yearRange={yearRange}
        />
      );
    case 'wedge_diagram':
      return (
        <WedgeDiagram
          data={filteredOverview}
          actionLookup={visibleUsableActions}
          isLoading={detailPending}
          yearRange={yearRange}
        />
      );
    default:
      return (
        <ActionsComparison
          id="comparison-view"
          actions={visibleUsableActions}
          actionGroups={instanceActionGroups}
          sortBy={sortBy.sortKey}
          sortAscending={sortAscending}
          refetching={refetching}
          displayYears={yearRange}
        />
      );
  }
}
