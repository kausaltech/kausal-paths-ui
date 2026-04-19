import type { ReactNode } from 'react';

import { Box, Chip, Collapse, Typography } from '@mui/material';

import { ChevronDown, ChevronRight, DashCircle } from 'react-bootstrap-icons';

import type { EditorNodeFieldsFragment } from '@/common/__generated__/graphql';
import { type NodeStyle, getNodeStyle } from '../ElkNode';
import { getNodeSpec, getNodeType } from '../nodeHelpers';

export function getStyleForNode(node: EditorNodeFieldsFragment): NodeStyle {
  const spec = getNodeSpec(node);
  const typeConfig = spec?.typeConfig;
  const nodeClass: string =
    typeConfig && 'nodeClass' in typeConfig ? typeConfig.nodeClass : getNodeType(node);
  const isOutcome = node.__typename === 'Node' ? (node.isOutcome ?? false) : false;
  const kind: string = node.kind ?? '';
  return getNodeStyle(kind, nodeClass, isOutcome);
}

type ConnectedNodeChipProps = {
  nodeId: string;
  label: string;
  style: NodeStyle;
  onSelect: (nodeId: string) => void;
  onHover: (nodeId: string | null) => void;
};

const CHIP_LABEL_MAX = 35;

export function ConnectedNodeChip({
  nodeId,
  label,
  style,
  onSelect,
  onHover,
}: ConnectedNodeChipProps) {
  const truncated =
    label.length > CHIP_LABEL_MAX ? `${label.slice(0, CHIP_LABEL_MAX - 1)}…` : label;
  return (
    <Chip
      icon={<Box sx={{ color: style.border, display: 'flex' }}>{style.icon}</Box>}
      label={truncated}
      title={label}
      size="small"
      variant="outlined"
      onClick={() => onSelect(nodeId)}
      onMouseEnter={() => onHover(nodeId)}
      onMouseLeave={() => onHover(null)}
      sx={{
        cursor: 'pointer',
        maxWidth: '100%',
        borderRadius: 1,
        backgroundColor: 'grey.100',
        borderColor: style.border,
        color: style.border,
        '& .MuiChip-icon': { color: style.border, ml: '4px' },
      }}
    />
  );
}

export function NotConnectedChip() {
  return (
    <Chip
      icon={<DashCircle size={14} />}
      label="Not connected"
      size="small"
      variant="outlined"
      sx={{
        alignSelf: 'flex-start',
        borderRadius: 1,
        color: 'text.disabled',
        borderColor: 'divider',
        bgcolor: 'transparent',
        '& .MuiChip-icon': { color: 'text.disabled' },
      }}
    />
  );
}

type CollapsibleSectionProps = {
  title: ReactNode;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
};

export function CollapsibleSection({ title, open, onToggle, children }: CollapsibleSectionProps) {
  return (
    <Box
      sx={{
        mb: 0.5,
        pt: 0.5,
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Box
        onClick={onToggle}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          cursor: 'pointer',
          userSelect: 'none',
          mb: 0.5,
          px: 0.5,
        }}
      >
        {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        <Typography variant="subtitle2" sx={{ fontSize: 12 }}>
          {title}
        </Typography>
      </Box>
      <Collapse in={open}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, px: 1, pb: 2, pt: 1 }}>
          {children}
        </Box>
      </Collapse>
    </Box>
  );
}
