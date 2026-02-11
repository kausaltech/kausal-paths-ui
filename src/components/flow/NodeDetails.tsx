import { gql, useQuery } from '@apollo/client';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Chip,
  Container,
  Paper,
  Typography,
} from '@mui/material';
import { Dash, PlusLg } from 'react-bootstrap-icons';
import { useTranslation } from 'react-i18next';

import { logApolloError } from '@common/logging/apollo';

import type { NodeDetailsQuery } from '@/common/__generated__/graphql';
import ErrorMessage from '@/components/common/ErrorMessage';
import GraphQLError from '@/components/common/GraphQLError';
import dimensionalNodePlotFragment from '@/queries/dimensionalNodePlot';
import type { Action, ConfigNode, Dataset, NodeReference } from '@/types/config.types';

import ContentLoader from '../common/ContentLoader';
import { NodeTypeIcon, getNodeTypeColor } from './NodeProcessing';

const GET_NODE_DETAILS = gql`
  query NodeDetails($node: ID!, $scenarios: [String!]) {
    node(id: $node) {
      id
      nodeType
      name
      shortDescription
      description
      explanation
      tags
      color
      unit {
        htmlShort
      }
      quantity
      inputDimensions
      inputNodes {
        id
        name
        shortDescription
        color
        unit {
          htmlShort
        }
        quantity
      }
      outputDimensions
      outputNodes {
        id
        name
        shortDescription
        color
        unit {
          htmlShort
        }
        quantity
      }
      ...DimensionalNodeMetric
    }
  }
  ${dimensionalNodePlotFragment}
`;

const CustomExpandIcon = () => {
  return (
    <Box
      sx={{
        '.Mui-expanded & > .collapsIconWrapper': {
          display: 'none',
        },
        '.expandIconWrapper': {
          display: 'none',
        },
        '.Mui-expanded & > .expandIconWrapper': {
          display: 'block',
        },
      }}
    >
      <div className="expandIconWrapper">
        <Dash />
      </div>
      <div className="collapsIconWrapper">
        <PlusLg />
      </div>
    </Box>
  );
};

const InputDatasets = ({ datasets }: { datasets: Dataset[] }) => {
  return (
    <Accordion defaultExpanded>
      <AccordionSummary
        expandIcon={<CustomExpandIcon />}
        aria-controls="input-datasets-content"
        id="input-datasets-header"
      >
        Input Datasets ({datasets.length})
      </AccordionSummary>
      <AccordionDetails>
        {datasets.map((dataset) => (
          <Paper elevation={1} key={dataset.id} sx={{ p: 1, mb: 1 }}>
            <Typography variant="h5" sx={{ wordBreak: 'break-word', mb: 1 }}>
              {dataset.id}
            </Typography>
            {dataset.tags && dataset.tags.length > 0 && (
              <Box sx={{ fontSize: '0.8rem' }}>
                {dataset.tags.map((tag) => `#${tag}`).join(' ')}
              </Box>
            )}
            <Box sx={{ fontSize: '0.8rem' }}>Column: {dataset.column}</Box>
            {dataset.filters && dataset.filters.length > 0 && (
              <Box sx={{ fontSize: '0.8rem' }}>
                Filters:
                <ul>
                  {dataset.filters.map((filter) => (
                    <li key={filter.column}>
                      {filter.column}{' '}
                      {filter.values && filter.values.length > 0 && `[${filter.values.join(', ')}]`}
                      {filter.value && `(${filter.value})`}
                    </li>
                  ))}
                </ul>
              </Box>
            )}
          </Paper>
        ))}
      </AccordionDetails>
    </Accordion>
  );
};

const ConnectedNode = ({ nodeConnection }: { nodeConnection: NodeReference }) => {
  return (
    <Paper elevation={1} sx={{ p: 1, mb: 1 }}>
      <Typography variant="h5" sx={{ wordBreak: 'break-word', mb: 1 }}>
        {nodeConnection.id}
      </Typography>
      {nodeConnection.tags && nodeConnection.tags.length > 0 && (
        <Box sx={{ fontSize: '0.8rem' }}>
          {nodeConnection.tags.map((tag) => `#${tag}`).join(' ')}
        </Box>
      )}
      {nodeConnection.from_dimensions && nodeConnection.from_dimensions.length > 0 && (
        <Box sx={{ fontSize: '0.8rem' }}>
          {nodeConnection.from_dimensions
            .map((dimension) => `${dimension.id}: (${dimension.categories?.join(', ')})`)
            .join(' ')}
        </Box>
      )}
      {nodeConnection.to_dimensions && nodeConnection.to_dimensions.length > 0 && (
        <Box sx={{ fontSize: '0.8rem' }}>
          {nodeConnection.to_dimensions.map((dimension) => `#${dimension.id}`).join(' ')}
        </Box>
      )}
    </Paper>
  );
};

export interface NodeDetailsProps {
  nodeExtras: ConfigNode | Action | null;
  nodeId: string | null;
  defaultLanguage?: string;
}

const NodeDetails = ({ nodeId, nodeExtras, defaultLanguage }: NodeDetailsProps) => {
  const { t } = useTranslation();
  const { loading, error, data } = useQuery<NodeDetailsQuery>(GET_NODE_DETAILS, {
    variables: {
      node: nodeId,
      scenarios: null,
    },
  });

  if (loading) {
    return <ContentLoader />;
  }

  if (error || !data) {
    if (error) {
      logApolloError(error);
    }
    return <Container className="pt-5">{error && <GraphQLError error={error} />}</Container>;
  }

  const { node } = data;

  if (!node) {
    return (
      <Container className="pt-5">
        <ErrorMessage message={t('page-not-found')} />
      </Container>
    );
  }

  const nodeName = node.name;
  const nodeDescription = node.description || node.shortDescription;
  const nodeTypeIcon = node?.nodeType ? (
    <NodeTypeIcon nodeType={node.nodeType} size={16} style={{ margin: '0 -0.25rem 0 0.5rem' }} />
  ) : null;
  const nodeTypeColor = node?.nodeType
    ? getNodeTypeColor(node.nodeType)
    : { bg: '#fafafa', border: '#bdbdbd' };

  console.log('NodeDetails', { node, defaultLanguage, nodeName });

  return (
    <Box sx={{ padding: 1 }}>
      {node?.nodeType && (
        <Chip
          label={node.nodeType.replace('nodes.', '').replace('actions.', '').replace('.', ' ')}
          icon={nodeTypeIcon ? nodeTypeIcon : undefined}
          sx={{
            backgroundColor: nodeTypeColor.bg,
            mb: 1,
            '& .MuiChip-label': {
              color: nodeTypeColor.border,
              fontWeight: 500,
            },
          }}
        />
      )}
      <Box sx={{ mb: 2 }}>
        <Typography variant="h3" sx={{ mb: 1 }}>
          {nodeName}
        </Typography>
        {node.tags && node.tags.length > 0 && (
          <Box sx={{ fontSize: '0.8rem' }}>{node.tags.map((tag) => `#${tag}`).join(' ')}</Box>
        )}
        {node?.unit && <Chip label={`${node.unit.htmlShort} (${node.quantity})`} size="small" />}
      </Box>

      {/*----- Description -----*/}
      {nodeDescription && (
        <Accordion defaultExpanded>
          <AccordionSummary
            expandIcon={<CustomExpandIcon />}
            aria-controls="input-dimensions-content"
            id="input-dimensions-header"
          >
            Description
          </AccordionSummary>
          <AccordionDetails>
            <Paper
              sx={{ p: 1, fontSize: '0.7rem', overflow: 'auto' }}
              dangerouslySetInnerHTML={{ __html: nodeDescription }}
            />
          </AccordionDetails>
        </Accordion>
      )}
      {node.explanation && (
        <Accordion defaultExpanded>
          <AccordionSummary
            expandIcon={<CustomExpandIcon />}
            aria-controls="explanation-content"
            id="explanation-header"
          >
            Explanation
          </AccordionSummary>
          <AccordionDetails>
            <Paper
              sx={{ p: 1, fontSize: '0.7rem', overflow: 'auto' }}
              dangerouslySetInnerHTML={{ __html: node.explanation }}
            />
          </AccordionDetails>
        </Accordion>
      )}

      {/*----- Input -----*/}

      <Typography variant="h5" sx={{ mb: 1, mt: 2 }}>
        Input
      </Typography>
      {nodeExtras?.input_dimensions && nodeExtras.input_dimensions.length > 0 && (
        <Accordion defaultExpanded>
          <AccordionSummary
            expandIcon={<CustomExpandIcon />}
            aria-controls="input-nodes-content"
            id="input-nodes-header"
          >
            Input Dimensions ({nodeExtras.input_dimensions.length})
          </AccordionSummary>
          <AccordionDetails>
            {nodeExtras.input_dimensions.map((inputDimension) => (
              <Chip key={inputDimension} label={inputDimension} size="small" />
            ))}
          </AccordionDetails>
        </Accordion>
      )}
      {nodeExtras?.input_nodes && nodeExtras.input_nodes.length > 0 && (
        <Accordion defaultExpanded>
          <AccordionSummary
            expandIcon={<CustomExpandIcon />}
            aria-controls="input-nodes-content"
            id="input-nodes-header"
          >
            Input Nodes ({nodeExtras.input_nodes.length})
          </AccordionSummary>
          <AccordionDetails>
            {nodeExtras?.input_nodes.map((inputNode) => (
              <ConnectedNode nodeConnection={inputNode} key={inputNode.id} />
            ))}
          </AccordionDetails>
        </Accordion>
      )}
      {nodeExtras?.input_datasets && nodeExtras.input_datasets.length > 0 && (
        <InputDatasets datasets={nodeExtras.input_datasets} />
      )}
    </Box>
  );
};

export default NodeDetails;
