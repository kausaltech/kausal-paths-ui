import {
  Card, CardBody
} from 'reactstrap';
import styled from 'styled-components';

const CardWithState = styled(Card)`
  position: relative;
  border: 2px solid transparent;

  .card-body {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  &.inactive {
    background-color: ${(props) => props.theme.themeColors.white};
  }

  &.hovered {
    border: 2px solid ${(props) => props.theme.graphColors.grey050};
  }

  &.active {
    border: 2px solid ${(props) => props.theme.graphColors.grey070};
  }
`;

const DashCard = (props) => {
  const { children, state, hovered, active } = props;
  return (
    <CardWithState
      className={`mb-4 ${state} ${hovered ? 'hovered' : ''}  ${active ? 'active' : ''}`}
    >
      <CardBody>
        { children }
      </CardBody>
    </CardWithState>
  );
};

export default DashCard;
