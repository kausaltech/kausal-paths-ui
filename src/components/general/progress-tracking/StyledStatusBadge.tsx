import styled from 'styled-components';

export const StyledIndicator = styled.span`
  width: 16px;
  height: 16px;
  border-radius: 8px;
`;

export const StyledStatusBadge = styled.div<{
  $backgroundColor: string;
  $color: string;
  $iconColor?: string;
}>`
  margin: 0;
  display: inline-flex;
  gap: ${({ theme }) => theme.spaces.s050};
  color: ${(props) => props.$color};
  background-color: ${(props) => props.$backgroundColor};
  padding: ${({ theme }) => `${theme.spaces.s025} ${theme.spaces.s050}`};
  border-radius: ${({ theme }) => theme.badgeBorderRadius};
  align-items: center;
  font-size: ${({ theme }) => theme.fontSizeSm};
  margin-top: ${({ theme }) => theme.spaces.s050};

  > ${StyledIndicator} {
    background-color: ${(props) => props.$iconColor};
  }
`;
