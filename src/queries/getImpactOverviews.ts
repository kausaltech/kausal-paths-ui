import { gql } from '@apollo/client';

export const GET_IMPACT_OVERVIEWS = gql`
  query GetImpactOverviews {
    impactOverviews {
      id
      label
      graphType
      actions {
        action {
          id
          name
        }
        costDim {
          dimensions {
            id
          }
          years
          values
        }
        impactDim {
          dimensions {
            id
          }
          years
          values
        }
      }
    }
  }
`;
