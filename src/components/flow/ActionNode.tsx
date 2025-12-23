import { Box, Typography } from '@mui/material';
import { Handle, type Node, type NodeProps, Position } from '@xyflow/react';

type ActionNode = Node<
  { isVisible?: boolean; label?: string; color?: string },
  'isVisible' | 'label' | 'color'
>;

const ActionNode = (props: NodeProps<ActionNode>) => {
  const { data, width, height } = props;
  const { label, color } = data;

  const truncateText = (text: string | undefined, maxLength: number = 40): string => {
    if (!text) return '';
    return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
  };

  return (
    <Box
      onClick={() => {
        console.log('ActionNode clicked', props);
      }}
      sx={{
        width,
        height,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        backgroundColor: 'grey.100',
        padding: '10px',
        borderRadius: '0.5rem',
        borderLeft: `6px solid ${color || 'blue'}`,
        boxShadow: 2,
      }}
    >
      <Handle type="target" position={Position.Left} />
      <Typography
        variant="body2"
        sx={{ fontSize: '0.8rem', lineHeight: '1.2', hyphens: 'auto', maxWidth: '100%' }}
      >
        {truncateText(label)}
      </Typography>
      <Handle type="source" position={Position.Right} />
    </Box>
  );
};

export default ActionNode;
