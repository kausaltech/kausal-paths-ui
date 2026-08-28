import { type TypedDocumentNode, gql } from '@apollo/client';

import type { ScenariosQuery, ScenariosQueryVariables } from '@/common/__generated__/graphql';

const GET_SCENARIOS: TypedDocumentNode<ScenariosQuery, ScenariosQueryVariables> = gql`
  query Scenarios {
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
