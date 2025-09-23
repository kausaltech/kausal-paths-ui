import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Chip,
  Divider,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { PlusLg } from 'react-bootstrap-icons';

import type { Action, ConfigNode, Dataset, NodeReference } from '@/types/config.types';

import {
  NodeTypeIcon,
  getLocalizedDescription,
  getLocalizedName,
  getNodeTypeColor,
} from './NodeProcessing';

const InputDatasets = ({ datasets }: { datasets: Dataset[] }) => {
  return (
    <Accordion>
      <AccordionSummary expandIcon={<PlusLg />} aria-controls="panel1-content" id="panel1-header">
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
  node: ConfigNode | Action | null;
  defaultLanguage?: string;
}

const NodeDetails = ({ node, defaultLanguage }: NodeDetailsProps) => {
  if (!node) {
    return <Box sx={{ padding: 2 }}>No details available</Box>;
  }

  const nodeName = getLocalizedName(node, defaultLanguage);
  const nodeDescription = getLocalizedDescription(node, defaultLanguage);
  const nodeTypeIcon = node?.type ? <NodeTypeIcon nodeType={node.type} size={20} /> : null;
  const nodeTypeColor = node?.type
    ? getNodeTypeColor(node.type)
    : { bg: '#fafafa', border: '#bdbdbd' };

  console.log('NodeDetails', { node, defaultLanguage, nodeName });

  return (
    <Box sx={{ padding: 1 }}>
      {node?.type && (
        <Chip
          label={node.type}
          size="small"
          sx={{
            backgroundColor: nodeTypeColor.bg,
            borderColor: nodeTypeColor.border,
            border: `1px solid ${nodeTypeColor.border}`,
            '& .MuiChip-label': {
              color: nodeTypeColor.border,
              fontWeight: 500,
            },
          }}
        />
      )}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        {nodeTypeIcon}
        <Typography variant="h5" sx={{ flexGrow: 1 }}>
          {nodeName}
        </Typography>
        {node.tags && node.tags.length > 0 && (
          <Box sx={{ fontSize: '0.8rem' }}>{node.tags.map((tag) => `#${tag}`).join(' ')}</Box>
        )}
      </Box>

      <Divider sx={{ my: 2 }} />
      {nodeDescription && (
        <Typography variant="body2" dangerouslySetInnerHTML={{ __html: nodeDescription }} />
      )}
      <Divider sx={{ my: 2 }} />
      <Stack direction="column" spacing={1}>
        {node?.quantity && <Paper sx={{ p: 1 }}>Quantity: {node.quantity}</Paper>}
        {node?.unit && <Paper sx={{ p: 1 }}>Unit: {node.unit}</Paper>}
        {'group' in node && (node as Action).group && (
          <Paper sx={{ p: 1 }}>Group: {(node as Action).group}</Paper>
        )}
      </Stack>
      <Divider sx={{ my: 2 }} />
      <Stack direction="column" spacing={1}>
        <Typography variant="h4">Input</Typography>
        {node?.input_dimensions && node.input_dimensions.length > 0 && (
          <Accordion>
            <AccordionSummary
              expandIcon={<PlusLg />}
              aria-controls="panel1-content"
              id="panel1-header"
            >
              Input Dimensions ({node.input_dimensions.length})
            </AccordionSummary>
            <AccordionDetails>
              {node.input_dimensions.map((inputDimension) => (
                <Chip key={inputDimension} label={inputDimension} size="small" />
              ))}
            </AccordionDetails>
          </Accordion>
        )}
        {node?.input_nodes && node.input_nodes.length > 0 && (
          <Accordion>
            <AccordionSummary
              expandIcon={<PlusLg />}
              aria-controls="panel1-content"
              id="panel1-header"
            >
              Input Nodes ({node.input_nodes.length})
            </AccordionSummary>
            <AccordionDetails>
              {node.input_nodes.map((inputNode) => (
                <ConnectedNode nodeConnection={inputNode} key={inputNode.id} />
              ))}
            </AccordionDetails>
          </Accordion>
        )}
        {node?.input_datasets && node.input_datasets.length > 0 && (
          <InputDatasets datasets={node.input_datasets} />
        )}
      </Stack>
    </Box>
  );
};

export default NodeDetails;
