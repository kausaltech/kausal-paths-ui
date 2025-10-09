import { memo } from 'react';

import { Badge, Box, Typography } from '@mui/material';
import {
  Handle,
  type Node,
  type NodeProps,
  Position,
  type ReactFlowState,
  useStore,
} from '@xyflow/react';

import { NodeTypeIcon, getNodeTypeColor, getNodeTypeLabel } from './NodeProcessing';

const zoomSelector = (s: ReactFlowState) => s.transform[2] >= 0.9;

type DefaultNode = Node<
  {
    isVisible?: boolean;
    label?: string;
    nodeType?: string;
    typeLabel?: string;
    muted?: boolean;
    inputDatasets?: number;
  },
  'isVisible' | 'label' | 'nodeType' | 'typeLabel' | 'inputDatasets' | 'muted'
>;

const DefaultNode = (props: NodeProps<DefaultNode>) => {
  const { data, width, height, selected } = props;
  const { label, nodeType, muted } = data;
  const showContent = useStore(zoomSelector);

  const isActionNode = nodeType?.toLowerCase().includes('action');
  const truncateText = (text: string | undefined, maxLength: number = 40): string => {
    if (!text) return '';
    return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
  };
  return (
    <Badge
      color="secondary"
      badgeContent={data.inputDatasets}
      invisible={data.inputDatasets === 0}
      variant={showContent ? 'standard' : 'dot'}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'left',
      }}
    >
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
          opacity: muted ? 0.25 : 1,
        }}
      >
        <Handle type="target" position={Position.Left} />
        <Box sx={{ padding: '3px', backgroundColor: getNodeTypeColor(data.nodeType || '').bg }}>
          {' '}
          <Typography
            variant="body2"
            sx={{ fontSize: '10px', lineHeight: '1.1', hyphens: 'auto', maxWidth: '100%' }}
          >
            <NodeTypeIcon nodeType={data.nodeType} size={10} /> {getNodeTypeLabel(data.nodeType)}
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
    </Badge>
  );
};

export default memo(DefaultNode);
