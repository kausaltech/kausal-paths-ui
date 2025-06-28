import { ChartWrapper } from 'components/charts/ChartWrapper';
import MacGraph from 'components/graphs/MacGraph';

const ActionsMac = ({
  id,
  actions,
  impactOverviews,
  t,
  actionGroups,
  sortBy,
  sortAscending,
  refetching,
}) => {
  // if we have efficiency limit set, remove actions over that limit
  const efficiencyLimit = impactOverviews?.plotLimitForIndicator;
  // Remove actions without efficiency data
  const efficiencyActions = actions
    .filter((action) => action.cumulativeEfficiency)
    .filter((action) =>
      efficiencyLimit ? Math.abs(action.cumulativeEfficiency) <= efficiencyLimit : true
    );

  const sortActions = (a, b) => {
    const aValue = a[sortBy];
    const bValue = b[sortBy];

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
    colors: sortedActions.map((action) => action.color || action.group?.color),
    groups: sortedActions.map((action) => action.group?.id),
    cost: sortedActions.map((action) => action.cumulativeCost),
    efficiency: sortedActions.map((action) => action.cumulativeEfficiency),
    impact: sortedActions.map((action) => action.cumulativeImpact),
  };

  //const indicatorUnit = impactOverviews.indicatorUnit.htmlShort;
  const efficiencyName = sortedActions[0]?.cumulativeEfficiencyName;
  const indicatorUnit = sortedActions[0]?.cumulativeEfficiencyUnit;

  const impactName = sortedActions[0]?.cumulativeImpactName;
  const effectUnit = sortedActions[0]?.cumulativeImpactUnit;

  const costName = sortedActions[0]?.cumulativeCostName;
  const costUnit = sortedActions[0]?.cumulativeCostUnit;

  return (
    <ChartWrapper id={id} isLoading={refetching}>
      <MacGraph
        data={macData}
        impactName={impactName}
        effectUnit={effectUnit}
        efficiencyName={t('efficiency')}
        indicatorUnit={indicatorUnit}
        actionIds={macData.ids}
        costName={costName}
        costUnit={costUnit}
        actionGroups={actionGroups}
      />
    </ChartWrapper>
  );
};

export default ActionsMac;
