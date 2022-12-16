import styled from 'styled-components';
import MacGraph from 'components/graphs/MacGraph';
import { Spinner } from 'reactstrap';

const ActionCount = styled.div`
margin: -8rem 0 ${({ theme }) => theme.spaces.s100};
color: ${({ theme }) => theme.themeColors.white};
`;

const GraphCard = styled.div` 
  margin: 0 0 3rem;
  padding: 2rem;
  border-radius:  ${(props) => props.theme.cardBorderRadius};
  background-color: ${(props) => props.disabled ? props.theme.themeColors.light : props.theme.themeColors.white};
  box-shadow: 3px 3px 12px rgba(33,33,33,0.15);
`;

const ActionsMac = (props) => {
  const { actions, actionEfficiencyPairs, t, actionGroups, sortBy, sortAscending, refetching } = props;

  // Remove actions without efficiency data
  const efficiencyActions = actions.filter((action) => action.cumulativeEfficiency);
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
  const impactUnit = actionEfficiencyPairs.impactNode.unit.short; 

  const costName = actionEfficiencyPairs.costNode.name;
  const costUnit = actionEfficiencyPairs.costNode.unit.short; 

  return (
    <>
      <ActionCount>
        {t('actions-count', { count: sortedActions.length})}
      </ActionCount>
      <GraphCard disabled={refetching}>
        { refetching && <span><Spinner color="primary" /></span> }
        <MacGraph
          data={macData}
          impactName={`${impactName} impact`}
          impactUnit={impactUnit}
          efficiencyName={`${costName} efficiency`}
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
