import { gql } from '@apollo/client';

export const METRIC_CATEGORY_FIELDS = gql`
  fragment ModelEditorMetricCategoryFields on MetricDimensionCategoryType {
    id
    originalId
    label
    color
    order
    group
  }
`;

export const METRIC_DIMENSION_FIELDS = gql`
  fragment ModelEditorMetricDimensionFields on MetricDimensionType {
    id
    originalId
    label
    helpText
    kind
    categories {
      ...ModelEditorMetricCategoryFields
    }
    groups {
      id
      originalId
      label
      color
      order
    }
  }
  ${METRIC_CATEGORY_FIELDS}
`;

export const DIMENSIONAL_METRIC_FIELDS = gql`
  fragment ModelEditorDimensionalMetricFields on DimensionalMetricType {
    id
    name
    unit {
      short
      long
      htmlShort
      htmlLong
    }
    dimensions {
      ...ModelEditorMetricDimensionFields
    }
    years
    values
    stackable
    forecastFrom
    goals {
      categories
      values {
        year
        value
      }
    }
  }
  ${METRIC_DIMENSION_FIELDS}
`;
