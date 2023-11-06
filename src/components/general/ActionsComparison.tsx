import styled from 'styled-components';
import { SortActionsConfig } from 'types/actions.types';
import ActionComparisonGraph from 'components/graphs/ActionComparisonGraph';
import Loader from 'components/common/Loader';

const GraphCard = styled.div`
  position: relative;
  margin: 0 0 3rem;
  padding: 2rem;
  border-radius: 0;
  background-color: ${(props) => props.theme.themeColors.white};
  box-shadow: 3px 3px 12px rgba(33, 33, 33, 0.15);
`;

type Props = {
  sortBy?: SortActionsConfig['sortKey'];

  // TODO: Type props
  actions;
  id;
  actionGroups;
  sortAscending;
  refetching;
  displayYears;
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
    const aValue = a[sortBy];
    const bValue = b[sortBy];

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
        {refetching && <Loader />}
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
