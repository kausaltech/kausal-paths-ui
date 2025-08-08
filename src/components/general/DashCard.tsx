import styled from '@emotion/styled';
import { Box } from '@mui/material';
import { ChevronCompactDown, ChevronCompactUp } from 'react-bootstrap-icons';

const CardWithState = styled.div`
  position: relative;
  border: 0;
  border-radius: 0;
  height: 170px;

  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 0.5rem 0.5rem 0.5rem 1.5rem;

  &.open,
  &.root {
    color: ${({ theme }) => theme.textColor.tertiary};
    background-color: ${({ theme }) => theme.graphColors.grey020};

    h2 {
      color: ${({ theme }) => theme.textColor.tertiary};
    }
  }

  &.inactive,
  &.closed {
    color: ${({ theme }) => theme.textColor.primary};
    background-color: ${({ theme }) => theme.cardBackground.primary};

    h2 {
      color: ${({ theme }) => theme.textColor.secondary};
    }
  }

  &.open.hovered {
    color: ${({ theme }) => theme.textColor.secondary};
    //border-color: ${(props) => props.color};

    h2 {
      color: ${({ theme }) => theme.textColor.secondary};
    }
  }

  &.active.hovered:after {
    display: none;
  }

  &.active.open,
  &.root {
    color: ${({ theme }) => theme.textColor.primary};
    background-color: ${({ theme }) => theme.cardBackground.primary};

    h2 {
      color: ${({ theme }) => theme.textColor.secondary};
    }
  }
`;

const CardFooter = styled.div<{ $active: boolean; $hovered: boolean; $state: 'open' | 'closed' }>`
  height: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${({ theme, $active, $hovered, $state }) => {
    if ($active) {
      return theme.cardBackground.secondary;
    }
    if ($state === 'open' && $hovered) {
      return theme.graphColors.grey020;
    }
    if ($state === 'open') {
      return theme.graphColors.grey030;
    }
    if ($hovered) {
      return theme.cardBackground.secondary;
    }
    return theme.graphColors.grey010;
  }};
`;

const CardContainer = styled.div`
  &.active.open,
  &.root {
    box-shadow: 3px 3px 12px rgba(33, 33, 33, 0.15);
  }
`;

type DashCardProps = {
  state: 'open' | 'closed';
  hovered: boolean;
  active: boolean;
  color: string;
  refProp: React.RefObject<HTMLDivElement | null>;
  children: React.ReactNode;
};

const DashCard = (props: DashCardProps) => {
  const { children, state, hovered, active, color, refProp } = props;

  return (
    <CardContainer>
      <CardWithState
        className={`card ${state} ${hovered ? 'hovered' : ''}  ${active ? 'active' : ''}`}
        color={color}
        ref={refProp}
      >
        {children}
      </CardWithState>
      <CardFooter $active={active} $hovered={hovered} $state={state}>
        {active ? <></> : <ChevronCompactDown />}
      </CardFooter>
    </CardContainer>
  );
};

export default DashCard;
