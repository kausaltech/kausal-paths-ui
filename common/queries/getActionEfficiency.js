import { gql } from '@apollo/client';

const GET_ACTION_EFFICIENCY = gql`
  query GetActionEfficiency { 
    instance {
      actionGroups {
        id
        name
        color
        actions {
          id
        }
      }
    }
    actionEfficiencyPairs { 
      label
      efficiencyUnit {
        short
      }
      costNode {
        id
        name
        shortDescription
        unit {
          short
        }
      }
      impactNode {
        id
        name
        shortDescription
        unit {
          short
        }
      }
      actions {
        action {
          id
          name
          shortDescription
          color
          decisionLevel
          unit {
            htmlShort
          }
          parameters {
            __typename
            id
            description
            nodeRelativeId
            node {
              id
            }
            isCustomized
            ... on NumberParameterType {
              numberValue: value
              numberDefaultValue: defaultValue
              minValue
              maxValue
              unit {
                htmlShort
              }
            }
            ... on BoolParameterType {
              boolValue: value
              boolDefaultValue: defaultValue
            }
            ... on StringParameterType {
              stringValue: value
              stringDefaultValue: defaultValue
            }
          }
          quantity
          inputNodes {
            id
          }
          outputNodes {
            id
          }
          impactMetric {
            id
            unit {
              htmlShort
            }
            yearlyCumulativeUnit {
              htmlShort
            }
            historicalValues {
              year
              value
            }
            forecastValues {
              value
              year
            }
          }
          group {
            id
            name
            color
          }
        }
        cumulativeImpact
        cumulativeEfficiency
        cumulativeCost
      }
    }
  }
`;

export { GET_ACTION_EFFICIENCY };