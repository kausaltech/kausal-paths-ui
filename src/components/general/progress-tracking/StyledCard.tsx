import styled from '@emotion/styled';

export const StyledCard = styled.div`
  border-radius: ${(props) => props.theme.cardBorderRadius};
  background-color: ${(props) => props.theme.cardBackground.secondary};
  padding: ${(props) => props.theme.spaces.s100};
  flex: 1;
`;
