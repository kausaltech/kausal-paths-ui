import { useCallback, useEffect, useMemo, useState } from 'react';

import { ApolloError, gql, useQuery } from '@apollo/client';
import { Box, Drawer } from '@mui/material';
import { type Edge, type Node, ReactFlowProvider } from '@xyflow/react';

import type { GetCytoscapeNodesQuery } from '@/common/__generated__/graphql';
import ContentLoader from '@/components/common/ContentLoader';
import GraphQLError from '@/components/common/GraphQLError';
import FlowGraph from '@/components/flow/FlowGraph';
import NodeDetails from '@/components/flow/NodeDetails';
import type { NodeDetailsType } from '@/components/flow/NodeDetails';
import type { PathsConfig } from '@/types/config.types';

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const yaml = require('js-yaml');

const CONFIG_URL =
  'https://raw.githubusercontent.com/kausaltech/kausal-paths/refs/heads/main/configs/longmont.yaml';

// Config types are now imported from @/types/config.types

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

export default function ExploreView() {
  const [_config, setConfig] = useState<PathsConfig | null>(null);
  const [configLoading, setConfigLoading] = useState(true);
  const [configError, setConfigError] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const toggleDrawer = useCallback(
    (newOpen: boolean) => () => {
      setPanelOpen(newOpen);
    },
    []
  );

  const { loading, error, data } = useQuery<GetCytoscapeNodesQuery>(GET_NODES);

  // Memoize data transformations before any early returns
  const reactFlowNodes = useMemo(() => {
    return data?.nodes ? data.nodes.map(nodeToReactFlowNode) : [];
  }, [data?.nodes]);

  const reactFlowEdges = useMemo(() => {
    return data?.nodes ? createAllEdges(data.nodes) : [];
  }, [data?.nodes]);

  const showNodeDetails = useCallback((nodeId: string | null) => {
    setSelectedNodeId(nodeId);
    console.log('Selected node:', nodeId);
    setPanelOpen(nodeId !== null);
  }, []);

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
        const parsedConfig = yaml.load(yamlText) as PathsConfig;
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

  const getNodeDetails = (nodeId: string | null): NodeDetailsType | null => {
    if (!nodeId || !_config) return null;

    // First try to find in nodes
    const node = _config.nodes?.find((node) => node.id === nodeId);
    if (node) return node as NodeDetailsType;

    // Then try to find in actions
    const action = _config.actions?.find((action) => action.id === nodeId);
    if (action) return action as NodeDetailsType;

    return null;
  };

  //console.log('GraphQL nodes:', data.nodes);
  console.log('Longmont config:', _config);

  return (
    <div>
      <Drawer
        open={panelOpen}
        onClose={toggleDrawer(false)}
        hideBackdrop={true}
        variant="persistent"
        anchor="right"
      >
        <Box sx={{ width: 300 }} role="presentation">
          <NodeDetails node={getNodeDetails(selectedNodeId)} />
        </Box>
      </Drawer>
      <ReactFlowProvider>
        <FlowGraph
          nodes={reactFlowNodes}
          edges={reactFlowEdges}
          onNodeSelect={(nodeId) => showNodeDetails(nodeId)}
        />
      </ReactFlowProvider>
    </div>
  );
}
