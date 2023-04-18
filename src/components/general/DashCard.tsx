import {
  CardBody,
} from 'reactstrap';
import styled from 'styled-components';

const CardWithState = styled.div`
  position: relative;
  //border: 2px solid transparent;
  border: 0;
  border-top: 4px solid ${(props) => props.color};
  border-radius:  ${(props) => props.theme.cardBorderRadius};
  height: 140px;

  .card-body {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: .5rem;
  }

  &.open, &.root {
    color: ${(props) => props.theme.graphColors.grey050};
    background-color: ${(props) => props.theme.graphColors.grey000};
    
    h2 {
      color: ${(props) => props.theme.graphColors.grey050};
    }
  }

  &.inactive, &.closed {
    color: ${(props) => props.theme.graphColors.grey090};
    background-color: ${(props) => props.theme.graphColors.grey000};

    h2 {
      color: ${(props) => props.theme.graphColors.grey090};
    }
  }

  &.hovered {
    color: ${(props) => props.theme.graphColors.grey090};
    //border-color: ${(props) => props.color};
    
    h2 {
      color: ${(props) => props.theme.graphColors.grey070};
    }
  }

  &.active.open, &.root {
    position: relative;
    color: ${(props) => props.theme.graphColors.grey090};
    background-color: ${(props) => props.theme.themeColors.white};
    // border-radius: ${(props) => props.theme.cardBorderRadius} ${(props) => props.theme.cardBorderRadius} 0 0;
    height: 166px;
    box-shadow: 3px 3px 12px rgba(33,33,33,0.15);
  
    h2 {
      color: ${(props) => props.theme.graphColors.grey090};
    }
  }
`;

const DashCard = (props) => {
  const { children, state, hovered, active, color, refProp } = props;

  return (
    <CardWithState
      className={`card ${state} ${hovered ? 'hovered' : ''}  ${active ? 'active' : ''}`}
      color={color}
      ref={refProp}
    >
      <CardBody>
        { children }
      </CardBody>
    </CardWithState>
  );
};

export default DashCard;
