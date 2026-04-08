import { useReactiveVar } from '@apollo/client';
import { useTranslations } from 'next-intl';

import { type ActionListQuery, type ImpactOverviewsQuery } from '@/common/__generated__/graphql';
import { yearRangeVar } from '@/common/cache';
import { ChartWrapper } from '@/components/charts/ChartWrapper';
import MacGraph from '@/components/graphs/MacGraph';
import type { ActionWithEfficiency, SortActionsConfig } from '@/types/actions.types';

type ActionsMacProps = {
  id?: string;
  actions: ActionWithEfficiency[];
  impactOverviews: ImpactOverviewsQuery['impactOverviews'][number] | undefined;
  actionGroups: ActionListQuery['instance']['actionGroups'];
  sortBy: SortActionsConfig['sortKey'];
  sortAscending: boolean;
  refetching: boolean;
};

const ActionsMac = ({
  id,
  actions,
  impactOverviews: _impactOverviews,
  actionGroups,
  sortBy,
  sortAscending,
  refetching,
}: ActionsMacProps) => {
  const t = useTranslations('common');
  const [startYear, endYear] = useReactiveVar(yearRangeVar);
  // efficiencyCap is embedded per-action from useActionListData (GET_ACTION_LIST)
  // Remove actions without efficiency data, and those exceeding their own cap
  const efficiencyActions = actions
    .filter(
      (
        action
      ): action is ActionWithEfficiency & {
        cumulativeEfficiency: number;
        cumulativeImpact: number;
        cumulativeCost: number;
      } =>
        action.cumulativeEfficiency != null &&
        action.cumulativeImpact != null &&
        action.cumulativeCost != null
    )
    .filter((action) =>
      action.efficiencyCap ? Math.abs(action.cumulativeEfficiency) <= action.efficiencyCap : true
    );

  const sortActions = (
    a: (typeof efficiencyActions)[number],
    b: (typeof efficiencyActions)[number]
  ) => {
    const aValue = sortBy ? (a[sortBy] as number) : 0;
    const bValue = sortBy ? (b[sortBy] as number) : 0;

    return a.cumulativeImpact < 0
      ? -1
      : b.cumulativeImpact < 0
        ? 0
        : sortAscending
          ? aValue - bValue
          : bValue - aValue;
  };

  const sortedActions = [...efficiencyActions].sort(sortActions);

  const macData = {
    ids: sortedActions.map((action) => action.id),
    actions: sortedActions.map((action) => action.name),
    colors: sortedActions.map((action) => action.color ?? action.group?.color ?? ''),
    groups: sortedActions.map((action) => action.group?.id ?? ''),
    cost: sortedActions.map((action) => action.cumulativeCost),
    efficiency: sortedActions.map((action) => action.cumulativeEfficiency),
    impact: sortedActions.map((action) => action.cumulativeImpact),
  };

  const indicatorUnit = sortedActions[0]?.cumulativeEfficiencyUnit;
  const impactName = sortedActions[0]?.cumulativeImpactName;
  const effectUnit = sortedActions[0]?.cumulativeImpactUnit;
  const costName = sortedActions[0]?.cumulativeCostName;
  const costUnit = sortedActions[0]?.cumulativeCostUnit;

  const title = `${_impactOverviews?.label} (${startYear} - ${endYear})`;
  const subtitle = '-';

  return (
    <ChartWrapper id={id} isLoading={refetching} title={title} subtitle={subtitle}>
      <MacGraph
        data={macData}
        impactName={impactName ?? ''}
        effectUnit={effectUnit ?? ''}
        efficiencyName={t('efficiency')}
        indicatorUnit={indicatorUnit ?? ''}
        actionIds={macData.ids}
        costName={costName ?? ''}
        costUnit={costUnit ?? ''}
        actionGroups={actionGroups}
      />
    </ChartWrapper>
  );
};

export default ActionsMac;
