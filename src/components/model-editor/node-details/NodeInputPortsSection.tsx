import { useState } from 'react';

import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';

import {
  BarChartLine,
  Database,
  InfoSquare,
  PencilSquare,
  X as XIcon,
} from 'react-bootstrap-icons';

import type {
  EditorNodeEdgeFragment,
  EditorNodeFieldsFragment,
} from '@/common/__generated__/graphql';
import { getNodeStyle } from '../ElkNode';
import { type InputPort, getNodeSpec, outputMatchesPort } from '../nodeHelpers';
import { useCreateEdge } from '../useCreateEdge';
import { useDeleteEdge } from '../useDeleteEdge';
import PortBindingSelector from './PortBindingSelector';
import { CollapsibleSection, ConnectedNodeChip, NotConnectedChip, getStyleForNode } from './shared';

/**
 * The source node's first output port compatible with `port`. Returns its id
 * for the edge's `fromPort`. When no port matches the criteria, falls back to
 * the node's first output port id so the edge mutation always receives a valid
 * port UUID.
 */
function matchingOutputPortId(
  sourceNode: EditorNodeFieldsFragment,
  port: InputPort
): string | undefined {
  const outputs = getNodeSpec(sourceNode)?.outputPorts ?? [];
  const match = outputs.find((o) => outputMatchesPort(port, o));
  return (match ?? outputs[0])?.id;
}

type PortInfoRowProps = {
  label: string;
  value: string;
};

function PortInfoRow({ label, value }: PortInfoRowProps) {
  return (
    <Box sx={{ display: 'flex', gap: 1, fontSize: 11, lineHeight: 1.4 }}>
      <Box sx={{ minWidth: 110, color: 'grey.400', flexShrink: 0 }}>{label}</Box>
      <Box sx={{ wordBreak: 'break-word' }}>{value}</Box>
    </Box>
  );
}

function PortTooltipContent({ port }: { port: InputPort }) {
  const datasetBindingCount = port.bindings.filter(
    (b) => b.__typename === 'DatasetPortType'
  ).length;
  const edgeBindingCount = port.bindings.filter((b) => b.__typename === 'NodeEdgeType').length;

  return (
    <Stack spacing={0.5} sx={{ py: 0.5 }}>
      <PortInfoRow label="ID" value={port.id} />
      <PortInfoRow label="Label" value={port.label ?? '—'} />
      <PortInfoRow label="Quantity" value={port.quantity ?? '—'} />
      <PortInfoRow label="Unit" value={port.unit?.short ?? '—'} />
      <PortInfoRow label="Multi" value={port.multi ? 'Yes' : 'No'} />
      <PortInfoRow
        label="Required dims"
        value={port.requiredDimensions.length ? port.requiredDimensions.join(', ') : '—'}
      />
      <PortInfoRow
        label="Supported dims"
        value={port.supportedDimensions.length ? port.supportedDimensions.join(', ') : '—'}
      />
      <PortInfoRow
        label="Bindings"
        value={`${port.bindings.length} (${edgeBindingCount} edge, ${datasetBindingCount} dataset)`}
      />
    </Stack>
  );
}

type NodeInputPortsSectionProps = {
  currentNodeId: string;
  ports: readonly InputPort[];
  incomingByPort: ReadonlyMap<string, readonly EditorNodeEdgeFragment[]>;
  nodeMap: ReadonlyMap<string, EditorNodeFieldsFragment>;
  hoveredNodeId: string | null;
  open: boolean;
  onToggle: () => void;
  onSelectNode: (nodeId: string) => void;
  onHover: (nodeId: string | null) => void;
  onShowDataset?: (bindingId: string) => void;
  onShowMetrics?: (nodeId: string, nodeName: string | null) => void;
};

export default function NodeInputPortsSection({
  currentNodeId,
  ports,
  incomingByPort,
  nodeMap,
  hoveredNodeId,
  open,
  onToggle,
  onSelectNode,
  onHover,
  onShowDataset,
  onShowMetrics,
}: NodeInputPortsSectionProps) {
  const [editingPortId, setEditingPortId] = useState<string | null>(null);
  const editingPort = editingPortId ? (ports.find((p) => p.id === editingPortId) ?? null) : null;
  const createEdge = useCreateEdge();
  const deleteEdge = useDeleteEdge();
  const [binding, setBinding] = useState(false);
  const [bindError, setBindError] = useState<string | null>(null);
  const [removingEdgeId, setRemovingEdgeId] = useState<string | null>(null);
  const [removeError, setRemoveError] = useState<string | null>(null);

  const closeDialog = () => {
    setEditingPortId(null);
    setBindError(null);
  };

  const handleSelectNode = async (sourceNodeId: string) => {
    if (!editingPort || binding) return;
    const sourceNode = nodeMap.get(sourceNodeId);
    const targetNode = nodeMap.get(currentNodeId);
    if (!sourceNode || !targetNode) return;
    setBinding(true);
    setBindError(null);
    try {
      // createEdge only appends; a non-multi port holds a single binding, so
      // replace any existing edge(s) before adding the new source. (If a delete
      // succeeds but the create then fails, the port is left empty — the
      // refetch surfaces that honestly and the user can re-pick.)
      if (!editingPort.multi) {
        const existing = incomingByPort.get(editingPort.id) ?? [];
        for (const edge of existing) {
          await deleteEdge(edge.id);
        }
      }
      await createEdge({
        fromNodeId: sourceNode.identifier,
        toNodeId: targetNode.identifier,
        fromPort: matchingOutputPortId(sourceNode, editingPort) ?? 'output',
        toPort: editingPort.id,
      });
      closeDialog();
    } catch (err) {
      setBindError(err instanceof Error ? err.message : 'Failed to create edge');
    } finally {
      setBinding(false);
    }
  };

  const handleRemoveEdge = async (edgeId: string) => {
    if (removingEdgeId) return;
    setRemovingEdgeId(edgeId);
    setRemoveError(null);
    setBindError(null);
    try {
      await deleteEdge(edgeId);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to remove input source';
      // Surface the error where the action was taken: the dialog (when open)
      // or the inline section alert.
      if (editingPortId) setBindError(message);
      else setRemoveError(message);
    } finally {
      setRemovingEdgeId(null);
    }
  };

  const handleSelectDataset = () => {
    // No backend mutation exists yet to bind a dataset to an input port.
    setBindError('Binding a dataset to an input port is not supported yet.');
  };

  if (ports.length === 0) return null;

  return (
    <CollapsibleSection
      title={`Node input ports (${ports.length})`}
      open={open}
      onToggle={onToggle}
    >
      {removeError && (
        <Alert severity="error" onClose={() => setRemoveError(null)} sx={{ fontSize: 12 }}>
          {removeError}
        </Alert>
      )}
      {ports.map((port, index) => {
        const connectedEdges = incomingByPort.get(port.id) ?? [];
        type DatasetBinding = Extract<
          (typeof port.bindings)[number],
          { __typename: 'DatasetPortType' }
        >;
        type BoundDatasetBinding = DatasetBinding & {
          dataset: NonNullable<DatasetBinding['dataset']>;
          metric: NonNullable<DatasetBinding['metric']>;
        };
        const datasetBindings = port.bindings.filter(
          (b): b is BoundDatasetBinding =>
            b.__typename === 'DatasetPortType' && b.dataset != null && b.metric != null
        );
        const hasConnections = connectedEdges.length > 0 || datasetBindings.length > 0;
        const singleSourceNode =
          connectedEdges.length === 1
            ? (nodeMap.get(connectedEdges[0].fromRef.nodeId) ?? null)
            : null;
        // For a port with no explicit label, derive the name the
        // formula/runtime references. Formula-node conventions:
        //   - dataset binding: always referenced as "reference"
        //   - edge binding: first edge tag (alias) or source-node identifier
        // `tags` cast: codegen is blocked by unrelated schema drift; the
        // fragment fetches `tags` at runtime.
        const singleEdgeTags =
          connectedEdges.length === 1
            ? ((connectedEdges[0] as (typeof connectedEdges)[0] & { tags: readonly string[] })
                .tags ?? [])
            : [];
        const hasSingleDataset = datasetBindings.length === 1 && connectedEdges.length === 0;
        const derivedPortName = port.label
          ? null
          : hasSingleDataset
            ? 'reference'
            : singleSourceNode
              ? (singleEdgeTags[0] ?? singleSourceNode.identifier)
              : null;

        return (
          <Box key={port.id}>
            <Tooltip
              title={<PortTooltipContent port={port} />}
              placement="right"
              arrow
              enterDelay={200}
            >
              <Typography
                component="span"
                variant="body2"
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.5,
                  fontSize: 10,
                  color: 'text.secondary',
                  mb: 0,
                  cursor: 'help',
                }}
              >
                Port: {port.label ?? derivedPortName ?? `#${index + 1}`}
                {port.multi ? ' (multi)' : ''}
                <InfoSquare size={10} aria-label="Port info" />
              </Typography>
            </Tooltip>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {hasConnections ? (
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', flex: 1 }}>
                  {connectedEdges.map((e) => {
                    const sourceNode = nodeMap.get(e.fromRef.nodeId);
                    const highlighted = hoveredNodeId === e.fromRef.nodeId;
                    return (
                      <Box
                        key={e.id}
                        sx={
                          highlighted
                            ? {
                                '& .MuiChip-root': {
                                  borderColor: 'primary.main',
                                  bgcolor: 'action.hover',
                                },
                              }
                            : undefined
                        }
                      >
                        <ConnectedNodeChip
                          nodeId={e.fromRef.nodeId}
                          label={sourceNode?.name ?? e.fromRef.nodeId}
                          style={
                            sourceNode ? getStyleForNode(sourceNode) : getNodeStyle('', '', false)
                          }
                          onSelect={onSelectNode}
                          onHover={onHover}
                          onDelete={() => void handleRemoveEdge(e.id)}
                          deleting={removingEdgeId === e.id}
                        />
                      </Box>
                    );
                  })}
                  {datasetBindings.map((ds) => (
                    <Chip
                      key={ds.id}
                      icon={<Database size={18} />}
                      label={`${ds.dataset.name} → ${ds.metric.label}`}
                      title={`${ds.dataset.name} → ${ds.metric.label}`}
                      variant="outlined"
                      onClick={() => onShowDataset?.(ds.id)}
                      sx={{
                        maxWidth: '100%',
                        cursor: 'pointer',
                        minHeight: 32,
                        height: 'auto',
                        fontSize: 12,
                        borderRadius: 1,
                        py: 0.25,
                        '& .MuiChip-label': {
                          px: 1.25,
                          whiteSpace: 'normal',
                          overflowWrap: 'anywhere',
                          lineHeight: 1.3,
                        },
                      }}
                    />
                  ))}
                </Box>
              ) : (
                <Box sx={{ flex: 1 }}>
                  <NotConnectedChip />
                </Box>
              )}
              <Tooltip title="Select input node" placement="left">
                <IconButton
                  size="small"
                  onClick={() => setEditingPortId(port.id)}
                  aria-label="Select input node"
                  sx={{ p: 0.5, color: 'text.secondary' }}
                >
                  <PencilSquare size={12} />
                </IconButton>
              </Tooltip>
              {singleSourceNode && onShowMetrics && (
                <Tooltip title="Show source node output data" placement="left">
                  <IconButton
                    size="small"
                    onClick={() =>
                      onShowMetrics(singleSourceNode.id, singleSourceNode.name ?? null)
                    }
                    aria-label="Show source node output data"
                    sx={{ p: 0.5, color: 'text.secondary' }}
                  >
                    <BarChartLine size={12} />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </Box>
        );
      })}
      <Dialog open={editingPort !== null} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ pr: 6 }}>
          {editingPort && (incomingByPort.get(editingPort.id) ?? []).length > 0
            ? 'Replace input source'
            : 'Select input source'}
          <IconButton
            aria-label="Close"
            onClick={closeDialog}
            sx={{ position: 'absolute', right: 8, top: 8, color: 'text.secondary' }}
          >
            <XIcon size={20} />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {bindError && (
            <Alert severity="error" onClose={() => setBindError(null)} sx={{ mb: 1, fontSize: 12 }}>
              {bindError}
            </Alert>
          )}
          {editingPort && (
            <Box sx={{ position: 'relative' }}>
              <PortBindingSelector
                nodes={[...nodeMap.values()]}
                port={editingPort}
                currentNodeId={currentNodeId}
                currentSources={(incomingByPort.get(editingPort.id) ?? []).map((e) => ({
                  edgeId: e.id,
                  node: nodeMap.get(e.fromRef.nodeId) ?? null,
                  nodeRef: e.fromRef.nodeId,
                }))}
                removingEdgeId={removingEdgeId}
                onSelectNode={(id) => void handleSelectNode(id)}
                onSelectDataset={handleSelectDataset}
                onRemoveSource={(edgeId) => void handleRemoveEdge(edgeId)}
              />
              {binding && (
                <Box
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'rgba(255,255,255,0.6)',
                  }}
                >
                  <CircularProgress size={24} />
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </CollapsibleSection>
  );
}
