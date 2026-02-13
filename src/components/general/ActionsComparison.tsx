import { useTranslation } from 'next-i18next';

import type { ActionListQuery } from '@/common/__generated__/graphql';
import { ChartWrapper } from '@/components/charts/ChartWrapper';
import ActionComparisonGraph from '@/components/graphs/ActionComparisonGraph';
import type { ActionWithEfficiency, SortActionsConfig } from '@/types/actions.types';

type Props = {
  sortBy?: SortActionsConfig['sortKey'];

  // TODO: Type props
  actions: ActionWithEfficiency[];
  id: string;
  actionGroups: ActionListQuery['instance']['actionGroups'];
  sortAscending: boolean;
  refetching: boolean;
  displayYears: [number, number];
};

const ActionsComparison = ({
  actions,
  id,
  actionGroups,
  sortBy = 'cumulativeImpact',
  sortAscending,
  refetching,
  displayYears,
}: Props) => {
  // if we have efficiency limit set, remove actions over that limit

  const { t } = useTranslation();
  const actionsWithImpact = actions.map((action) => {
    return {
      ...action,
      impact:
        action.impactMetric?.forecastValues.find((dataPoint) => dataPoint.year === displayYears[1])
          ?.value || 0,
    };
  });

  const sortActions = (a: ActionWithEfficiency, b: ActionWithEfficiency) => {
    const aValue = Number(a[sortBy]) || 0;
    const bValue = Number(b[sortBy]) || 0;

    return sortAscending ? aValue - bValue : bValue - aValue;
  };

  const sortedActions = [...actionsWithImpact].sort(sortActions);

  const macData = {
    ids: sortedActions.map((action) => action.id),
    actions: sortedActions.map((action) => action.name),
    colors: sortedActions.map((action) => action.color || action.group?.color),
    groups: sortedActions.map((action) => action.group?.id),
    impact: sortedActions.map((action) => action.impact),
  };

  // FIXME: Running impact metric name through translation as a quickfix until they are translated in the backend
  const impactName = sortedActions[0]?.impactMetric?.name
    ? // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument -- dynamic key from backend
      `${String(t(sortedActions[0].impactMetric.name as any))} ${displayYears[1]}`
    : '';
  const effectUnit = sortedActions[0]?.impactMetric?.unit?.htmlShort;

  return (
    <ChartWrapper id={id} isLoading={refetching}>
      <ActionComparisonGraph
        data={macData}
        impactName={impactName}
        effectUnit={effectUnit}
        actionIds={macData.ids}
        actionGroups={actionGroups}
      />
    </ChartWrapper>
  );
};

export default ActionsComparison;
