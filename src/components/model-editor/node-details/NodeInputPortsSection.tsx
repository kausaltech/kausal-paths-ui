import { useState } from 'react';

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';

import { useTranslations } from 'next-intl';
import {
  BarChartLine,
  Database,
  InfoSquare,
  Plus,
  Sliders,
  XCircleFill,
  X as XIcon,
} from 'react-bootstrap-icons';

import type {
  EditorNodeEdgeFragment,
  EditorNodeFieldsFragment,
} from '@/common/__generated__/graphql';
import { getNodeStyle } from '../ElkNode';
import { type InputPort, getNodeSpec, outputMatchesPort } from '../nodeHelpers';
import { useCreateEdge } from '../useCreateEdge';
import { useIsEditorReadOnly } from '../useIsEditorReadOnly';
import { useAddInputPort, useBindDataset, useDeleteBinding } from '../usePortBindings';
import BindingEditor, { type BindingEditorValue } from './BindingEditor';
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
  const t = useTranslations('model-editor');
  const datasetBindingCount = port.bindings.filter(
    (b) => b.__typename === 'DatasetPortType'
  ).length;
  const edgeBindingCount = port.bindings.filter((b) => b.__typename === 'NodeEdgeType').length;

  return (
    <Stack spacing={0.5} sx={{ py: 0.5 }}>
      <PortInfoRow label={t('nodes-port-id')} value={port.id} />
      <PortInfoRow label={t('nodes-port-label-field')} value={port.label ?? '—'} />
      <PortInfoRow label={t('nodes-port-quantity')} value={port.quantity ?? '—'} />
      <PortInfoRow label={t('nodes-port-unit')} value={port.unit?.short ?? '—'} />
      <PortInfoRow
        label={t('nodes-port-multi')}
        value={port.multi ? t('nodes-port-multi-yes') : t('nodes-port-multi-no')}
      />
      <PortInfoRow
        label={t('nodes-port-required-dims')}
        value={port.requiredDimensions.length ? port.requiredDimensions.join(', ') : '—'}
      />
      <PortInfoRow
        label={t('nodes-port-supported-dims')}
        value={port.supportedDimensions.length ? port.supportedDimensions.join(', ') : '—'}
      />
      <PortInfoRow
        label={t('nodes-port-bindings')}
        value={t('nodes-port-bindings-value', {
          total: port.bindings.length,
          edges: edgeBindingCount,
          datasets: datasetBindingCount,
        })}
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
  const t = useTranslations('model-editor');
  const readOnly = useIsEditorReadOnly();
  const [editingPortId, setEditingPortId] = useState<string | null>(null);
  const editingPort = editingPortId ? (ports.find((p) => p.id === editingPortId) ?? null) : null;
  const createEdge = useCreateEdge();
  const bindDataset = useBindDataset();
  const deleteBinding = useDeleteBinding();
  const addInputPort = useAddInputPort();
  const [addingPort, setAddingPort] = useState(false);
  const [binding, setBinding] = useState(false);
  const [bindError, setBindError] = useState<string | null>(null);
  const [removingEdgeId, setRemovingEdgeId] = useState<string | null>(null);
  const [removeError, setRemoveError] = useState<string | null>(null);
  const [addPortError, setAddPortError] = useState<string | null>(null);
  const [editingBinding, setEditingBinding] = useState<BindingEditorValue | null>(null);

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
      await createEdge({
        fromNodeId: sourceNode.identifier,
        toNodeId: targetNode.identifier,
        fromPort: matchingOutputPortId(sourceNode, editingPort) ?? 'output',
        toPort: editingPort.id,
        replace: !editingPort.multi && editingPort.bindings.length > 0,
      });
      closeDialog();
    } catch (err) {
      setBindError(err instanceof Error ? err.message : t('nodes-failed-create-edge'));
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
      await deleteBinding(edgeId);
    } catch (err) {
      const message = err instanceof Error ? err.message : t('nodes-failed-remove-input-source');
      // Surface the error where the action was taken: the dialog (when open)
      // or the inline section alert.
      if (editingPortId) setBindError(message);
      else setRemoveError(message);
    } finally {
      setRemovingEdgeId(null);
    }
  };

  const handleSelectDataset = async (datasetId: string, metricId: string) => {
    if (!editingPort || binding) return;
    setBinding(true);
    setBindError(null);
    try {
      await bindDataset({
        nodeId: currentNodeId,
        portId: editingPort.id,
        datasetId,
        metricId,
        replace: !editingPort.multi && editingPort.bindings.length > 0,
      });
      closeDialog();
    } catch (err) {
      setBindError(err instanceof Error ? err.message : t('bindings-bind-dataset-failed'));
    } finally {
      setBinding(false);
    }
  };

  const handleAddPort = async () => {
    if (addingPort) return;
    setAddingPort(true);
    setAddPortError(null);
    try {
      await addInputPort({ nodeId: currentNodeId });
    } catch (err) {
      setAddPortError(err instanceof Error ? err.message : t('nodes-failed-add-input-port'));
    } finally {
      setAddingPort(false);
    }
  };

  return (
    <CollapsibleSection
      title={t('nodes-input-ports', { count: ports.length })}
      open={open}
      onToggle={onToggle}
    >
      {removeError && (
        <Alert severity="error" onClose={() => setRemoveError(null)} sx={{ fontSize: 12 }}>
          {removeError}
        </Alert>
      )}
      {addPortError && (
        <Alert severity="error" onClose={() => setAddPortError(null)} sx={{ fontSize: 12 }}>
          {addPortError}
        </Alert>
      )}
      {ports.length === 0 && (
        <Typography variant="body2" sx={{ fontSize: 11, color: 'text.secondary' }}>
          {t('nodes-no-input-ports')}
        </Typography>
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
            ? ((
                connectedEdges[0] satisfies (typeof connectedEdges)[0] & { tags: readonly string[] }
              ).tags ?? [])
            : [];
        const hasSingleDataset = datasetBindings.length === 1 && connectedEdges.length === 0;
        const derivedPortName = port.label
          ? null
          : hasSingleDataset
            ? 'reference'
            : singleSourceNode
              ? (singleEdgeTags[0] ?? singleSourceNode.identifier)
              : null;

        const quantityAndUnit = [port.quantity, port.unit?.short].filter(Boolean).join(' · ');

        return (
          <Paper key={port.id} variant="outlined" sx={{ p: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 0.5 }}>
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
                  {t('nodes-port-label', {
                    label: port.label ?? derivedPortName ?? `#${index + 1}`,
                  })}
                  {port.multi ? t('nodes-port-multi-suffix') : ''}
                  <InfoSquare size={10} aria-label={t('nodes-port-info')} />
                </Typography>
              </Tooltip>
              {quantityAndUnit && (
                <Typography
                  component="span"
                  variant="body2"
                  sx={{ fontSize: 10, color: 'text.disabled' }}
                >
                  {quantityAndUnit}
                </Typography>
              )}
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {hasConnections ? (
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', flex: 1 }}>
                  {connectedEdges.map((e) => {
                    const sourceNode = nodeMap.get(e.fromRef.nodeId);
                    const highlighted = hoveredNodeId === e.fromRef.nodeId;
                    return (
                      <Box
                        key={e.id}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          ...(highlighted
                            ? {
                                '& .MuiChip-root': {
                                  borderColor: 'primary.main',
                                  bgcolor: 'action.hover',
                                },
                              }
                            : {}),
                        }}
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
                        <Tooltip title={t('bindings-edit')}>
                          <IconButton
                            size="small"
                            onClick={() =>
                              setEditingBinding({
                                id: e.id,
                                kind: 'edge',
                                tags: e.tags,
                                transformations: e.transformations,
                              })
                            }
                            aria-label={t('bindings-edit')}
                            sx={{ p: 0.5 }}
                          >
                            <Sliders size={12} />
                          </IconButton>
                        </Tooltip>
                        {sourceNode && onShowMetrics && (
                          <Tooltip title={t('nodes-port-show-source-data')}>
                            <IconButton
                              size="small"
                              onClick={() => onShowMetrics(sourceNode.id, sourceNode.name ?? null)}
                              aria-label={t('nodes-port-show-source-data')}
                              sx={{ p: 0.5, color: 'text.secondary' }}
                            >
                              <BarChartLine size={12} />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    );
                  })}
                  {datasetBindings.map((ds) => (
                    <Box key={ds.id} sx={{ display: 'flex', alignItems: 'center' }}>
                      <Chip
                        icon={<Database size={18} />}
                        label={`${ds.dataset.name} → ${ds.metric.label}`}
                        title={`${ds.dataset.name} → ${ds.metric.label}`}
                        variant="outlined"
                        onClick={() => onShowDataset?.(ds.id)}
                        disabled={removingEdgeId === ds.id}
                        onDelete={() => void handleRemoveEdge(ds.id)}
                        deleteIcon={
                          <XCircleFill size={14} aria-label={t('nodes-remove-input-source')} />
                        }
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
                      <Tooltip title={t('bindings-edit')}>
                        <IconButton
                          size="small"
                          onClick={() =>
                            setEditingBinding({
                              id: ds.id,
                              kind: 'dataset',
                              tags: ds.tags,
                              transformations: ds.transformations,
                              metricId: ds.metric.id,
                              metrics: ds.dataset.metrics,
                            })
                          }
                          aria-label={t('bindings-edit')}
                          sx={{ p: 0.5 }}
                        >
                          <Sliders size={12} />
                        </IconButton>
                      </Tooltip>
                      {onShowDataset && (
                        <Tooltip title={t('nodes-port-show-source-dataset')}>
                          <IconButton
                            size="small"
                            onClick={() => onShowDataset(ds.id)}
                            aria-label={t('nodes-port-show-source-dataset')}
                            sx={{ p: 0.5, color: 'text.secondary' }}
                          >
                            <BarChartLine size={12} />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  ))}
                  {!readOnly && port.multi && (
                    <Tooltip title={t('nodes-port-select-input')} placement="right">
                      <Chip
                        icon={<Plus size={14} />}
                        label={t('nodes-port-add-input')}
                        size="small"
                        variant="outlined"
                        onClick={() => setEditingPortId(port.id)}
                        sx={{
                          alignSelf: 'center',
                          borderRadius: 1,
                          borderStyle: 'dashed',
                          color: 'text.secondary',
                          borderColor: 'divider',
                          '& .MuiChip-icon': { color: 'text.secondary' },
                          '&:hover': { borderColor: 'text.secondary' },
                        }}
                      />
                    </Tooltip>
                  )}
                </Box>
              ) : (
                <Box sx={{ flex: 1 }}>
                  {readOnly ? (
                    <NotConnectedChip />
                  ) : (
                    <Tooltip title={t('nodes-port-select-input')} placement="right">
                      <span>
                        <NotConnectedChip onClick={() => setEditingPortId(port.id)} />
                      </span>
                    </Tooltip>
                  )}
                </Box>
              )}
            </Box>
          </Paper>
        );
      })}
      {!readOnly && (
        <Paper variant="outlined" sx={{ p: 1 }}>
          <Button
            size="small"
            startIcon={addingPort ? <CircularProgress size={12} /> : <Plus />}
            onClick={() => void handleAddPort()}
            disabled={addingPort}
            sx={{ textTransform: 'none' }}
          >
            {t('nodes-add-input-port')}
          </Button>
        </Paper>
      )}
      <Dialog open={editingPort !== null} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ pr: 6 }}>
          {editingPort && editingPort.bindings.length > 0 && !editingPort.multi
            ? t('nodes-replace-input-source')
            : t('nodes-select-input-source')}
          <IconButton
            aria-label={t('common-close')}
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
                onSelectDataset={(datasetId, metricId) =>
                  void handleSelectDataset(datasetId, metricId)
                }
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
      <Dialog
        open={editingBinding !== null}
        onClose={() => setEditingBinding(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ pr: 6 }}>
          {t('bindings-edit')}
          <IconButton
            aria-label={t('common-close')}
            onClick={() => setEditingBinding(null)}
            sx={{ position: 'absolute', right: 8, top: 8, color: 'text.secondary' }}
          >
            <XIcon size={20} />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {editingBinding && (
            <BindingEditor
              binding={editingBinding}
              onSaved={() => setEditingBinding(null)}
              onDelete={() => deleteBinding(editingBinding.id)}
            />
          )}
        </DialogContent>
      </Dialog>
    </CollapsibleSection>
  );
}
