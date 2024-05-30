import styled from 'styled-components';
import MacGraph from 'components/graphs/MacGraph';
import Loader from 'components/common/Loader';

const ActionCount = styled.div`
  margin: 0 0 ${({ theme }) => theme.spaces.s100};
  color: ${({ theme }) => theme.themeColors.dark};
`;

const GraphCard = styled.div`
  position: relative;
  margin: 0 0 3rem;
  padding: 2rem;
  border-radius: 0;
  background-color: ${(props) => props.theme.themeColors.white};
  box-shadow: 3px 3px 12px rgba(33, 33, 33, 0.15);
`;

const ActionsMac = ({
  id,
  actions,
  actionEfficiencyPairs,
  t,
  actionGroups,
  sortBy,
  sortAscending,
  refetching,
}) => {
  // if we have efficiency limit set, remove actions over that limit
  const efficiencyLimit = actionEfficiencyPairs?.plotLimitEfficiency;
  // Remove actions without efficiency data
  const efficiencyActions = actions
    .filter((action) => action.cumulativeEfficiency)
    .filter((action) =>
      efficiencyLimit
        ? Math.abs(action.cumulativeEfficiency) <= efficiencyLimit
        : true
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

  //const efficiencyUnit = actionEfficiencyPairs.efficiencyUnit.htmlShort;
  const efficiencyName = sortedActions[0]?.cumulativeEfficiencyName;
  const efficiencyUnit = sortedActions[0]?.cumulativeEfficiencyUnit;

  const impactName = sortedActions[0]?.cumulativeImpactName;
  const impactUnit = sortedActions[0]?.cumulativeImpactUnit;

  const costName = sortedActions[0]?.cumulativeCostName;
  const costUnit = sortedActions[0]?.cumulativeCostUnit;

  return (
    <>
      {/* <ActionCount>
        {t('actions-count', { count: sortedActions.length})}
      </ActionCount> */}
      <GraphCard id={id}>
        {refetching && <Loader />}
        <MacGraph
          data={macData}
          impactName={impactName}
          impactUnit={impactUnit}
          efficiencyName={t('efficiency')}
          efficiencyUnit={efficiencyUnit}
          actionIds={macData.ids}
          costName={costName}
          costUnit={costUnit}
          actionGroups={actionGroups}
        />
      </GraphCard>
    </>
  );
};

export default ActionsMac;
