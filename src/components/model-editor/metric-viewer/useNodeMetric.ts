import { useMemo } from 'react';

import { gql } from '@apollo/client';
import { CombinedGraphQLErrors } from '@apollo/client/errors';
import { useLazyQuery } from '@apollo/client/react';

import type {
  ModelEditorDimensionalMetricFieldsFragment,
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
  /** Raw fragment for consumers that want to render e.g. DimensionalNodeVisualisation. */
  rawMetric: ModelEditorDimensionalMetricFieldsFragment | null;
  /** Resolver error for this port's `output` field, when the backend failed to produce it. */
  errorMessage: string | null;
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
    // The per-port `output` field is resolved by computing the node, which
    // can fail per port. Keep the partial payload so the drawer can render
    // the failing port's error next to the healthy ports' data.
    errorPolicy: 'all',
  });

  const fetch = () => {
    if (nodeId) {
      void executeQuery({ variables: { nodeId } });
    }
  };

  // GraphQL errors carry a response path like
  // ["node", "editor", "spec", "outputPorts", <index>, "output"] — map them
  // back to the port they belong to.
  const portErrorsByIndex = useMemo(() => {
    const messages = new Map<number, string>();
    if (!CombinedGraphQLErrors.is(error)) return messages;
    for (const entry of error.errors) {
      const path = entry.path ?? [];
      const portsAt = path.indexOf('outputPorts');
      const index = portsAt >= 0 ? path[portsAt + 1] : undefined;
      if (typeof index === 'number') messages.set(index, entry.message);
    }
    return messages;
  }, [error]);

  const portMetrics = useMemo<PortMetric[]>(() => {
    const ports = data?.node?.editor?.spec?.outputPorts;
    if (!ports) return [];

    return ports.map((port, index) => ({
      portId: port.id,
      portLabel: port.label,
      quantity: port.quantity,
      metric: port.output ? new DimensionalMetric(port.output) : null,
      rawMetric: port.output ?? null,
      errorMessage: portErrorsByIndex.get(index) ?? null,
    }));
  }, [data, portErrorsByIndex]);

  return { loading, error, portMetrics, fetch };
}
