import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import type { GetCytoscapeNodesQuery } from 'common/__generated__/graphql';
import { useTranslation } from 'common/i18n';
import Cytoscape, {
  type EdgeDefinition,
  type ElementDefinition,
  type NodeDefinition,
} from 'cytoscape';

import dagre, { type DagreLayoutOptions } from 'cytoscape-dagre';
import elk, { type ElkLayoutOptions } from 'cytoscape-elk';
// @ts-ignore
//import pdfExport from 'cytoscape-pdf-export';

import { readableColor } from 'polished';
import styled from 'styled-components';

import SelectDropdown from './common/SelectDropdown';
import { DropdownItem, DropdownMenu, DropdownToggle, UncontrolledDropdown } from 'reactstrap';
import Icon from './common/icon';

const GraphContainer = styled.div`
  background-color: ${(props) => props.theme.graphColors.grey005};
  width: 100%;
  height: 800px;
  position: relative;
`;

const Toolbar = styled.div`
  display: flex;
  flex-direction: row;
  gap: 10px;
  padding: 1rem 1rem 0 1rem;
  margin-bottom: 10px;
`;

Cytoscape.use(dagre);
Cytoscape.use(elk);
function getBackgroundColor(node: GetCytoscapeNodesQuery['nodes'][0]) {
  const nodeColors = {
    action: '#0A5E43',
    emissions: '#682901',
    utility: '#AAC5DB',
    effect: '#F4CE73',
    currency: '#B2DFC2',
    unit_price: '#6BBC95',
    energy: '#E37D7D',
    emission_factor: '#FDF1D2',
    argument: '#ff7354',
  };

  if (node.__typename == 'ActionNode') {
    if (node.group?.color) {
      const actionColor = node.group.color;
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

type LayoutSelectorProps = {
  layoutId: string;
  setLayout: React.Dispatch<React.SetStateAction<any>>;
};

function LayoutSelector(props: LayoutSelectorProps) {
  const { layoutId, setLayout } = props;
  const options = graphSettings.map((setting) => ({
    id: setting.id,
    label: setting.label,
  }));
  return (
    <SelectDropdown
      id="layout"
      //label={t('choose-node')!}
      onChange={(val) =>
        setLayout(val ? graphSettings.find((s) => s.id === val.id) : graphSettings[0])
      }
      options={options}
      value={layoutId ? options.find((o) => o.id === layoutId) || null : null}
      isMulti={false}
    />
  );
}

const DownloadSelector = (props: {
  handleExport: (format: 'jpg' | 'png' | 'json' | 'pdf') => void;
}) => {
  const { handleExport } = props;
  const { t } = useTranslation();
  return (
    <UncontrolledDropdown size="md">
      <DropdownToggle caret size="md">
        <Icon name="download" />
        {` ${t('download-data')}`}
      </DropdownToggle>
      <DropdownMenu>
        <DropdownItem onClick={(e) => handleExport('jpg')}>
          <Icon name="file" /> JPG
        </DropdownItem>
        <DropdownItem onClick={(e) => handleExport('png')}>
          <Icon name="file" /> PNG
        </DropdownItem>
        <DropdownItem onClick={(e) => handleExport('json')}>
          <Icon name="file" /> JSON
        </DropdownItem>
        <DropdownItem onClick={(e) => handleExport('pdf')}>
          <Icon name="file" /> PDF
        </DropdownItem>
      </DropdownMenu>
    </UncontrolledDropdown>
  );
};

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

const edgeStyle: Cytoscape.Css.Edge = {
  label: 'data(label)',
  'target-text-offset': 1,
  'target-arrow-shape': 'chevron',
  'target-arrow-color': 'data(color)',
  'arrow-scale': 1,
  'source-arrow-shape': 'circle',
  'source-arrow-color': 'data(color)',
  'line-color': 'data(color)',
  'text-outline-width': 3,
  'text-outline-color': 'data(color)',
  width: 3,
};

/*
  'background-gradient-stop-colors': (node) =>
    `${node.data('themeColor')} ${node.data('themeColor')} ${node.data('backgroundColor')}`,
  'background-gradient-stop-positions': '0 3 3.5',
  'background-gradient-direction': 'to-right',
*/

const nodeStyle: Cytoscape.Css.Node = {
  shape: 'rectangle',
  'background-color': (node) => node.data('backgroundColor'),
  color: (node) => node.data('textColor'),
  'text-valign': 'center',
  padding: '24px',
  label: 'data(label)',
  'text-opacity': 1,
  'text-wrap': 'wrap',
  'text-outline-width': 0,
  'font-weight': 'normal',
  width: 175,
  height: 50,
};

const nodeToElement = (node: GetCytoscapeNodesQuery['nodes'][0]) => {
  const latestHistorical = node.metric?.historicalValues?.[0];

  const latest = {
    year: undefined,
    value: '',
    unit: (() => {
      // Minimal sanitization to satisfy CodeQL warning about incomplete tags
      let text = node.unit?.htmlShort || '';

      // Keep removing tags until none remain (prevents pattern re-emergence)
      let previousLength;
      do {
        previousLength = text.length;
        // Remove both complete tags and incomplete tags (missing closing >)
        text = text.replace(/<[^>]*>?/g, '');
      } while (text.length !== previousLength);

      // Basic entity decoding for common unit symbols
      return text
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&deg;/g, '°')
        .replace(/&sup2;/g, '²')
        .replace(/&sup3;/g, '³')
        .replace(/&micro;/g, 'µ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&');
    })(),
  };
  if (latestHistorical) {
    const val = latestHistorical.value;
    latest.year = latestHistorical.year;
    latest.value = val < 0 ? val.toPrecision(3) : val.toFixed(0);
  }

  const label = `${wordWrap(node.name, 30)}\n${latest.value !== '' ? `${latest.year}: ${latest.value} ${latest.unit}` : ''}`;
  //const label = "this can be anything and it doesn't matter";

  const textColor = readableColor(getBackgroundColor(node));
  //const textColor = '#000000';
  const element: NodeDefinition = {
    group: 'nodes',
    data: {
      id: node.id,
      backgroundColor: getBackgroundColor(node),
      textColor,
      name: node.name,
      hist: latest,
      label: label,
      isVisible: node.isVisible,
      type: node.__typename == 'ActionNode' ? 'action' : 'node',
    },
  };
  return element;
};

const edgesToElements = (node: GetCytoscapeNodesQuery['nodes'][0]) => {
  const edges: EdgeDefinition[] = [];
  node.outputNodes.forEach((target) => {
    const edge: EdgeDefinition = {
      group: 'edges',
      data: {
        id: `${node.id}-${target.id}`,
        source: node.id,
        target: target.id,
        label: '',
        color: '#888',
        weight: 1,
      },
    };
    edges.push(edge);
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
          weight: 5,
        },
      };
      edges.push(edge);
    });
  }
  return edges;
};

async function saveAs(blob: Blob, filename: string, isPDF: boolean) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
}

type CytoGraphProps = {
  nodes: GetCytoscapeNodesQuery['nodes'];
};

export default function CytoGraph(props: CytoGraphProps) {
  const { nodes } = props;
  const [selectedNode, setSelectedNode] = useState('');
  const [layout, setLayout] = useState(graphSettings[0]);
  const [cy, setCy] = useState<Cytoscape.Core | null>(null);
  const router = useRouter();
  const cyRef = useRef<Cytoscape.Core | null>(null);

  const elements = useMemo(() => {
    const elements: ElementDefinition[] = [];
    // Nodes
    nodes.forEach((node) => {
      elements.push(nodeToElement(node));
    });
    // Edges
    nodes.forEach((node) => {
      elements.push(...edgesToElements(node));
    });
    return elements;
  }, [nodes]);

  const cyStyle = useMemo(
    () => [
      // the stylesheet for the graph
      {
        selector: '*',
        style: {
          'font-family': 'system-ui, sans-serif',
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
    ],
    [layout]
  );

  const handleNodeClick = useCallback(
    (event: Cytoscape.EventObject) => {
      const nodeId = event.target.data('id');
      router.push(`/node/${nodeId}`);
    },
    [router]
  );

  useEffect(() => {
    if (!cyRef.current) {
      return;
    }
    const registerPdfExport = async () => {
      try {
        const pdfExport = (await import('cytoscape-pdf-export')).default;
        if (!Cytoscape?.pdf) {
          Cytoscape.use(pdfExport);
        }
      } catch (error) {
        console.error('Failed to load PDF export:', error);
      }
    };
    registerPdfExport();

    const cy = Cytoscape({
      container: cyRef.current,
      elements: elements,
      style: cyStyle,
      layout: layout.options.layout,
    });
    setCy(cy);
  }, [cyRef, elements, cyStyle, layout]);

  useEffect(() => {
    if (cy) {
      cy.on('tap', 'node', handleNodeClick);
    }
  }, [cy, handleNodeClick]);

  const handleExport = useCallback(
    async (format: 'jpg' | 'png' | 'json' | 'pdf') => {
      if (cy) {
        try {
          let blob: Blob;
          switch (format) {
            case 'jpg':
              console.log('EXPORTING: jpg');
              blob = await cy.jpg({
                full: true,
                scale: 1.5,
                quality: 1,
                bg: '#ffffff',
                output: 'blob-promise',
              });
              saveAs(blob, 'graph.jpg', false);
              break;
            case 'png':
              console.log('EXPORTING: png');
              blob = await cy.png({
                full: true,
                scale: 1.5,
                bg: '#ffffff',
                output: 'blob-promise',
              });
              saveAs(blob, 'graph.png', false);
              break;
            case 'json':
              console.log('EXPORTING: json');
              const json = cy.json();
              blob = new Blob([JSON.stringify(json)], { type: 'application/json' });
              saveAs(blob, 'graph.json', false);
              break;
            case 'pdf':
              if (cy.pdf) {
                console.log('EXPORTING: pdf', layout.id);
                blob = await cy.pdf({
                  full: true,
                  paperSize: 'A4',
                  orientation: layout.id === 'orthogonal-lr' ? 'PORTRAIT' : 'LANDSCAPE',
                  bg: '#ffffff',
                });
                saveAs(blob, 'graph.pdf', true);
              }
          }
        } catch (error) {
          console.error('Export failed:', error);
        }
      }
    },
    [cy]
  );

  return (
    <GraphContainer>
      <Toolbar>
        <NodeSelector nodes={nodes} selectedNode={selectedNode} setSelectedNode={setSelectedNode} />
        <LayoutSelector layoutId={layout.id} setLayout={setLayout} />
        <DownloadSelector handleExport={handleExport} />
      </Toolbar>
      <div ref={cyRef} style={{ width: '100%', height: '100%', backgroundColor: '#ffffff' }} />
    </GraphContainer>
  );
}
