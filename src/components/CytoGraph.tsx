import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';

import chroma from 'chroma-js';
import type { GetCytoscapeNodesQuery } from 'common/__generated__/graphql';
import { useTranslation } from 'common/i18n';
import cytoscape, {
  type EdgeDefinition,
  type ElementDefinition,
  type NodeDefinition,
} from 'cytoscape';
import CytoscapeComponent from 'react-cytoscapejs';
import dagre, { type DagreLayoutOptions } from 'cytoscape-dagre';
import elk, { type ElkLayoutOptions } from 'cytoscape-elk';
// @ts-ignore
//import cytoscapeNodeHtmlLabel from 'cytoscape-node-html-label';
import { readableColor } from 'polished';
import styled, { useTheme } from 'styled-components';

import SelectDropdown from './common/SelectDropdown';
import { NutFill } from 'react-bootstrap-icons';

const GraphContainer = styled.div`
  width: 100%;
  height: 800px;
  position: relative;
`;

cytoscape.use(dagre);
cytoscape.use(elk);
//cytoscapeNodeHtmlLabel(cytoscape);

function getBackgroundColor(node: GetCytoscapeNodesQuery['nodes'][0]) {
  const nodeColors = {
    action: '#94dd94',
    emissions: '#c6b58a',
    utility: '#93c2d6',
    effect: '#e0b472',
    currency: '#748d77',
    unit_price: '#9ecae1',
    energy: '#b74848',
    emission_factor: '#d8e899',
  };

  if (node.__typename == 'ActionNode') {
    if (node.group?.color) {
      const actionColor = chroma(node.group.color).brighten().hex();
      return actionColor;
    }
    return nodeColors.action;
  }
  if (node.color) {
    return node.color;
  } else if (node.quantity && nodeColors[node.quantity]) {
    return nodeColors[node.quantity];
  }
  return '#eeeeee';
}

function wordWrap(inputStr, maxWidth, newLineStr = '\n') {
  let done = false;
  let res = '';
  let str = inputStr;

  function testWhite(x) {
    const white = new RegExp(/^\s$/);
    return white.test(x.charAt(0));
  }

  do {
    let found = false;
    // Inserts new line at first whitespace of the line
    for (let i = maxWidth - 1; i >= 0; i -= 1) {
      if (testWhite(str.charAt(i))) {
        res += [str.slice(0, i), newLineStr].join('');
        str = str.slice(i + 1);
        found = true;
        break;
      }
    }
    // Inserts new line at maxWidth position, the word is too long to wrap
    if (!found) {
      res += [str.slice(0, maxWidth), newLineStr].join('');
      str = str.slice(maxWidth);
    }

    if (str.length < maxWidth) done = true;
  } while (!done);

  return res + str;
}

type NodeSelectorProps = {
  nodes: CytoGraphProps['nodes'];
  selectedNode: string;
  setSelectedNode: React.Dispatch<React.SetStateAction<string>>;
};

function NodeSelector(props: NodeSelectorProps) {
  const { nodes, selectedNode, setSelectedNode } = props;
  const options = nodes.map((node) => ({
    id: node.id,
    label: node.name,
  }));
  const { t } = useTranslation();
  return (
    <SelectDropdown
      id="dimension"
      //label={t('choose-node')!}
      onChange={(val) => setSelectedNode(val ? val.id : '')}
      options={options}
      value={selectedNode ? options.find((o) => o.id === selectedNode) || null : null}
      isMulti={false}
      isClearable={true}
    />
  );
}

type LayoutOption = {
  id: string;
  label: string;
  options: {
    layout: DagreLayoutOptions | ElkLayoutOptions;
    edgeStyle: Partial<Cytoscape.Css.Edge>;
  };
};

const graphSettings: LayoutOption[] = [
  {
    id: 'dagre',
    label: 'Dagre',
    options: {
      layout: {
        name: 'dagre',
        ranker: 'tight-tree',
        edgeWeight: (edge) => (edge.data('type') === 'parent' ? 5 : 1),
        nodeDimensionsIncludeLabels: true,
        animate: false,
        rankDir: 'TB',
        animationDuration: 2000,
      },
      edgeStyle: {
        'curve-style': 'bezier',
        'control-point-step-size': 40,
      },
    },
  },
  {
    id: 'tree-td',
    label: 'Top-down tree',
    options: {
      layout: {
        name: 'elk',
        nodeDimensionsIncludeLabels: true,
        elk: {
          algorithm: 'layered',
          'elk.direction': 'DOWN',
          'elk.spacing.nodeNode': 80,
          'elk.layered.spacing.nodeNodeBetweenLayers': 100,
          'elk.edgeRouting': 'SPLINES',
          'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
          'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
          'elk.layered.priority.shortness': 100,
          'elk.spacing.edgeEdge': 20,
          'elk.spacing.edgeNode': 30,
          'elk.layered.edgeWeight': 'data(weight)',
        },
        fit: true,
        padding: 50,
      },
      edgeStyle: {
        'curve-style': 'bezier',
        'control-point-step-size': 40,
      },
    },
  },
  {
    id: 'orthogonal-lr',
    label: 'Left-to-right orthogonal',
    options: {
      layout: {
        name: 'elk',
        nodeDimensionsIncludeLabels: true,
        elk: {
          algorithm: 'layered',
          'elk.direction': 'RIGHT',
          'elk.spacing.nodeNode': 80,
          'elk.layered.spacing.nodeNodeBetweenLayers': 100,
          'elk.edgeRouting': 'ORTHOGONAL',
          'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
          'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
          'elk.layered.priority.shortness': 100,
          'elk.spacing.edgeEdge': 20,
          'elk.spacing.edgeNode': 30,
          'elk.layered.edgeWeight': 'data(weight)',
        },
        fit: true,
        padding: 50,
      },
      edgeStyle: {
        'curve-style': 'taxi',
        'taxi-direction': 'rightward',
        'taxi-turn': '50%',
      },
    },
  },
];

const edgeStyle: cytoscape.Css.Edge = {
  label: 'data(label)',
  'target-text-offset': 1,
  'target-arrow-shape': 'triangle',
  'target-arrow-color': 'data(color)',
  'arrow-scale': 2,
  'line-color': 'data(color)',
  'text-outline-width': 3,
  'text-outline-color': 'data(color)',
  color: '#ffffff',
  'curve-style': 'bezier',
  'font-size': '18px',
  'font-weight': 'bold',
  width: 2,
};

const nodeStyle: cytoscape.Css.Node = {
  shape: 'rectangle',
  'background-color': 'data(backgroundColor)',
  color: (node) => node.data('textColor'),
  'text-valign': 'center',
  padding: '24px',
  label: 'data(label)',
  'text-opacity': 1,
  'text-wrap': 'wrap',
  'text-outline-width': 0,
  'font-weight': 'normal',
  'border-width': (node) => (node.data('type') === 'action' ? '2px' : '0px'),
  'border-color': '#000000',
  'border-style': 'dashed',
  width: 175,
  height: 'auto',
};

type CytoGraphProps = {
  nodes: GetCytoscapeNodesQuery['nodes'];
};

export default function CytoGraph(props: CytoGraphProps) {
  const { nodes } = props;
  const [selectedNode, setSelectedNode] = useState('');
  const [layout, setLayout] = useState(graphSettings[0]);
  const router = useRouter();
  const theme = useTheme();
  const visRef = useRef<HTMLDivElement>(null);
  const elements: ElementDefinition[] = [];

  const handleNodeClick = (event: Cytoscape.EventObject) => {
    const nodeId = event.target.data('id');
    router.push(`/node/${nodeId}`);
  };

  // Nodes
  nodes.forEach((node) => {
    //const label = wordWrap(node.name, 30);
    const latestHistorical = node.metric?.historicalValues?.[0];
    const latest = {
      year: null,
      value: '',
      unit: node.unit?.htmlShort?.replace(/<[^>]*>/g, '') || '',
    };
    if (latestHistorical) {
      const val = latestHistorical.value;
      latest.year = latestHistorical.year;
      latest.value = val < 0 ? val.toPrecision(3) : val.toFixed(0);
    }

    const label = `${wordWrap(node.name, 30)}\n${latest.value !== '' ? `${latest.year}: ${latest.value} ${latest.unit}` : ''}`;
    //const label = "this can be anything and it doesn't matter";
    const bgColor = getBackgroundColor(node);
    const textColor = readableColor(bgColor);

    const element: NodeDefinition = {
      group: 'nodes',
      data: {
        id: node.id,
        backgroundColor: bgColor,
        textColor,
        name: node.name,
        hist: latest,
        label: label,
        type: node.__typename == 'ActionNode' ? 'action' : 'node',
      },
    };
    elements.push(element);
  });

  // Edges
  nodes.forEach((node) => {
    node.outputNodes.forEach((target) => {
      const edge: EdgeDefinition = {
        group: 'edges',
        data: {
          id: `${node.id}-${target.id}`,
          source: node.id,
          target: target.id,
          label: '',
          color: '#888',
        },
      };
      elements.push(edge);
    });
    if (node.__typename == 'ActionNode') {
      if (node.subactions.length) {
        console.log(node);
        console.log(node.subactions);
      }
      node.subactions.forEach((sub) => {
        const edge: EdgeDefinition = {
          group: 'edges',
          data: {
            id: `${node.id}-${sub.id}`,
            source: node.id,
            target: sub.id,
            label: '',
            color: '#888',
            type: 'parent',
          },
        };
        elements.push(edge);
      });
    }
  });

  const cyStyle = [
    // the stylesheet for the graph
    {
      selector: '*',
      style: {
        'font-family': `${theme.fontFamily}, sans-serif`,
      },
    },
    {
      selector: 'node',
      style: nodeStyle,
    },
    {
      selector: 'edge',
      style: { ...edgeStyle, ...layout.options.edgeStyle },
    },
  ];

  return (
    <GraphContainer>
      <NodeSelector nodes={nodes} selectedNode={selectedNode} setSelectedNode={setSelectedNode} />
      <CytoscapeComponent
        elements={elements}
        style={{ width: '100%', height: '100%' }}
        stylesheet={cyStyle}
        layout={layout.options.layout}
        cy={(cy) => {
          cy.on('tap', 'node', handleNodeClick);
          /*
          cy.nodeHtmlLabel([
            {
              query: 'node',
              valign: 'center',
              halign: 'center',
              valignBox: 'center',
              halignBox: 'center',
              tpl: (data) => {
                const name = wordWrap(data.name, 30, '<br />');
                const histStr = data.hist.value
                  ? `<br />${data.hist.year}: <em>${data.hist.value} ${data.hist.unit}</em>`
                  : '';
                return `<div style="color: ${data.textColor}"><strong>${name}</strong>${histStr}</div>`;
              },
            },
          ]);*/
        }}
      />
    </GraphContainer>
  );
}
