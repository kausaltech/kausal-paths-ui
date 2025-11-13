import styled from '@emotion/styled';
import { ChevronCompactDown, ChevronCompactUp } from 'react-bootstrap-icons';

const CardWithState = styled.div`
  position: relative;
  flex: 1;
  border: 0;
  border-radius: 0;

  &.open {
    color: ${({ theme }) => theme.textColor.primary};
    background-color: ${({ theme }) => theme.graphColors.grey020};
    //border-bottom: 1px solid ${({ theme }) => theme.graphColors.grey030};
    h2 {
      color: ${({ theme }) => theme.textColor.primary};
    }
  }
   
  &.root {
    color: ${({ theme }) => theme.textColor.primary};
    background-color: ${({ theme }) => theme.cardBackground.primary};
    h2 {
      color: ${({ theme }) => theme.textColor.primary};
    }
  }

  &.inactive,
  &.closed {
    color: ${({ theme }) => theme.textColor.primary};
    background-color: ${({ theme }) => theme.cardBackground.primary};
    //border-bottom: 1px solid ${({ theme }) => theme.graphColors.grey005};
    h2 {
      color: ${({ theme }) => theme.textColor.primary};
    }
  }

  &.open.hovered {
    color: ${({ theme }) => theme.textColor.primary};
    //border-color: ${(props) => props.color};

    h2 {
      color: ${({ theme }) => theme.textColor.primary};
    }
  }

  &.active.hovered:after {
    display: none;
  }

  &.active.open,
  &.root {
    color: ${({ theme }) => theme.textColor.primary};
    background-color: ${({ theme }) => theme.cardBackground.primary};
    //border-bottom: 1px solid ${({ theme }) => theme.graphColors.grey020};
    h2 {
      color: ${({ theme }) => theme.textColor.primary};
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
      return theme.cardBackground.primary;
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
    // When all cards are closed
    return theme.graphColors.grey005;
  }};
`;

const CardContainer = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: stretch;
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
  interactive?: boolean;
};

const DashCard = (props: DashCardProps) => {
  const { children, state, hovered, active, color, refProp, interactive = true } = props;

  return (
    <CardContainer>
      <CardWithState
        className={`card ${state} ${hovered ? 'hovered' : ''}  ${active ? 'active' : ''}`}
        color={color}
        ref={refProp}
      >
        {children}
      </CardWithState>
      {interactive && (
        <CardFooter $active={active} $hovered={hovered} $state={state}>
          {active ? <ChevronCompactUp /> : <ChevronCompactDown />}
        </CardFooter>
      )}
    </CardContainer>
  );
};

export default DashCard;
