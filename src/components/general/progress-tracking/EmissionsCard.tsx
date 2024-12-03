import { useTranslation } from 'react-i18next';
import styled, { useTheme } from 'styled-components';
import { StyledCard } from './StyledCard';
import { StyledStatusBadge } from './StyledStatusBadge';
import { getStatus } from './utils';

type EmissionsCardProps = {
  title: string;
  value: number;
  unit: string;
  deltaPercentage?: number;
};

const StyledEmissionsCardValue = styled.p`
  font-size: ${({ theme }) => theme.fontSizeLg};
  margin: 0;
  line-height: 1;
`;

const StyledEmissionsCardUnit = styled.span`
  font-size: ${({ theme }) => theme.fontSizeSm};
`;

const StyledEmissionsCardTitle = styled.h5`
  font-size: ${({ theme }) => theme.fontSizeSm};
  color: ${({ theme }) => theme.textColor.secondary};
`;

export function EmissionsCard({ title, value, unit, deltaPercentage }: EmissionsCardProps) {
  const theme = useTheme();
  const { t } = useTranslation();

  const status = deltaPercentage ? getStatus(deltaPercentage, t, theme) : undefined;

  return (
    <StyledCard>
      <StyledEmissionsCardTitle>{title}</StyledEmissionsCardTitle>
      <StyledEmissionsCardValue>
        {value.toLocaleString(undefined, { maximumFractionDigits: 0 })}{' '}
        <StyledEmissionsCardUnit>{unit}</StyledEmissionsCardUnit>
      </StyledEmissionsCardValue>
      {status?.subLabel && (
        <StyledStatusBadge $backgroundColor={status.backgroundColor} $color={status.color}>
          {status.subLabel}
        </StyledStatusBadge>
      )}
    </StyledCard>
  );
}
