import { memo } from 'react';

import { Box, Typography } from '@mui/material';
import { Handle, type Node, type NodeProps, Position } from '@xyflow/react';

import { getNodeTypeColor } from './NodeProcessing';

type DefaultNode = Node<
  { isVisible?: boolean; label?: string; nodeType?: string; typeLabel?: string },
  'isVisible' | 'label' | 'nodeType' | 'typeLabel'
>;

const DefaultNode = (props: NodeProps<DefaultNode>) => {
  const { data, width, height, selected } = props;
  const { label, nodeType } = data;

  const isActionNode = nodeType?.toLowerCase().includes('action');
  const truncateText = (text: string | undefined, maxLength: number = 40): string => {
    if (!text) return '';
    return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
  };
  return (
    <Box
      sx={{
        width,
        height,
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '3px',
        boxShadow: selected ? 4 : 2,
        border: selected ? '1px solid #3c2a2a' : 'none',
        backgroundColor: isActionNode ? 'grey.200' : 'white',
      }}
    >
      <Handle type="target" position={Position.Left} />
      <Box sx={{ padding: '3px', backgroundColor: getNodeTypeColor(data.nodeType || '').bg }}>
        {' '}
        <Typography
          variant="body2"
          sx={{ fontSize: '10px', lineHeight: '1.1', hyphens: 'auto', maxWidth: '100%' }}
        >
          {data.nodeType}
        </Typography>
      </Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'flex-start',
          padding: '3px',
        }}
      >
        <Typography
          variant="body2"
          sx={{ fontSize: '10px', lineHeight: '1.1', hyphens: 'auto', maxWidth: '100%' }}
        >
          {truncateText(label)}
        </Typography>
      </Box>
      <Handle type="source" position={Position.Right} />
    </Box>
  );
};

export default memo(DefaultNode);
