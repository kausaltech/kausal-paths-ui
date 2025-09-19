import { Box, Typography } from '@mui/material';
import { Handle, type Node, type NodeProps, Position } from '@xyflow/react';

type ActionNode = Node<{ isVisible?: boolean; label?: string }, 'isVisible' | 'label'>;

const ActionNode = (props: NodeProps<ActionNode>) => {
  const { data, width, height } = props;
  const { isVisible, label } = data;

  return (
    <Box
      onClick={() => {
        console.log('ActionNode clicked', props);
      }}
      sx={{
        width,
        height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'red',
        padding: '10px',
        borderRadius: '0.5rem',
      }}
    >
      <Handle type="target" position={Position.Top} />
      <Typography variant="body1">{label}</Typography>
      <Handle type="source" position={Position.Bottom} />
    </Box>
  );
};

export default ActionNode;
