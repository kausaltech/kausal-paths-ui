import { ApolloError, gql, useQuery } from '@apollo/client';
import { type Edge, type Node, ReactFlowProvider } from '@xyflow/react';

import type { GetCytoscapeNodesQuery } from '@/common/__generated__/graphql';
import ContentLoader from '@/components/common/ContentLoader';
import GraphQLError from '@/components/common/GraphQLError';
import FlowGraph from '@/components/flow/FlowGraph';

const GET_NODES = gql`
  query GetCytoscapeNodes {
    nodes {
      id
      name
      color
      quantity
      isVisible
      unit {
        htmlShort
      }
      inputNodes {
        id
      }
      outputNodes {
        id
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
        }
      }
    }
  }
`;

const nodeToReactFlowNode: (node: GetCytoscapeNodesQuery['nodes'][0]) => Node = (node) => {
  return {
    id: node.id,
    position: { x: 0, y: 0 },
    data: { label: node.name },
    type: node.__typename == 'ActionNode' ? 'actionNode' : 'standard',
  };
};

const createNodeEdges: (node: GetCytoscapeNodesQuery['nodes'][0]) => Edge[] = (node) => {
  const edges: Edge[] = [];
  node.outputNodes.forEach((target) => {
    const newEdge: Edge = {
      id: `${node.id}-${target.id}`,
      source: node.id,
      target: target.id,
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
  const { loading, error, data } = useQuery<GetCytoscapeNodesQuery>(GET_NODES);

  if (loading || typeof window === 'undefined') {
    return <ContentLoader />;
  }
  if (error) {
    return <GraphQLError error={error} />;
  }
  if (!data) {
    return <GraphQLError error={new ApolloError({ graphQLErrors: [{ message: 'No data' }] })} />;
  }
  const { nodes } = data;

  const reactFlowNodes = nodes.map(nodeToReactFlowNode);
  const reactFlowEdges = createAllEdges(nodes);

  console.log(nodes);
  return (
    <ReactFlowProvider>
      <FlowGraph nodes={reactFlowNodes} edges={reactFlowEdges} />
    </ReactFlowProvider>
  );
}
