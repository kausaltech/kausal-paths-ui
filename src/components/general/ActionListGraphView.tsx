import { useQuery } from '@apollo/client';
import { Container } from '@mui/material';

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
  activeEfficiency: number;
  instanceActionGroups: ActionListQuery['instance']['actionGroups'];
  sortBy: SortActionsConfig;
  sortAscending: boolean;
  refetching: boolean;
  yearRange: [number, number];
};

export function ActionListGraphView({
  usableActions,
  activeEfficiency,
  instanceActionGroups,
  sortBy,
  sortAscending,
  refetching,
  yearRange,
}: ActionListGraphViewProps) {
  const { data, loading, error } = useQuery<ImpactOverviewsQuery>(GET_IMPACT_OVERVIEWS, {
    fetchPolicy: 'cache-and-network',
  });

  if (error) {
    return (
      <Container fixed maxWidth="xl" sx={{ pt: 5 }}>
        <GraphQLError error={error} />
      </Container>
    );
  }

  const selectedOverview = data?.impactOverviews[activeEfficiency];
  const graphType = selectedOverview?.graphType;

  switch (graphType) {
    case 'cost_efficiency':
      return (
        <ActionsMac
          id="efficiency-view"
          actions={usableActions}
          impactOverviews={selectedOverview}
          actionGroups={instanceActionGroups}
          sortBy={sortBy.sortKey}
          sortAscending={sortAscending}
          refetching={refetching}
        />
      );
    case 'cost_benefit':
      return <CostBenefitAnalysis data={selectedOverview} isLoading={loading} />;
    case 'return_on_investment':
      return <ReturnOnInvestment data={selectedOverview} isLoading={loading} />;
    case 'simple_effect':
      return <SimpleEffect data={selectedOverview} isLoading={loading} />;
    default:
      return (
        <ActionsComparison
          id="comparison-view"
          actions={usableActions}
          actionGroups={instanceActionGroups}
          sortBy={sortBy.sortKey}
          sortAscending={sortAscending}
          refetching={refetching}
          displayYears={yearRange}
        />
      );
  }
}
