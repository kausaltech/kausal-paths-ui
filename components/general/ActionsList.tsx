import styled from 'styled-components';
import ActionListCard from 'components/general/ActionListCard';

const ActionListList = styled.ul`
  margin: 0 0 2rem;
  padding: 0;
  list-style: none;
`;

const ActionsList = (props) => {
  const { actions, displayType, yearRange } = props;

  return (
    <ActionListList>
      { actions?.map((action) => (
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