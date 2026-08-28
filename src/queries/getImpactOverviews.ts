import { type TypedDocumentNode, gql } from '@apollo/client';

import type {
  ImpactOverviewsQuery,
  ImpactOverviewsQueryVariables,
} from '@/common/__generated__/graphql';

export const GET_IMPACT_OVERVIEWS: TypedDocumentNode<
  ImpactOverviewsQuery,
  ImpactOverviewsQueryVariables
> = gql`
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
