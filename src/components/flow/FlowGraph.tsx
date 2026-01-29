import { memo, useCallback, useLayoutEffect, useState } from 'react';

import { Box, ListSubheader, Menu, MenuItem, MenuList } from '@mui/material';
import {
  Background,
  ControlButton,
  Controls,
  type Edge,
  MiniMap,
  type Node,
  type NodeTypes,
  type OnConnect,
  type OnEdgesChange,
  type OnNodesChange,
  type OnSelectionChangeParams,
  ReactFlow,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { ElkExtendedEdge, ElkNode } from 'elkjs';
import ELK from 'elkjs/lib/elk.bundled.js';

//import ActionNode from '@/components/flow/ActionNode';
import DefaultNode from '@/components/flow/DefaultNode';

import { getDownstreamNodes, getUpstreamNodes } from './NodeProcessing';

const elk = new ELK();

// Elk has a *huge* amount of options to configure. To see everything you can
// tweak check out:
//
// - https://www.eclipse.org/elk/reference/algorithms.html
// - https://www.eclipse.org/elk/reference/options.html
const ELK_OPTIONS = {
  'elk.algorithm': 'layered',
  'elk.layered.spacing.nodeNodeBetweenLayers': '50',
  'elk.spacing.nodeNode': '25',
};

const nodeTypes: NodeTypes = {
  node: DefaultNode,
  default: DefaultNode,
  standard: DefaultNode,
  action: DefaultNode,
};

const NODE_WIDTH = 100;
const NODE_HEIGHT = 60;

const getLayoutedElements = (
  nodes: Node[],
  edges: Edge[],
  options: Record<string, unknown> = {}
) => {
  const isHorizontal = options?.['elk.direction'] === 'RIGHT';
  const graph = {
    id: 'root',
    layoutOptions: options,
    children: nodes.map((node) => ({
      ...node,
      // Adjust the target and source handle positions based on the layout
      // direction.
      targetPosition: isHorizontal ? 'left' : 'top',
      sourcePosition: isHorizontal ? 'right' : 'bottom',

      // Hardcode a width and height for elk to use when layouting.
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
    })) as ElkNode[],
    edges: edges as unknown as ElkExtendedEdge[],
  };

  return elk
    .layout(graph as ElkNode)
    .then((layoutedGraph) => ({
      nodes: layoutedGraph.children?.map((node) => ({
        ...node,
        // React Flow expects a position property on the node instead of `x`
        // and `y` fields.
        position: { x: node.x, y: node.y },
      })),

      edges: layoutedGraph.edges,
    }))
    .catch(console.error);
};

type FlowGraphProps = {
  nodes: Node[];
  edges: Edge[];
  onNodeSelect: (nodeId: string | null) => void;
};

const FlowGraph = (props: FlowGraphProps) => {
  const { nodes: modelNodes, edges: modelEdges, onNodeSelect } = props;
  const { fitView } = useReactFlow();

  const [nodes, setNodes] = useState<Node[]>(modelNodes);
  const [edges, setEdges] = useState<Edge[]>(modelEdges);
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [layoutDirectionButton, setLayoutDirectionButton] = useState<null | HTMLElement>(null);
  const [layoutDirection, setLayoutDirection] = useState<'RIGHT' | 'DOWN'>('RIGHT');

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => setNodes((nodesSnapshot) => applyNodeChanges(changes, nodesSnapshot)),
    [setNodes]
  );
  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => setEdges((edgesSnapshot) => applyEdgeChanges(changes, edgesSnapshot)),
    [setEdges]
  );
  const onConnect: OnConnect = useCallback(
    (params) => setEdges((edgesSnapshot) => addEdge(params, edgesSnapshot)),
    [setEdges]
  );

  const updateEdgesAnimation = useCallback((selectedIds: string[]) => {
    setEdges((currentEdges) =>
      currentEdges.map((edge) => {
        const isConnectedToSelectedNode =
          selectedIds.includes(edge.source) || selectedIds.includes(edge.target);
        return {
          ...edge,
          animated: isConnectedToSelectedNode,
          style: {
            strokeWidth: isConnectedToSelectedNode ? 3 : 1,
            stroke: isConnectedToSelectedNode ? '#FF0072' : '#888',
          },
        };
      })
    );
  }, []);

  const muteUnselectedNodes = useCallback((selectedIds: string[]) => {
    /* let's assume only 1 node selected at a time */
    const selectedId = selectedIds[0];
    const selectedNode: Node | undefined = nodes.find((node) => selectedId === node.id);
    if (!selectedNode) {
      showAllNodes();
      return;
    }
    const downstreamNodes = getDownstreamNodes(selectedNode, nodes, edges);
    const upstreamNodes = getUpstreamNodes(selectedNode, nodes, edges);
    setNodes((currentNodes) =>
      currentNodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          muted:
            !downstreamNodes.some((n) => n.id === node.id) &&
            !upstreamNodes.some((n) => n.id === node.id) &&
            node.id !== selectedNode.id,
        },
      }))
    );
  }, []);

  const open = Boolean(layoutDirectionButton);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setLayoutDirectionButton(event.currentTarget);
  };
  const handleClose = () => {
    setLayoutDirectionButton(null);
  };

  const showAllNodes = useCallback(() => {
    setNodes((currentNodes) =>
      currentNodes.map((node) => ({ ...node, data: { ...node.data, muted: false } }))
    );
  }, []);

  const onSelectionChange = useCallback(
    ({ nodes: selectedNodes }: OnSelectionChangeParams) => {
      const selectedIds = selectedNodes.map((node) => node.id);
      setSelectedNodeIds(selectedIds);
      updateEdgesAnimation(selectedIds);
      muteUnselectedNodes(selectedIds);
      onNodeSelect(selectedNodes[0]?.id || null);
    },
    [updateEdgesAnimation, onNodeSelect]
  );

  /*
  const onLayout = useCallback(
    ({ direction }: { direction: 'DOWN' | 'UP' | 'LEFT' | 'RIGHT' }) => {
      const opts = { 'elk.direction': direction, ...ELK_OPTIONS };
      const ns = nodes;
      const es = edges;

      getLayoutedElements(ns, es, opts)
        .then((result) => {
          if (result) {
            setNodes(result.nodes as Node[]);
            if (result.edges && result.edges.length > 0) {
              setEdges(result.edges as unknown as Edge[]);
            }
            void fitView();
          }
        })
        .catch(console.error);
    },
    [nodes, edges]
  );
*/
  // Calculate the initial layout on mount.
  const initialLayout = useCallback(() => {
    const opts = { 'elk.direction': layoutDirection, ...ELK_OPTIONS };

    getLayoutedElements(modelNodes, modelEdges, opts)
      .then((result) => {
        if (result) {
          setNodes(result.nodes as Node[]);
          if (result.edges && result.edges.length > 0) {
            setEdges(result.edges as unknown as Edge[]);
          }
          void fitView();
        }
      })
      .catch(console.error);
  }, [modelNodes, modelEdges, fitView, layoutDirection]);

  useLayoutEffect(() => {
    initialLayout();
  }, [initialLayout]);

  // Update edge animation when edges change (e.g., after layout)
  useLayoutEffect(() => {
    if (selectedNodeIds.length > 0) {
      updateEdgesAnimation(selectedNodeIds);
    }
  }, [selectedNodeIds, updateEdgesAnimation]);

  return (
    <Box
      sx={{
        width: '100vw',
        height: '100vh',
        top: 0,
        left: 0,
        backgroundColor: '#ffffff',
      }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onSelectionChange={onSelectionChange}
        nodeTypes={nodeTypes}
      >
        <Controls>
          <ControlButton
            id="layout-direction-button"
            aria-controls={open ? 'layout-direction-menu' : undefined}
            aria-haspopup="true"
            aria-expanded={open ? 'true' : undefined}
            onClick={handleClick}
          >
            B
          </ControlButton>
        </Controls>
        <MiniMap nodeStrokeWidth={3} />
        <Background color="#ffffff" bgColor="#ffffff" />
      </ReactFlow>
      <Menu
        id="layout-direction-menu"
        anchorEl={layoutDirectionButton}
        open={open}
        onClose={handleClose}
        slotProps={{
          list: {
            'aria-labelledby': 'layout-direction-button',
          },
        }}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
      >
        <MenuList dense>
          <ListSubheader>Layout direction</ListSubheader>
          <MenuItem
            onClick={() => setLayoutDirection('RIGHT')}
            selected={layoutDirection === 'RIGHT'}
          >
            Horizontal
          </MenuItem>
          <MenuItem
            onClick={() => setLayoutDirection('DOWN')}
            selected={layoutDirection === 'DOWN'}
          >
            Vertical
          </MenuItem>
        </MenuList>
      </Menu>
    </Box>
  );
};

export default memo(FlowGraph);
