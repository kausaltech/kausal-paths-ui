import { type TypedDocumentNode, gql } from '@apollo/client';

import type {
  ActionsForChooserQuery,
  ActionsForChooserQueryVariables,
} from '@/common/__generated__/graphql';
import { ACTION_PARAMETER_FRAGMENT } from './actionParameterFragment';

export const GET_ACTIONS_FOR_CHOOSER: TypedDocumentNode<
  ActionsForChooserQuery,
  ActionsForChooserQueryVariables
> = gql`
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
