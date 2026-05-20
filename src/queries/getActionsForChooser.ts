import { gql } from '@apollo/client';

import { ACTION_PARAMETER_FRAGMENT } from './actionParameterFragment';

export const GET_ACTIONS_FOR_CHOOSER = gql`
  query ActionsForChooser {
    actions(onlyRoot: true) {
      id
      name
      parameters {
        ...ActionParameter
      }
      group {
        id
        name
        color
      }
    }
  }

  ${ACTION_PARAMETER_FRAGMENT}
`;
