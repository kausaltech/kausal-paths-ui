import styled from 'styled-components';
import ActionListCard from 'components/general/ActionListCard';

const ActionListList = styled.ul`
  margin: -8rem 0 2rem;
  padding: 0;
  list-style: none;
`;

const ActionsList = (props) => {
  const { actions, displayType, yearRange } = props;
  console.log("actionlist props", props);
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