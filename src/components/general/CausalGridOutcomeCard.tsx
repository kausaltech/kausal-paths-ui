import { forwardRef } from 'react';

import { css } from '@emotion/react';
import styled from '@emotion/styled';
import { Card } from '@mui/material';
import { CardBody, CardTitle } from 'reactstrap';

type Props = {
  title: string;
  onClick: () => void;
  selected?: boolean;
};

const StyledCard = styled(Card)<{ $selected?: boolean }>`
  cursor: ${({ $selected }) => ($selected ? 'default' : 'pointer')};
  min-width: 10rem;
  box-shadow: 3px 3px 12px rgba(33, 33, 33, 0.15);
  position: relative;
  overflow: hidden;

  &::after {
    width: 100%;
    background-color: ${({ $selected, theme }) => ($selected ? theme.brandDark : theme.brandLight)};
    height: 30px;
    text-align: center;
    padding: 4px 0;
    content: ${({ $selected }) =>
      $selected
        ? '""'
        : // chevron down icon
          css`url("data:image/svg+xml,%3Csvg width='25' height='24' viewBox='0 0 25 24' 
      fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath 
      d='M7.0406 8.29289C6.65008 7.90237 6.01691 7.90237 5.62639 8.29289C5.23586 8.68342 
      5.23586 9.31658 5.62639 9.70711L11.6264 15.7071C12.0169 16.0976 12.6501 16.0976 
      13.0406 15.7071L19.0406 9.70711C19.4311 9.31658 19.4311 8.68342 19.0406 8.29289C18.6501 
      7.90237 18.0169 7.90237 17.6264 8.29289L12.3335 13.5858L7.0406 8.29289Z'
      fill='%23FFF'/%3E%3C/svg%3E")`};
  }
`;

const CausalGridOutcomeCard = forwardRef<HTMLDivElement, Props>(
  ({ title, onClick, selected }, ref) => {
    return (
      <StyledCard onClick={() => onClick()} $selected={selected} ref={ref}>
        <CardBody>
          <CardTitle>{title}</CardTitle>
        </CardBody>
      </StyledCard>
    );
  }
);

CausalGridOutcomeCard.displayName = 'CausalGridOutcomeCard';

export default CausalGridOutcomeCard;
