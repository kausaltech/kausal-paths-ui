import styled from 'styled-components';
import ActionComparisonGraph from 'components/graphs/ActionComparisonGraph';
import { Spinner } from 'reactstrap';

const ActionCount = styled.div`
  margin: 0 0 ${({ theme }) => theme.spaces.s100};
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
  background-color: rgba(255, 255, 255, 0.4);
  z-index: 1;
`;

const GraphCard = styled.div`
  position: relative;
  margin: 0 0 3rem;
  padding: 2rem;
  border-radius: 0;
  background-color: ${(props) => props.theme.themeColors.white};
  box-shadow: 3px 3px 12px rgba(33, 33, 33, 0.15);
`;

const ActionsComparison = ({
  actions,
  id,
  actionGroups,
  sortBy,
  sortAscending,
  refetching,
  displayYears,
}) => {
  // if we have efficiency limit set, remove actions over that limit

  const actionsWithImpact = actions.map((action) => {
    return {
      ...action,
      impact:
        action.impactMetric.forecastValues.find(
          (dataPoint) => dataPoint.year === displayYears[1]
        )?.value || 0,
    };
  });

  const sortActions = (a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];

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

  const impactName = `${sortedActions[0]?.impactMetric.name} ${displayYears[1]}`;
  const impactUnit = sortedActions[0]?.impactMetric.unit.htmlShort;

  return (
    <>
      <GraphCard id={id}>
        {refetching && (
          <LoadingOverlay>
            <Spinner color="primary" />
          </LoadingOverlay>
        )}
        <ActionComparisonGraph
          data={macData}
          impactName={impactName}
          impactUnit={impactUnit}
          actionIds={macData.ids}
          actionGroups={actionGroups}
        />
      </GraphCard>
    </>
  );
};

export default ActionsComparison;
