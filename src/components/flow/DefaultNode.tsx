import { memo } from 'react';

import { Box, Typography } from '@mui/material';
import { Handle, type Node, type NodeProps, Position } from '@xyflow/react';

type DefaultNode = Node<{ isVisible?: boolean; label?: string }, 'isVisible' | 'label'>;

const DefaultNode = (props: NodeProps<DefaultNode>) => {
  const { data, width, height, selected } = props;
  const { label } = data;

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
        alignItems: 'flex-start',
        justifyContent: 'flex-start',
        backgroundColor: 'white',
        padding: '5px',
        borderRadius: '3px',
        boxShadow: selected ? 4 : 2,
        border: selected ? '1px solid #3c2a2a' : 'none',
      }}
    >
      <Handle type="target" position={Position.Left} />
      <Typography
        variant="body2"
        sx={{ fontSize: '10px', lineHeight: '1.1', hyphens: 'auto', maxWidth: '100%' }}
      >
        {truncateText(label)}
      </Typography>
      <Handle type="source" position={Position.Right} />
    </Box>
  );
};

export default memo(DefaultNode);
