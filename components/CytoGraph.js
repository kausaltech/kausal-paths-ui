import React from 'react';
import PropTypes from 'prop-types';
import {
  Col, Container, Row, UncontrolledButtonDropdown, DropdownToggle, DropdownMenu, DropdownItem,
} from 'reactstrap';
import styled, { withTheme } from 'styled-components';
import cytoscape from 'cytoscape';
import dagre from 'cytoscape-dagre';

cytoscape.use(dagre);

const VisContainer = styled.div`
  width: 100%;
  height: 1000px;
  background-color: #f6f6f6;
  margin: 0;
`;

function wordWrap(inputStr, maxWidth) {
  const newLineStr = '\n';
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

/* eslint-disable react/static-property-placement */
class CytoGraph extends React.Component {
  static propTypes = {
    nodes: PropTypes.arrayOf(PropTypes.object).isRequired,
  };

  constructor(props) {
    super(props);
    this.visRef = React.createRef();
  }

  componentDidMount() {
    const { nodes } = this.props;

    if (!nodes) {
      return;
    }
    this.renderNetwork();
  }

  componentDidUpdate() {
    const { nodes } = this.props;

    if (!nodes) {
      return;
    }
    this.renderNetwork();
  }

  renderNetwork() {
    const visNode = this.visRef.current;
    const { nodes, theme } = this.props;
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
      const element = {
        group: 'nodes',
        data: {
          id: node.id,
          backgroundColor: getBackgroundColor(),
          label: wordWrap(node.name, 30),
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
            color: '#000000',
            width: 'label',
            height: 'label',
            'text-valign': 'center',
            padding: '24px',
            label: 'data(label)',
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
    this.cy = cy;
  }

  render() {
    return (
      <VisContainer ref={this.visRef} />
    );
  }
}

export default withTheme(CytoGraph);
