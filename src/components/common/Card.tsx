import { forwardRef } from 'react';
import { Card as ReactStrapCard, type CardProps } from 'reactstrap';
import styled from 'styled-components';

const StyledCard = styled(ReactStrapCard)`
  background-color: ${({ theme }) => theme.cardBackground};
  border-radius: ${({ theme }) => theme.cardBorderRadius};
  border: none;
`;

/**
 * A simple wrapper around Reactstrap's Card to support themed styles
 */
export const Card = forwardRef((props: CardProps, ref) => (
  <StyledCard {...props} innerRef={ref}>
    {props.children}
  </StyledCard>
));

Card.displayName = 'Card';
