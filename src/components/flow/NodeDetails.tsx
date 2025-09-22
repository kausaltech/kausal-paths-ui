import { Box, Chip, Divider, Paper, Stack, Typography } from '@mui/material';

import type { Action, ConfigNode } from '@/types/config.types';

import {
  getLocalizedDescription,
  getLocalizedName,
  getNodeTypeColor,
  getNodeTypeIcon,
} from './NodeProcessing';

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
  const nodeTypeIcon = node?.type ? getNodeTypeIcon(node.type) : null;
  const nodeTypeColor = node?.type
    ? getNodeTypeColor(node.type)
    : { bg: '#fafafa', border: '#bdbdbd' };

  console.log('NodeDetails', { node, defaultLanguage, nodeName });

  return (
    <Box sx={{ padding: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        {nodeTypeIcon}
        <Typography variant="h5" sx={{ flexGrow: 1 }}>
          {nodeName}
        </Typography>
      </Box>

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

      <Divider sx={{ my: 2 }} />
      {nodeDescription && (
        <Typography variant="body2" dangerouslySetInnerHTML={{ __html: nodeDescription }} />
      )}
      <Divider sx={{ my: 2 }} />
      <Stack direction="column" spacing={2}>
        {node?.quantity && <Paper sx={{ p: 1 }}>Quantity: {node.quantity}</Paper>}
        {node?.unit && <Paper sx={{ p: 1 }}>Unit: {node.unit}</Paper>}
        {'group' in node && (node as Action).group && (
          <Paper sx={{ p: 1 }}>Group: {(node as Action).group}</Paper>
        )}
      </Stack>
    </Box>
  );
};

export default NodeDetails;
