import { gql } from '@apollo/client';

export const GET_IMPACT_OVERVIEWS = gql`
  query ImpactOverviews {
    impactOverviews {
      id
      graphType
      label
      indicatorUnit {
        id
        short
        long
        htmlShort
      }
    }
  }
`;
