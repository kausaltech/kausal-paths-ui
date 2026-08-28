import { type TypedDocumentNode, gql } from '@apollo/client';

import type { ParametersQuery, ParametersQueryVariables } from '@/common/__generated__/graphql';
import { ACTION_PARAMETER_FRAGMENT } from './actionParameterFragment';

const GET_PARAMETERS: TypedDocumentNode<ParametersQuery, ParametersQueryVariables> = gql`
  query Parameters {
    availableNormalizations {
      id
      label
      isActive
    }
    parameters {
      ...ActionParameter
    }
  }
  ${ACTION_PARAMETER_FRAGMENT}
`;

export { GET_PARAMETERS };
