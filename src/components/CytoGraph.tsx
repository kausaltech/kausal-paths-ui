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
import dagre, { type DagreLayoutOptions } from 'cytoscape-dagre';
import cytoscapeNodeHtmlLabel from 'cytoscape-node-html-label';
import { getContrast } from 'polished';
import styled, { useTheme } from 'styled-components';

import SelectDropdown from './common/SelectDropdown';

cytoscape.use(dagre);
cytoscapeNodeHtmlLabel(cytoscape);

const VisContainer = styled.div`
  width: 100%;
  height: 100vh;
  background-color: #f6f6f6;
  margin: 0;
`;

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

type CytoGraphProps = {
  nodes: GetCytoscapeNodesQuery['nodes'];
};

export default function CytoGraph(props: CytoGraphProps) {
  const { nodes } = props;
  const [selectedNode, setSelectedNode] = useState('');
  const router = useRouter();
  const theme = useTheme();
  const visRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const visNode = visRef.current;
    if (!visNode) return;
    const elements: ElementDefinition[] = [];

    // Nodes
    nodes.forEach((node) => {
      function getBackgroundColor() {
        if (node.__typename == 'ActionNode') {
          if (node.group?.color) {
            const actionColor = chroma(node.group.color).brighten().hex();
            return actionColor;
          }
          return '#00ff00';
        }
        if (node.quantity == 'emissions') {
          if (node.color) {
            return node.color;
          }
          return '#aaaaaa';
        }
        if (node.quantity == 'energy') {
          return '#ff0000';
        }
        if (node.quantity == 'emission_factor') {
          return '#ffff00';
        }
        return '#eeeeee';
      }
      let label = wordWrap(node.name, 30);
      const latestHistorical = node.metric?.historicalValues?.[0];
      let hist;
      if (latestHistorical) {
        const val = latestHistorical.value;
        hist = {
          year: latestHistorical.year,
          value: val < 0 ? val.toPrecision(3) : val.toFixed(0),
          unit: node.unit?.htmlShort,
        };
        label += `\n${hist.year}: ${hist.value} ${hist.unit}`;
      }
      const bgColor = getBackgroundColor();
      let textColor = '#000000';
      const whiteContrast = getContrast(bgColor, textColor);
      if (whiteContrast < 8) textColor = '#ffffff';

      const element: NodeDefinition = {
        group: 'nodes',
        data: {
          id: node.id,
          backgroundColor: bgColor,
          textColor,
          name: node.name,
          hist,
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
            source: node.id,
            target: target.id,
            label: '',
            color: 'teal',
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
              source: node.id,
              target: sub.id,
              label: '',
              color: 'teal',
              type: 'parent',
            },
          };
          elements.push(edge);
        });
      }
    });

    const cyLayoutOptions: DagreLayoutOptions = {
      name: 'dagre',
      ranker: 'tight-tree',
      edgeWeight: (edge) => (edge.data('type') === 'parent' ? 5 : 1),
      nodeDimensionsIncludeLabels: true,
      animate: false,
      rankDir: 'TB',
      animationDuration: 2000,
    };

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
      'font-weight': theme.fontWeightBold,
      width: 2,
    };

    const nodeStyle: cytoscape.Css.Node = {
      shape: 'rectangle',
      'background-color': 'data(backgroundColor)',
      //color: 'data(textColor)',
      color: '#cccccc',
      width: 'label',
      height: 'label',
      'text-valign': 'center',
      padding: '24px',
      label: 'data(label)',
      'text-opacity': 0,
      'text-wrap': 'wrap',
      'text-outline-width': 0,
      'font-weight': theme.fontWeightNormal,
      'border-width': (node) => (node.data('type') === 'action' ? '2px' : '0px'),
      'border-color': '#000000',
      'border-style': 'dashed',
    };

    const cy: cytoscape.Core = cytoscape({
      container: visNode,
      elements,
      layout: cyLayoutOptions,
      zoomingEnabled: true,
      maxZoom: 2,
      minZoom: 0.1,
      style: [
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
          style: edgeStyle,
        },
      ],
    });

    if (selectedNode) {
      const node = cy.getElementById(selectedNode);
      const keepNodes = node.predecessors().union(node.successors()).add(node);
      const removeNodes = cy.nodes().difference(keepNodes);
      removeNodes.remove();
      cy.layout(cyLayoutOptions).run();
      cy.center(node);
    } else {
      cy.layout(cyLayoutOptions).run();
      cy.center();
    }

    cy.nodes().on('click', (e) => {
      const clickedNode = e.target;
      const nodeId = clickedNode.data('id');
      router.push(`/node/${nodeId}`);
    });
    cy.nodeHtmlLabel([
      {
        query: 'node',
        valign: 'center',
        halign: 'center',
        valignBox: 'center',
        halignBox: 'center',
        tpl: (data) => {
          const name = wordWrap(data.name, 30, '<br />');
          const histStr = data.hist
            ? `<br />${data.hist.year}: <em>${data.hist.value} ${data.hist.unit}</em>`
            : '';
          return `<div style="color: ${data.textColor}"><strong>${name}</strong>${histStr}</div>`;
        },
      },
    ]);
  }, [visRef, nodes, router, selectedNode]);

  return (
    <>
      <NodeSelector nodes={nodes} selectedNode={selectedNode} setSelectedNode={setSelectedNode} />
      <VisContainer ref={visRef} />
    </>
  );
}
