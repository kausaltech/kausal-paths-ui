import { useState } from 'react';

import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';

import { useTranslations } from 'next-intl';
import {
  ArrowLeft,
  BarChartLine,
  Database,
  InfoSquare,
  Plus,
  Sliders,
  Trash,
  XCircleFill,
  X as XIcon,
} from 'react-bootstrap-icons';

import type {
  EditorNodeEdgeFragment,
  EditorNodeFieldsFragment,
  InputPortInput,
} from '@/common/__generated__/graphql';
import { getNodeStyle } from '../ElkNode';
import { type InputPort, getNodeSpec, outputMatchesPort } from '../nodeHelpers';
import { QUANTITY_SUGGESTIONS } from '../quantities';
import { useCreateEdge } from '../useCreateEdge';
import { useIsEditorReadOnly } from '../useIsEditorReadOnly';
import { useAddInputPort, useBindDataset, useDeleteBinding } from '../usePortBindings';
import { useUpdateInputPorts } from '../useUpdateOutputPorts';
import BindingEditor, { type BindingEditorValue } from './BindingEditor';
import PortBindingSelector from './PortBindingSelector';
import { CollapsibleSection, ConnectedNodeChip, NotConnectedChip, getStyleForNode } from './shared';

type OutputPort = NonNullable<ReturnType<typeof getNodeSpec>>['outputPorts'][number];

/**
 * The source node's output ports compatible with `port`. On bare ports (no
 * quantity/unit constraints) every output matches, so the list length tells
 * whether the source port choice is unambiguous.
 */
function compatibleOutputPorts(
  sourceNode: EditorNodeFieldsFragment,
  port: InputPort
): OutputPort[] {
  const outputs = getNodeSpec(sourceNode)?.outputPorts ?? [];
  return outputs.filter((o) => outputMatchesPort(port, o));
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

/**
 * The unit of the port's bound dataset metric. Ports created in the editor
 * carry no unit constraint of their own (null = accept anything), so this is
 * the only unit information available for them — shown as the effective unit
 * without implying the port is constrained to it.
 */
function boundDatasetUnit(port: InputPort): string | null {
  for (const binding of port.bindings) {
    if (binding.__typename !== 'DatasetPortType') continue;
    const metric = binding.dataset?.metrics.find((m) => m.id === binding.metric?.id);
    if (metric?.unit) return metric.unit;
  }
  return null;
}

function PortTooltipContent({ port }: { port: InputPort }) {
  const t = useTranslations('model-editor');
  const datasetBindingCount = port.bindings.filter(
    (b) => b.__typename === 'DatasetPortType'
  ).length;
  const edgeBindingCount = port.bindings.filter((b) => b.__typename === 'NodeEdgeType').length;
  const datasetUnit = port.unit ? null : boundDatasetUnit(port);

  return (
    <Stack spacing={0.5} sx={{ py: 0.5 }}>
      <PortInfoRow label={t('nodes-port-id')} value={port.id} />
      <PortInfoRow label={t('nodes-port-label-field')} value={port.label ?? '—'} />
      <PortInfoRow label={t('nodes-port-quantity')} value={port.quantity ?? '—'} />
      <PortInfoRow
        label={t('nodes-port-unit')}
        value={
          port.unit?.short ??
          (datasetUnit ? t('nodes-port-unit-from-dataset', { unit: datasetUnit }) : '—')
        }
      />
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

type PortSettingsFields = {
  label: string | null;
  quantity: string | null;
  unit: string | null;
};

/**
 * Convert the node's current input ports to the mutation input shape,
 * preserving each port's `id` — `updateNode` replaces the input-port list
 * wholesale, and edges/bindings are keyed on those ids. The caller applies
 * the edited port's changes on top (or drops a port) before sending.
 */
function inputPortsToInput(ports: readonly InputPort[]): InputPortInput[] {
  return ports.map((p) => ({
    id: p.id,
    identifier: p.identifier ?? null,
    label: p.label ?? null,
    quantity: p.quantity ?? null,
    unit: p.unit?.standard ?? null,
    multi: p.multi ?? false,
    requiredDimensions: [...p.requiredDimensions],
    supportedDimensions: [...p.supportedDimensions],
  }));
}

/**
 * Create or edit an input port's settings. Every field is optional: an empty
 * quantity/unit leaves the port unconstrained (it accepts any input), which
 * is how bare ports have always been created. In edit mode (`onDelete` set) a
 * delete action is offered, disabled while the port still has bindings — the
 * backend drops the port definition without cleaning up bindings that
 * reference it, so connections must be removed first.
 */
function InputPortSettingsDialog({
  title,
  submitLabel,
  initial,
  onClose,
  onSubmit,
  onDelete,
  deleteDisabled = false,
}: {
  title: string;
  submitLabel: string;
  initial?: PortSettingsFields;
  onClose: () => void;
  onSubmit: (fields: PortSettingsFields) => Promise<void>;
  onDelete?: () => Promise<void>;
  deleteDisabled?: boolean;
}) {
  const t = useTranslations('model-editor');
  const [label, setLabel] = useState(initial?.label ?? '');
  const [quantity, setQuantity] = useState(initial?.quantity ?? '');
  const [unit, setUnit] = useState(initial?.unit ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = (action: () => Promise<void>, fallbackMessage: string) => {
    if (busy) return;
    setBusy(true);
    setError(null);
    action()
      .then(() => onClose())
      .catch((err: unknown) => setError(err instanceof Error ? err.message : fallbackMessage))
      .finally(() => setBusy(false));
  };

  const handleSubmit = () =>
    run(
      () =>
        onSubmit({
          label: label.trim() || null,
          quantity: quantity.trim() || null,
          unit: unit.trim() || null,
        }),
      t('common-save-failed')
    );

  const handleDelete = () => {
    if (!onDelete) return;
    run(onDelete, t('common-save-failed'));
  };

  return (
    <Dialog open onClose={busy ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ pr: 6 }}>
        {title}
        <IconButton
          aria-label={t('common-close')}
          onClick={onClose}
          disabled={busy}
          sx={{ position: 'absolute', right: 8, top: 8, color: 'text.secondary' }}
        >
          <XIcon size={20} />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 1.5, fontSize: 12 }}>
            {error}
          </Alert>
        )}
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
          {t('nodes-add-input-port-hint')}
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            autoFocus
            label={t('nodes-port-label-field')}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            size="small"
            fullWidth
            slotProps={{ input: { sx: { fontSize: 13 } } }}
          />
          <Autocomplete
            freeSolo
            options={QUANTITY_SUGGESTIONS}
            inputValue={quantity}
            onInputChange={(_, next) => setQuantity(next)}
            size="small"
            renderInput={(params) => (
              <TextField
                {...params}
                label={t('nodes-port-quantity')}
                placeholder={t('nodes-port-quantity-hint')}
                slotProps={{ input: { ...params.InputProps, sx: { fontSize: 13 } } }}
              />
            )}
          />
          <TextField
            label={t('nodes-port-unit')}
            placeholder={t('nodes-port-unit-hint')}
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            size="small"
            fullWidth
            slotProps={{ input: { sx: { fontSize: 13 } } }}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        {onDelete && (
          <>
            <Tooltip title={deleteDisabled ? t('nodes-delete-port-bound') : ''}>
              <span>
                <Button
                  color="error"
                  startIcon={<Trash size={14} />}
                  onClick={handleDelete}
                  disabled={busy || deleteDisabled}
                  sx={{ textTransform: 'none' }}
                >
                  {t('nodes-delete-port')}
                </Button>
              </span>
            </Tooltip>
            <Box sx={{ flex: 1 }} />
          </>
        )}
        <Button onClick={onClose} disabled={busy}>
          {t('common-cancel')}
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={busy}>
          {busy ? t('common-saving') : submitLabel}
        </Button>
      </DialogActions>
    </Dialog>
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
  const updateInputPorts = useUpdateInputPorts();
  const [addPortDialogOpen, setAddPortDialogOpen] = useState(false);
  const [settingsPortId, setSettingsPortId] = useState<string | null>(null);
  const settingsPort = settingsPortId ? (ports.find((p) => p.id === settingsPortId) ?? null) : null;

  // Resend the whole port list (ids preserved) with the edited port's fields
  // applied — updateNode replaces input ports wholesale.
  const saveSettingsPort = (portId: string, fields: PortSettingsFields) => {
    const next = inputPortsToInput(ports).map((p) => (p.id === portId ? { ...p, ...fields } : p));
    return updateInputPorts(currentNodeId, next);
  };

  const deleteSettingsPort = (portId: string) => {
    const next = inputPortsToInput(ports).filter((p) => p.id !== portId);
    return updateInputPorts(currentNodeId, next);
  };
  const [binding, setBinding] = useState(false);
  const [bindError, setBindError] = useState<string | null>(null);
  const [removingEdgeId, setRemovingEdgeId] = useState<string | null>(null);
  const [removeError, setRemoveError] = useState<string | null>(null);
  const [editingBinding, setEditingBinding] = useState<BindingEditorValue | null>(null);
  // Set when the picked source node has several compatible output ports; the
  // dialog then shows a port-choice step instead of the node selector.
  const [sourcePortChoice, setSourcePortChoice] = useState<{
    node: EditorNodeFieldsFragment;
    outputs: OutputPort[];
  } | null>(null);

  const closeDialog = () => {
    setEditingPortId(null);
    setSourcePortChoice(null);
    setBindError(null);
  };

  const connectSource = async (sourceNode: EditorNodeFieldsFragment, fromPort: string) => {
    if (!editingPort || binding) return;
    const targetNode = nodeMap.get(currentNodeId);
    if (!targetNode) return;
    setBinding(true);
    setBindError(null);
    try {
      await createEdge({
        fromNodeId: sourceNode.identifier,
        toNodeId: targetNode.identifier,
        fromPort,
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

  const handleSelectNode = (sourceNodeId: string) => {
    if (!editingPort || binding) return;
    const sourceNode = nodeMap.get(sourceNodeId);
    if (!sourceNode) return;
    const compatible = compatibleOutputPorts(sourceNode, editingPort);
    // More than one output would fit (common with bare, anything-goes input
    // ports): let the user pick instead of silently taking the first one.
    if (compatible.length > 1) {
      setSourcePortChoice({ node: sourceNode, outputs: compatible });
      return;
    }
    const fallback = getNodeSpec(sourceNode)?.outputPorts[0];
    void connectSource(sourceNode, (compatible[0] ?? fallback)?.id ?? 'output');
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

        const quantityAndUnit =
          [port.quantity, port.unit?.short].filter(Boolean).join(' · ') ||
          t('nodes-port-unrestricted');

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
              {readOnly ? (
                <Typography
                  component="span"
                  variant="body2"
                  sx={{ fontSize: 10, color: 'text.disabled' }}
                >
                  {quantityAndUnit}
                </Typography>
              ) : (
                <Tooltip title={t('nodes-edit-input-port')} placement="right">
                  <Typography
                    component="button"
                    type="button"
                    variant="body2"
                    onClick={() => setSettingsPortId(port.id)}
                    sx={{
                      fontSize: 10,
                      color: 'text.disabled',
                      background: 'none',
                      border: 'none',
                      p: 0,
                      cursor: 'pointer',
                      textDecoration: 'underline dotted',
                      textUnderlineOffset: 2,
                      '&:hover': { color: 'text.secondary' },
                    }}
                  >
                    {quantityAndUnit}
                  </Typography>
                </Tooltip>
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
            startIcon={<Plus />}
            onClick={() => setAddPortDialogOpen(true)}
            sx={{ textTransform: 'none' }}
          >
            {t('nodes-add-input-port')}
          </Button>
        </Paper>
      )}
      {addPortDialogOpen && (
        <InputPortSettingsDialog
          title={t('nodes-add-input-port')}
          submitLabel={t('common-add')}
          onClose={() => setAddPortDialogOpen(false)}
          onSubmit={(fields) => addInputPort({ nodeId: currentNodeId, ...fields })}
        />
      )}
      {settingsPort && (
        <InputPortSettingsDialog
          title={t('nodes-edit-input-port')}
          submitLabel={t('common-save')}
          initial={{
            label: settingsPort.label ?? null,
            quantity: settingsPort.quantity ?? null,
            unit: settingsPort.unit?.standard ?? null,
          }}
          onClose={() => setSettingsPortId(null)}
          onSubmit={(fields) => saveSettingsPort(settingsPort.id, fields)}
          onDelete={() => deleteSettingsPort(settingsPort.id)}
          deleteDisabled={settingsPort.bindings.length > 0}
        />
      )}
      <Dialog open={editingPort !== null} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ pr: 6 }}>
          {sourcePortChoice
            ? t('nodes-select-output-port')
            : editingPort && editingPort.bindings.length > 0 && !editingPort.multi
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
          {sourcePortChoice ? (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {t('nodes-select-output-port-desc', {
                  node: sourcePortChoice.node.name ?? sourcePortChoice.node.identifier,
                })}
              </Typography>
              <List dense>
                {sourcePortChoice.outputs.map((output, outputIndex) => (
                  <ListItemButton
                    key={output.id}
                    disabled={binding}
                    onClick={() => void connectSource(sourcePortChoice.node, output.id)}
                    sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, mb: 0.5 }}
                  >
                    <ListItemText
                      primary={output.label ?? output.identifier ?? `#${outputIndex + 1}`}
                      secondary={
                        [output.quantity, output.unit?.short].filter(Boolean).join(' · ') ||
                        undefined
                      }
                    />
                  </ListItemButton>
                ))}
              </List>
              <Button
                size="small"
                startIcon={<ArrowLeft size={14} />}
                onClick={() => setSourcePortChoice(null)}
                disabled={binding}
                sx={{ textTransform: 'none' }}
              >
                {t('nodes-select-output-port-back')}
              </Button>
            </Box>
          ) : (
            editingPort && (
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
                  onSelectNode={(id) => handleSelectNode(id)}
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
            )
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
