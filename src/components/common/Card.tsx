import { forwardRef } from 'react';

import styled from '@emotion/styled';
import { type CardProps, Card as ReactStrapCard } from 'reactstrap';

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
