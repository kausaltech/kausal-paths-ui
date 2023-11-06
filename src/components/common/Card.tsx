import { Card as ReactStrapCard, CardProps } from 'reactstrap';
import styled from 'styled-components';

const StyledCard = styled(ReactStrapCard)`
  background-color: ${({ theme }) => theme.cardBackground};
  border-radius: ${({ theme }) => theme.cardBorderRadius};
  border: none;
`;

/**
 * A simple wrapper around Reactstrap's Card to support themed styles
 */
export const Card = (props: CardProps) => <StyledCard {...props} />;
