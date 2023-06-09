import styled from 'styled-components';
import ActionListCard from 'components/general/ActionListCard';
import { ActionWithEfficiency } from 'components/pages/ActionListPage';
import { useMemo } from 'react';

const ActionListList = styled.ul`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: stretch;
  justify-content: flex-start;
  align-content: stretch;

  margin: 0 0 2rem;
  padding: 0;
  list-style: none;

  > li {
    display: block;
    flex: 0 1 30%;
    margin: 1rem;
  }
`;

const ActionListCategory = styled.div`
  padding: 1rem;
  background-color: ${(props) => props.theme.graphColors.grey005};
`;

type ActionsListProps = {
  actions: ActionWithEfficiency[],
  displayType: 'displayTypeYearly',
  yearRange: [number, number],
  sortBy: string,
  sortAscending: boolean,
  refetching: boolean,
}

const ActionsList = (props: ActionsListProps) => {
  const { actions, displayType, yearRange, sortBy, sortAscending, refetching } = props;

  // possible sort: default, cumulativeImpact, cumulativeCost, cumulativeEfficiency

  // console.log("action list", actions);
  const sortActions = (a, b) => {
    if (sortBy === 'default') return sortAscending ? 0 : -1;
    // check if we are using efficiency
    const aValue = a[sortBy] ? a[sortBy] : a.impactMetric?.cumulativeForecastValue;
    const bValue = b[sortBy] ? b[sortBy] : b.impactMetric?.cumulativeForecastValue;
    return sortAscending ? aValue - bValue : bValue - aValue;
  }

  const sortedActions = useMemo(() => {
    return [...actions].sort(sortActions);
  }, [actions, sortBy, sortAscending]);

  const actionGroups = useMemo(() => {
    const groups = new Set();
    actions.forEach((action) => {
      if (action.group) groups.add(action.group.name);
    });
    return [...groups];
  }, [actions]);

  // console.log("action groups", actionGroups);
  return (
    <div>
      { actionGroups?.map((group) => (
        <div>
        <ActionListCategory>
          <h3>{ group }</h3>
        </ActionListCategory>
        <ActionListList>
      
        { sortedActions?.map((action) => (
          action.group?.name === group &&
          <ActionListCard
            key={action.id}
            action={action}
            displayType={displayType}
            displayYears={yearRange}
            refetching={refetching}
          />
        ))}
      </ActionListList>
      </div>
      ))}
    </div>
  )
};

export default ActionsList;