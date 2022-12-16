import styled from 'styled-components';
import ActionListCard from 'components/general/ActionListCard';

const ActionListList = styled.ul`
  margin: 0 0 2rem;
  padding: 0;
  list-style: none;
`;

const ActionsList = (props) => {
  const { actions, displayType, yearRange, sortBy, sortAscending } = props;

  const sortActions = (a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];

    return sortAscending ? aValue - bValue : bValue - aValue;
  }

  const sortedActions = actions.sort(sortActions);

  return (
    <ActionListList>
      { sortedActions?.map((action) => (
        <ActionListCard
          key={action.id}
          action={action}
          displayType={displayType}
          displayYears={yearRange}
          level={action.decisionLevel}
        />
      ))}
    </ActionListList>
  )
};

export default ActionsList;