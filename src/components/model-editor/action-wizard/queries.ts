import { type TypedDocumentNode, gql } from '@apollo/client';

import type {
  ActionTargetCategoriesQuery,
  ActionTargetCategoriesQueryVariables,
  ActionWizardDimensionsQuery,
  ActionWizardDimensionsQueryVariables,
  CreateActionOnNodesMutation,
  CreateActionOnNodesMutationVariables,
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

/** The categories, per dimension, that the target node's output has: those an action can change. */
export const ACTION_TARGET_CATEGORIES: TypedDocumentNode<
  ActionTargetCategoriesQuery,
  ActionTargetCategoriesQueryVariables
> = gql`
  query ActionTargetCategories($targetNodeId: UUID!) {
    instance {
      id
      editor {
        actionTargetCategories(targetNodeId: $targetNodeId) {
          dimensionId
          categoryIds
        }
      }
    }
  }
`;

/** The instance datasets and node output ports whose shape can feed an effect on the target node. */
export const EFFECT_SOURCE_CANDIDATES: TypedDocumentNode<
  EffectSourceCandidatesQuery,
  EffectSourceCandidatesQueryVariables
> = gql`
  query EffectSourceCandidates($targetNodeId: UUID!) {
    instance {
      id
      editor {
        effectSourceCandidates(targetNodeId: $targetNodeId) {
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

export const CREATE_ACTION_ON_NODES: TypedDocumentNode<
  CreateActionOnNodesMutation,
  CreateActionOnNodesMutationVariables
> = gql`
  mutation CreateActionOnNodes(
    $instanceId: ID!
    $input: CreateActionOnNodesInput!
    $version: UUID
  ) {
    instanceEditor(instanceId: $instanceId, version: $version) {
      createActionOnNodes(input: $input) {
        __typename
        ... on CreateActionOnNodesResult {
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
