import { useMemo } from 'react';

import { gql } from '@apollo/client';
import { useLazyQuery } from '@apollo/client/react';

import type {
  NodeOutputDataQuery,
  NodeOutputDataQueryVariables,
} from '@/common/__generated__/graphql';
import { DimensionalMetric } from '../dimensional-metric';
import { DIMENSIONAL_METRIC_FIELDS } from '../queries';

const GET_NODE_OUTPUT_DATA = gql`
  query NodeOutputData($nodeId: ID!) {
    node(id: $nodeId) {
      id
      name
      editor {
        spec {
          outputPorts {
            id
            label
            quantity
            unit {
              id
              short
              long
              htmlShort
              htmlLong
            }
            output {
              ...ModelEditorDimensionalMetricFields
            }
          }
        }
      }
    }
  }
  ${DIMENSIONAL_METRIC_FIELDS}
`;

type NodeOutputPort = NonNullable<
  NonNullable<NonNullable<NodeOutputDataQuery['node']>['editor']>['spec']
>['outputPorts'][number];

type PortMetric = {
  portId: NodeOutputPort['id'];
  portLabel: NodeOutputPort['label'];
  quantity: NodeOutputPort['quantity'];
  metric: DimensionalMetric | null;
};

type UseNodeMetricResult = {
  loading: boolean;
  error?: Error;
  portMetrics: PortMetric[];
  fetch: () => void;
};

export function useNodeMetric(nodeId: string | null): UseNodeMetricResult {
  const [executeQuery, { data, loading, error }] = useLazyQuery<
    NodeOutputDataQuery,
    NodeOutputDataQueryVariables
  >(GET_NODE_OUTPUT_DATA, {
    fetchPolicy: 'cache-and-network',
  });

  const fetch = () => {
    if (nodeId) {
      void executeQuery({ variables: { nodeId } });
    }
  };

  const portMetrics = useMemo<PortMetric[]>(() => {
    const ports = data?.node?.editor?.spec?.outputPorts;
    if (!ports) return [];

    return ports.map((port) => ({
      portId: port.id,
      portLabel: port.label,
      quantity: port.quantity,
      metric: port.output ? new DimensionalMetric(port.output) : null,
    }));
  }, [data]);

  return { loading, error: error as Error | undefined, portMetrics, fetch };
}
