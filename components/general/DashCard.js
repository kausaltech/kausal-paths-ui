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
    color: ${(props) => props.theme.graphColors.grey050};
    background-color: ${(props) => props.theme.themeColors.light};

    h2 {
      color: ${(props) => props.theme.graphColors.grey050};
    }
  }

  &.hovered {
    color: ${(props) => props.theme.graphColors.grey090};
    background-color: ${(props) => props.theme.themeColors.white};
    border-color: ${(props) => props.color};
    
    h2 {
      color: ${(props) => props.theme.graphColors.grey070};
    }
  }

  &.active {
    position: relative;
    color: ${(props) => props.theme.graphColors.grey090};
    background-color: ${(props) => props.theme.themeColors.white};
    border-color: ${(props) => props.color};
    border-bottom: 0;
    border-bottom-right-radius: 0;
    border-bottom-left-radius: 0;

    &::after {
      position: absolute;
      z-index: 500;
      content: '';
      width: 100%;

      background-color: #fff;
    }
  
    h2 {
      color: ${(props) => props.theme.graphColors.grey090};
    }
  }
`;

const DashCard = (props) => {
  const { children, state, hovered, active, color } = props;
  return (
    <CardWithState
      className={`${state} ${hovered ? 'hovered' : ''}  ${active ? 'active' : ''}`}
      color={color}
    >
      <CardBody>
        { children }
      </CardBody>
    </CardWithState>
  );
};

export default DashCard;
