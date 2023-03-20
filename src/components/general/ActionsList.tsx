import styled from 'styled-components';
import ActionListCard from 'components/general/ActionListCard';
import { ActionWithEfficiency } from 'components/pages/ActionListPage';
import { useMemo } from 'react';

const ActionListList = styled.ul`
  margin: 0 0 2rem;
  padding: 0;
  list-style: none;
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

  return (
    <ActionListList>
      { sortedActions?.map((action) => (
        <ActionListCard
          key={action.id}
          action={action}
          displayType={displayType}
          displayYears={yearRange}
          refetching={refetching}
        />
      ))}
    </ActionListList>
  )
};

export default ActionsList;