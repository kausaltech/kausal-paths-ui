import { useCallback, useLayoutEffect, useState } from 'react';

import {
  type Edge,
  type Node,
  type OnConnect,
  type OnEdgesChange,
  type OnNodesChange,
  ReactFlow,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { ElkExtendedEdge, ElkNode } from 'elkjs';
import ELK from 'elkjs/lib/elk.bundled.js';

const elk = new ELK();

// Elk has a *huge* amount of options to configure. To see everything you can
// tweak check out:
//
// - https://www.eclipse.org/elk/reference/algorithms.html
// - https://www.eclipse.org/elk/reference/options.html
const ELK_OPTIONS = {
  'elk.algorithm': 'layered',
  'elk.layered.spacing.nodeNodeBetweenLayers': '100',
  'elk.spacing.nodeNode': '80',
};

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
      width: 150,
      height: 50,
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
};

const FlowGraph = (props: FlowGraphProps) => {
  const { nodes: modelNodes, edges: modelEdges } = props;
  const { fitView } = useReactFlow();

  const [nodes, setNodes] = useState<Node[]>(modelNodes);
  const [edges, setEdges] = useState<Edge[]>(modelEdges);

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

  // Calculate the initial layout on mount.
  useLayoutEffect(() => {
    onLayout({ direction: 'DOWN' });
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
      />
    </div>
  );
};

export default FlowGraph;
