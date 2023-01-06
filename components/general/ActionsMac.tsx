import styled from 'styled-components';
import MacGraph from 'components/graphs/MacGraph';
import { Spinner } from 'reactstrap';

const ActionCount = styled.div`
margin: -8rem 0 ${({ theme }) => theme.spaces.s100};
color: ${({ theme }) => theme.themeColors.white};
`;

const LoadingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(255,255,255,0.4);
  z-index: 1;
`;

const GraphCard = styled.div` 
  position: relative;
  margin: 0 0 3rem;
  padding: 2rem;
  border-radius:  ${(props) => props.theme.cardBorderRadius};
  background-color: ${(props) => props.theme.themeColors.white};
  box-shadow: 3px 3px 12px rgba(33,33,33,0.15);
`;

const ActionsMac = (props) => {
  const { actions, actionEfficiencyPairs, t, actionGroups, sortBy, sortAscending, refetching } = props;

  // if we have efficiency limit set, remove actions over that limit
  const efficiencyLimit = actionEfficiencyPairs?.plotLimitEfficiency;
  // Remove actions without efficiency data
  const efficiencyActions = actions
    .filter((action) => action.cumulativeEfficiency)
    .filter((action) => efficiencyLimit ? Math.abs(action.cumulativeEfficiency) <= efficiencyLimit : true);

  const sortActions = (a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];

    return a.cumulativeImpact < 0 ? -1 : b.cumulativeImpact < 0 ? 0 : sortAscending ? aValue - bValue : bValue - aValue
  }

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

  const efficiencyUnit = actionEfficiencyPairs.efficiencyUnit.short;

  const impactName = actionEfficiencyPairs.impactNode.name; 
  const impactUnit = sortedActions[0]?.cumulativeImpactUnit; 

  const costName = actionEfficiencyPairs.costNode.name;
  const costUnit = sortedActions[0]?.cumulativeCostUnit;

  return (
    <>
      <ActionCount>
        {t('actions-count', { count: sortedActions.length})}
      </ActionCount>
      <GraphCard>
        { refetching && <LoadingOverlay><Spinner color="primary" /></LoadingOverlay> }
        <MacGraph
          data={macData}
          impactName={`${impactName} ${t('mac-axis-impact')}`}
          impactUnit={impactUnit}
          efficiencyName={`${costName} ${t('efficiency')}`}
          efficiencyUnit={efficiencyUnit}
          actionIds={macData.ids}
          costUnit={costUnit}
          actionGroups={actionGroups}
        />
      </GraphCard>
    </>
  )
};

export default ActionsMac;
