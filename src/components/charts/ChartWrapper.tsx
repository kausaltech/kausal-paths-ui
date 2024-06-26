import { ReactNode } from 'react';
import Loader from 'components/common/Loader';
import styled from 'styled-components';

const StyledCard = styled.div`
  position: relative;
  margin: 0 0 3rem;
  padding: 2rem;
  border-radius: 0;
  background-color: ${(props) => props.theme.themeColors.white};
  box-shadow: 3px 3px 12px rgba(33, 33, 33, 0.15);
`;

const StyledSubtitle = styled.p`
  color: ${({ theme }) => theme.textColor.secondary};
`;

type Props = {
  id?: string;
  title?: string;
  subtitle?: string;
  isLoading: boolean;
  children: ReactNode;
};

export function ChartWrapper({ id, title, subtitle, isLoading, children }: Props) {
  return (
    <StyledCard id={id}>
      {!!title && <h3>{title}</h3>}
      {!!subtitle && <StyledSubtitle>{subtitle}</StyledSubtitle>}
      {isLoading && <Loader />}
      {children}
    </StyledCard>
  );
}
