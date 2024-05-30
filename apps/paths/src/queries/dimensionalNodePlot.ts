import { gql } from '@apollo/client';
import { DimensionalMetric } from 'data/metric';

const dimensionalNodePlotFragment = gql`
  fragment DimensionalNodeMetric on NodeInterface {
    metricDim {
      ...DimensionalMetric
    }
  }
  ${DimensionalMetric.fragment}
`;

export default dimensionalNodePlotFragment;
