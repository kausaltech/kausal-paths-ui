import { useEffect, useState } from 'react';

import { ApolloError, gql, useQuery } from '@apollo/client';
import { type Edge, type Node, ReactFlowProvider } from '@xyflow/react';

import type { GetCytoscapeNodesQuery } from '@/common/__generated__/graphql';
import ContentLoader from '@/components/common/ContentLoader';
import GraphQLError from '@/components/common/GraphQLError';
import FlowGraph from '@/components/flow/FlowGraph';

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const yaml = require('js-yaml');

const CONFIG_URL =
  'https://raw.githubusercontent.com/kausaltech/kausal-paths/refs/heads/main/configs/longmont.yaml';

type ActionGroup = {
  id: string;
  name: string;
  [key: string]: unknown;
};

type Dimension = {
  id: string;
  label: string;
  categories?: unknown[];
  [key: string]: unknown;
};

type Action = {
  id: string;
  name: string;
  type: string;
  [key: string]: unknown;
};

type LongmontConfig = {
  id: string;
  name: string;
  owner: string;
  target_year: number;
  actions?: Action[];
  action_groups?: ActionGroup[];
  dimensions?: Dimension[];
  [key: string]: unknown;
};

const GET_NODES = gql`
  query GetCytoscapeNodes {
    nodes {
      id
      name
      shortName
      shortDescription
      color
      quantity
      isVisible
      unit {
        htmlShort
      }
      inputNodes {
        id
        shortName
      }
      outputNodes {
        id
        shortName
      }
      metric {
        historicalValues(latest: 1) {
          year
          value
        }
      }
      ... on ActionNode {
        parentAction {
          id
        }
        subactions {
          id
        }
        group {
          id
          color
          name
        }
      }
    }
  }
`;

const nodeToReactFlowNode: (node: GetCytoscapeNodesQuery['nodes'][0]) => Node = (node) => {
  const isActionNode = node.__typename === 'ActionNode';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
  const nodeWithShortName = node as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
  const actionNode = isActionNode ? (node as any) : null;

  return {
    id: node.id,
    position: { x: 0, y: 0 },
    data: {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      label: nodeWithShortName.shortName || node.name,
      isVisible: node.isVisible,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      color: node.color || actionNode?.group?.color,
    },
    type: 'standard',
  };
};

const createNodeEdges: (node: GetCytoscapeNodesQuery['nodes'][0]) => Edge[] = (node) => {
  const edges: Edge[] = [];
  node.outputNodes.forEach((target) => {
    const newEdge: Edge = {
      id: `${node.id}-${target.id}`,
      source: node.id,
      target: target.id,
      type: 'smoothstep',
    };
    edges.push(newEdge);
  });
  return edges;
};

const createAllEdges: (nodes: GetCytoscapeNodesQuery['nodes']) => Edge[] = (nodes) => {
  const allEdges: Edge[] = [];
  nodes.forEach((node) => {
    allEdges.push(...createNodeEdges(node));
  });
  return allEdges;
};

export default function Graph() {
  const [config, setConfig] = useState<LongmontConfig | null>(null);
  const [configLoading, setConfigLoading] = useState(true);
  const [configError, setConfigError] = useState<string | null>(null);

  const { loading, error, data } = useQuery<GetCytoscapeNodesQuery>(GET_NODES);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        setConfigLoading(true);
        const response = await fetch(CONFIG_URL);
        if (!response.ok) {
          throw new Error(`Failed to fetch config: ${response.status}`);
        }
        const yamlText = await response.text();
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        const parsedConfig = yaml.load(yamlText) as LongmontConfig;
        setConfig(parsedConfig);
        setConfigError(null);
      } catch (err) {
        console.error('Error loading config:', err);
        setConfigError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setConfigLoading(false);
      }
    };

    void loadConfig();
  }, []);

  if (loading || configLoading || typeof window === 'undefined') {
    return <ContentLoader />;
  }
  if (error) {
    return <GraphQLError error={error} />;
  }
  if (configError) {
    return <GraphQLError error={new ApolloError({ graphQLErrors: [{ message: configError }] })} />;
  }
  if (!data) {
    return <GraphQLError error={new ApolloError({ graphQLErrors: [{ message: 'No data' }] })} />;
  }
  const { nodes } = data;

  const reactFlowNodes = nodes.map(nodeToReactFlowNode);
  const reactFlowEdges = createAllEdges(nodes);

  console.log('GraphQL nodes:', nodes);
  console.log('Longmont config:', config);

  return (
    <ReactFlowProvider>
      <FlowGraph nodes={reactFlowNodes} edges={reactFlowEdges} />
    </ReactFlowProvider>
  );
}
