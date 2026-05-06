import { useMemo } from 'react';

import { Box, CircularProgress, Container } from '@mui/material';

import { useQuery } from '@apollo/client/react';
import { useTranslations } from 'next-intl';

import { type ActionListQuery, type ImpactOverviewsQuery } from '@/common/__generated__/graphql';
import GraphQLError from '@/components/common/GraphQLError';
import { GET_IMPACT_OVERVIEWS } from '@/queries/getImpactOverviews';
import type { ActionWithEfficiency, SortActionsConfig } from '@/types/actions.types';
import ActionsComparison from './ActionsComparison';
import ActionsMac from './ActionsMac';
import { CostBenefitAnalysis } from './CostBenefitAnalysis';
import { ReturnOnInvestment } from './ReturnOnInvestment';
import { SimpleEffect } from './SimpleEffect';

type ActionListGraphViewProps = {
  usableActions: ActionWithEfficiency[];
  visibleActionIds: Set<string>;
  activeEfficiency: number;
  instanceActionGroups: ActionListQuery['instance']['actionGroups'];
  sortBy: SortActionsConfig;
  sortAscending: boolean;
  refetching: boolean;
  yearRange: [number, number];
};

export function ActionListGraphView({
  usableActions,
  visibleActionIds,
  activeEfficiency,
  instanceActionGroups,
  sortBy,
  sortAscending,
  refetching,
  yearRange,
}: ActionListGraphViewProps) {
  const t = useTranslations('common');
  const { data, loading, error } = useQuery<ImpactOverviewsQuery>(GET_IMPACT_OVERVIEWS, {
    fetchPolicy: 'cache-and-network',
  });

  const selectedOverview = data?.impactOverviews[activeEfficiency];
  const graphType = selectedOverview?.graphType;

  const filteredOverview = useMemo(
    () =>
      selectedOverview
        ? {
            ...selectedOverview,
            actions: selectedOverview.actions.filter((a) => visibleActionIds.has(a.action.id)),
          }
        : undefined,
    [selectedOverview, visibleActionIds]
  );
  const visibleUsableActions = useMemo(
    () => usableActions.filter((a) => visibleActionIds.has(a.id)),
    [usableActions, visibleActionIds]
  );
  const actionsInOverview = useMemo(() => {
    const overviewActionIds = new Set(filteredOverview?.actions.map((a) => a.action.id) ?? []);
    return visibleUsableActions.filter((a) => overviewActionIds.has(a.id));
  }, [filteredOverview, visibleUsableActions]);

  if (error) {
    return (
      <Container fixed maxWidth="xl" sx={{ pt: 5 }}>
        <GraphQLError error={error} />
      </Container>
    );
  }

  // Avoid flashing the default (ActionsComparison) graph while the query is loading
  if (loading && !data) {
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
        <ActionsMac
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
      return <CostBenefitAnalysis data={filteredOverview} isLoading={loading} />;
    case 'return_on_investment':
      return <ReturnOnInvestment data={filteredOverview} isLoading={loading} />;
    case 'simple_effect':
      return (
        <SimpleEffect
          data={filteredOverview}
          visibleActions={visibleUsableActions}
          sortBy={sortBy}
          sortAscending={sortAscending}
          isLoading={loading}
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
