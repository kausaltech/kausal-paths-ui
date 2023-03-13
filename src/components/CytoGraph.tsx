import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';
import { useRouter, } from 'next/router'
import cytoscape from 'cytoscape';
import dagre from 'cytoscape-dagre';
import cytoscapeNodeHtmlLabel from 'cytoscape-node-html-label';
import { getContrast, } from 'polished';
import { GetCytoscapeNodesQuery } from 'common/__generated__/graphql';
import { useTheme } from 'common/theme';

cytoscape.use(dagre);
cytoscapeNodeHtmlLabel(cytoscape);

const VisContainer = styled.div`
  width: 100%;
  height: 1000px;
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

type CytoGraphProps = {
  nodes: GetCytoscapeNodesQuery['nodes'],
}

export default function CytoGraph(props: CytoGraphProps) {
  const { nodes } = props;
  const router = useRouter();
  const theme = useTheme();
  const visRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const visNode = visRef.current;
    if (!visNode) return;
    const elements = [];
  
    // Nodes
    nodes.forEach((node) => {
      function getBackgroundColor() {
        if (node.isAction) {
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
          unit: node.unit.htmlShort,
        };
        label += `\n${hist.year}: ${hist.value} ${hist.unit}`
      }
      const bgColor = getBackgroundColor();
      let textColor = '#000000';
      const whiteContrast = getContrast(bgColor, textColor);
      if (whiteContrast < 8) textColor = '#ffffff'
      const element = {
        group: 'nodes',
        data: {
          id: node.id,
          backgroundColor: bgColor,
          textColor,
          name: node.name,
          hist,
          label: label,
        },
      };
      elements.push(element);
    });

    // Edges
    nodes.forEach((node) => {
      node.outputNodes.forEach((target) => {
        const element = {
          group: 'edges',
          data: {
            source: node.id,
            target: target.id,
            label: '',
            color: 'teal',
          },
        };
        elements.push(element);
      });
    });

    const cyLayoutOptions = {
      name: 'dagre',
      ranker: 'longest-path',
      edgeWeight: 1,
      nodeDimensionsIncludeLabels: true,
      animate: false,
      animateDuration: 2000,
      zoom: 0.5,
      pan: { x: 0, y: 0 },
    };

    const cy = cytoscape({
      container: visNode,
      elements,
      layout: cyLayoutOptions,
      zoomingEnabled: true,
      maxZoom: 2,
      minZoom: 0.1,
      style: [ // the stylesheet for the graph
        {
          selector: '*',
          style: {
            'font-family': `${theme.fontFamily}, sans-serif`,
          },
        },
        {
          selector: 'node',
          style: {
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
          },
        },
        {
          selector: 'edge',
          style: {
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
          },
        },
      ],
    });
    cy.nodes().on('click', (e) => {
      const clickedNode = e.target;
      const nodeId = clickedNode.data('id');
      router.push(`/node/${nodeId}`);
    });
    cy.nodeHtmlLabel([{
      query: 'node',
      valign: "center",
      halign: "center",
      valignBox: "center",
      halignBox: "center",
      tpl: (data) => {
        const name = wordWrap(data.name, 30, '<br />');
        const histStr = data.hist ? `<br />${data.hist.year}: <em>${data.hist.value} ${data.hist.unit}</em>` : '';
        return `<div style="color: ${data.textColor}"><strong>${name}</strong>${histStr}</div>`;
      }
    }])
  }, [visRef, nodes, router]);

  return (
    <VisContainer ref={visRef} />
  );
}
