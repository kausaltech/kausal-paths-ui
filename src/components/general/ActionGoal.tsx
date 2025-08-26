import styled from '@emotion/styled';

/**
 * Added for Zürich, in future this will be renamed to be more generic and
 * not clash with the concept of "goals" e.g. as a custom field.
 */
export const ActionGoal = styled.div`
  max-width: ${({ theme }) => theme.breakpoints.values.sm}px;
  background-color: ${({ theme }) => theme.graphColors.blue010};
  border-radius: ${({ theme }) => theme.cardBorderRadius};
  padding: ${({ theme }) => theme.spaces.s100};
  margin-bottom: ${({ theme }) => theme.spaces.s200};

  p:last-of-type {
    margin-bottom: 0;
  }
`;
