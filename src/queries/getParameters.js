import { gql } from '@apollo/client';

import { ACTION_PARAMETER_FRAGMENT } from '@/components/general/ActionParameters';

const GET_PARAMETERS = gql`
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
