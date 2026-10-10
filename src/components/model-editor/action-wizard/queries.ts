import { type TypedDocumentNode, gql } from '@apollo/client';

import type {
  ActionWizardDimensionsQuery,
  ActionWizardDimensionsQueryVariables,
  CreateActionFromPortsMutation,
  CreateActionFromPortsMutationVariables,
  EffectSourceCandidatesQuery,
  EffectSourceCandidatesQueryVariables,
} from '@/common/__generated__/graphql';
import { CONSTRAINT_VIOLATIONS_FIELDS, EDITOR_OPERATION_INFO_FIELDS } from '../queries';

/** The instance's dimensions and categories, for narrowing an effect's categories. */
export const ACTION_WIZARD_DIMENSIONS: TypedDocumentNode<
  ActionWizardDimensionsQuery,
  ActionWizardDimensionsQueryVariables
> = gql`
  query ActionWizardDimensions {
    instance {
      id
      editor {
        dimensions {
          id
          identifier
          name
          categories {
            id
            label
          }
        }
      }
    }
  }
`;

/** The instance datasets and node output ports whose shape can feed an effect on `target`. */
export const EFFECT_SOURCE_CANDIDATES: TypedDocumentNode<
  EffectSourceCandidatesQuery,
  EffectSourceCandidatesQueryVariables
> = gql`
  query EffectSourceCandidates($target: OutputPortRefInput!) {
    instance {
      id
      editor {
        effectSourceCandidates(target: $target) {
          datasets {
            datasetId
            datasetName
            metricId
            metricLabel
          }
          nodes {
            nodeId
            nodeName
            portId
          }
        }
      }
    }
  }
`;

export const CREATE_ACTION_FROM_PORTS: TypedDocumentNode<
  CreateActionFromPortsMutation,
  CreateActionFromPortsMutationVariables
> = gql`
  mutation CreateActionFromPorts(
    $instanceId: ID!
    $input: CreateActionFromPortsInput!
    $version: UUID
  ) {
    instanceEditor(instanceId: $instanceId, version: $version) {
      createActionFromPorts(input: $input) {
        __typename
        ... on CreateActionFromPortsResult {
          action {
            ... on NodeInterface {
              id
            }
          }
          datasets {
            id
          }
        }
        ... on OperationInfo {
          ...EditorOperationInfoFields
        }
        ... on ConstraintViolations {
          ...ConstraintViolationsFields
        }
      }
    }
  }
  ${EDITOR_OPERATION_INFO_FIELDS}
  ${CONSTRAINT_VIOLATIONS_FIELDS}
`;
