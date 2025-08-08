import styled from '@emotion/styled';
import { CardBody } from 'reactstrap';

const CardWithState = styled.div`
  position: relative;
  border: 0;
  border-radius: 0;
  height: 170px;

  .card-body {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 0.5rem 0.5rem 0.5rem 1.5rem;
  }

  &.open,
  &.root {
    color: ${({ theme }) => theme.textColor.tertiary};
    background-color: ${({ theme }) => theme.cardBackground.secondary};

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
    position: relative;
    color: ${({ theme }) => theme.textColor.primary};
    background-color: ${({ theme }) => theme.cardBackground.primary};
    height: 206px;
    padding-bottom: 36px;
    box-shadow: 3px 3px 12px rgba(33, 33, 33, 0.15);

    h2 {
      color: ${({ theme }) => theme.textColor.secondary};
    }
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
    <CardWithState
      className={`card ${state} ${hovered ? 'hovered' : ''}  ${active ? 'active' : ''}`}
      color={color}
      ref={refProp}
    >
      <CardBody>{children}</CardBody>
    </CardWithState>
  );
};

export default DashCard;
