import { gql } from '@apollo/client';

const GET_SCENARIOS = gql`
  query GetScenarios {
    scenarios {
      id
      name
      isActive
      isDefault
      isSelectable
    }
  }
`;

export { GET_SCENARIOS };
