import { type FC, type ReactElement, createContext, memo, use } from 'react';

import { Box, Typography } from '@mui/material';

import {
  Handle,
  type Node,
  type NodeProps,
  Position,
  type ReactFlowState,
  useStore,
} from '@xyflow/react';
import {
  DashSquare,
  Database,
  Flag,
  Flask,
  Gear,
  GraphUpArrow,
  Intersect,
  PlusSquare,
  QuestionCircle,
  XSquare,
} from 'react-bootstrap-icons';

export type NodeGraphInteraction = {
  highlightedNodeIds: ReadonlySet<string>;
  activeNodeId: string | null;
  onHiddenContextClick: (id: string) => void;
};

const defaultInteraction: NodeGraphInteraction = {
  highlightedNodeIds: new Set(),
  activeNodeId: null,
  onHiddenContextClick: () => {},
};

export const NodeGraphInteractionContext = createContext<NodeGraphInteraction>(defaultInteraction);

const zoomSelector = (s: ReactFlowState) => s.transform[2] >= 0.7;

export type NodeStyle = { bg: string; border: string; icon: ReactElement; label: string };

const ICON_SIZE = 14;

export function getNodeStyle(kind: string, nodeClass: string, isOutcome: boolean): NodeStyle {
  const cls = nodeClass.toLowerCase();
  const sz = ICON_SIZE;

  if (isOutcome)
    return { bg: '#e8eaf6', border: '#3f51b5', icon: <Flag size={sz} />, label: 'Outcome' };
  if (kind.toLowerCase() === 'action')
    return { bg: '#e8f5e9', border: '#4caf50', icon: <Gear size={sz} />, label: 'Action' };
  if (cls.includes('additive'))
    return {
      bg: '#e3f2fd',
      border: '#2196f3',
      icon: <PlusSquare size={sz} />,
      label: 'Additive',
    };
  if (cls.includes('multiplicative'))
    return {
      bg: '#f3e5f5',
      border: '#9c27b0',
      icon: <XSquare size={sz} />,
      label: 'Multiplicative',
    };
  if (cls.includes('subtractive'))
    return {
      bg: '#ffebee',
      border: '#f44336',
      icon: <DashSquare size={sz} />,
      label: 'Subtractive',
    };
  if (cls.includes('emissionfactor') || cls.includes('sectoremission'))
    return {
      bg: '#fce4ec',
      border: '#e91e63',
      icon: <GraphUpArrow size={sz} />,
      label: 'Emission',
    };
  if (cls.includes('dataset'))
    return { bg: '#f9f6d7', border: '#daa520', icon: <Database size={sz} />, label: 'Dataset' };
  if (cls.includes('coalesce'))
    return { bg: '#e0f2f1', border: '#009688', icon: <Intersect size={sz} />, label: 'Coalesce' };
  if (cls.includes('health'))
    return { bg: '#fce4ec', border: '#e91e63', icon: <Flask size={sz} />, label: 'Health' };
  return { bg: '#f5f5f5', border: '#90a4ae', icon: <QuestionCircle size={sz} />, label: 'Node' };
}

export type HandleData = { id: string; multi?: boolean };
export type HiddenContextRef = { id: string; label: string };

export type QuantityKindData = { icon?: string | null; id: string; label: string };

export type ElkNodeData = {
  label: string;
  kind: string;
  nodeClass: string;
  color: string;
  isOutcome: boolean;
  quantityKind?: QuantityKindData | null;
  hiddenContextSources?: HiddenContextRef[];
  nodeHeight?: number;
  sourceHandles: HandleData[];
  targetHandles: HandleData[];
};

export type ElkNodeType = Node<ElkNodeData, 'elk'>;

const ElkNode: FC<NodeProps<ElkNodeType>> = ({ id, data }: NodeProps<ElkNodeType>) => {
  const showContent = useStore(zoomSelector);
  const { highlightedNodeIds, activeNodeId, onHiddenContextClick } = use(
    NodeGraphInteractionContext
  );
  const highlighted = highlightedNodeIds.has(id);
  const active = activeNodeId === id;
  const style = getNodeStyle(data.kind, data.nodeClass, data.isOutcome);

  const targetCount = data.targetHandles.length;
  const sourceCount = data.sourceHandles.length;

  return (
    <>
      {data.targetHandles.map((handle, i) => (
        <Handle
          key={handle.id}
          id={handle.id}
          type="target"
          position={Position.Left}
          style={
            targetCount > 1
              ? { top: `${((i + 1) / (targetCount + 1)) * 100}%`, position: 'absolute' }
              : undefined
          }
        />
      ))}
      {showContent ? (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            borderRadius: '4px',
            overflow: 'hidden',
            boxShadow: active ? 6 : 1,
            outline: active
              ? `3px solid ${style.border}`
              : highlighted
                ? `2px solid ${style.border}`
                : 'none',
            outlineOffset: active ? '1px' : undefined,
            backgroundColor: 'white',
            minWidth: 100,
            maxWidth: 180,
          }}
        >
          <Box
            sx={{
              px: '5px',
              py: '2px',
              backgroundColor: style.bg,
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
            }}
          >
            <Box sx={{ color: style.border, display: 'flex' }}>{style.icon}</Box>
            <Typography
              variant="caption"
              sx={{ fontSize: 9, lineHeight: 1.2, color: style.border, fontWeight: 500 }}
            >
              {style.label}
            </Typography>
            {data.quantityKind?.icon && (
              <Typography
                component="span"
                title={data.quantityKind.label}
                sx={{ fontSize: 11, lineHeight: 1, ml: 'auto' }}
              >
                {data.quantityKind.icon}
              </Typography>
            )}
          </Box>
          <Box sx={{ px: '5px', py: '3px' }}>
            <Typography
              variant="body2"
              sx={{
                fontSize: 11,
                lineHeight: 1.25,
                hyphens: 'auto',
                wordBreak: 'break-word',
              }}
            >
              {data.label}
            </Typography>
            {data.hiddenContextSources && data.hiddenContextSources.length > 0 && (
              <Box sx={{ mt: 0.75, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                {data.hiddenContextSources.slice(0, 2).map((source) => (
                  <Box
                    key={source.id}
                    onClick={(event) => {
                      event.stopPropagation();
                      onHiddenContextClick(source.id);
                    }}
                    sx={{
                      px: 0.75,
                      py: 0.25,
                      fontSize: 9,
                      borderRadius: 999,
                      backgroundColor: '#eceff1',
                      color: '#455a64',
                      cursor: 'pointer',
                      lineHeight: 1.2,
                    }}
                  >
                    {source.label}
                  </Box>
                ))}
                {data.hiddenContextSources.length > 2 && (
                  <Box
                    sx={{
                      px: 0.75,
                      py: 0.25,
                      fontSize: 9,
                      borderRadius: 999,
                      backgroundColor: '#eceff1',
                      color: '#455a64',
                      lineHeight: 1.2,
                    }}
                  >
                    +{data.hiddenContextSources.length - 2} more
                  </Box>
                )}
              </Box>
            )}
          </Box>
        </Box>
      ) : (
        <Box
          sx={{
            width: active ? 12 : 8,
            height: active ? 12 : 8,
            borderRadius: '50%',
            backgroundColor: data.color || style.border,
            outline: active ? `2px solid ${style.border}` : 'none',
            outlineOffset: active ? '1px' : undefined,
          }}
        />
      )}
      {data.sourceHandles.map((handle, i) => (
        <Handle
          key={handle.id}
          id={handle.id}
          type="source"
          position={Position.Right}
          style={
            sourceCount > 1
              ? { top: `${((i + 1) / (sourceCount + 1)) * 100}%`, position: 'absolute' }
              : undefined
          }
        />
      ))}
    </>
  );
};

export default memo(ElkNode);
