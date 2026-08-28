import { useState } from 'react';

import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';

import { useTranslations } from 'next-intl';
import { InfoSquare, X as XIcon } from 'react-bootstrap-icons';

import type {
  EditorNodeEdgeFragment,
  EditorNodeFieldsFragment,
  OutputPortInput,
} from '@/common/__generated__/graphql';
import { getNodeStyle } from '../ElkNode';
import type { getNodeSpec } from '../nodeHelpers';
import { QUANTITY_SUGGESTIONS } from '../quantities';
import { useUpdateOutputPorts } from '../useUpdateOutputPorts';
import DimensionsSelect from './DimensionsSelect';
import { CollapsibleSection, ConnectedNodeChip, NotConnectedChip, getStyleForNode } from './shared';

type NodeSpec = NonNullable<ReturnType<typeof getNodeSpec>>;
type OutputPort = NodeSpec['outputPorts'][number];

type PortPatch = { unit: string; quantity: string; dimensions: string[] };

/**
 * Convert the node's current output ports to the input shape, preserving each
 * port's `id` (so edges/bindings keyed on it survive) and other fields. The
 * caller applies the edited port's changes on top before sending the whole list.
 */
function portsToInput(ports: readonly OutputPort[]): OutputPortInput[] {
  return ports.map((p) => ({
    id: p.id,
    identifier: p.identifier ?? null,
    unit: p.unit?.standard ?? '',
    quantity: p.quantity ?? null,
    label: p.label ?? null,
    // Backfill: a single output port's physical metric column is the runtime
    // default 'Value' (backend VALUE_COLUMN). Editor-created ports predating
    // this had columnId null, which breaks metric lookups keyed on it (e.g.
    // the output data preview) — saving any port edit repairs them. Multi-port
    // nodes keep whatever they have; their columns are genuinely distinct.
    columnId: p.columnId ?? (ports.length === 1 ? 'Value' : null),
    dimensions: [...p.dimensions],
    isEditable: true,
  }));
}

/**
 * Edit one output port's unit + quantity + dimensions. Mirrors the input-port
 * editor: opened from the port's quantity/unit text. Mounted only while a
 * port is being edited, so its drafts seed from that port.
 */
function OutputPortEditDialog({
  port,
  onClose,
  onSave,
}: {
  port: OutputPort;
  onClose: () => void;
  onSave: (patch: PortPatch) => Promise<void>;
}) {
  const t = useTranslations('model-editor');
  const [unit, setUnit] = useState(port.unit?.standard ?? '');
  const [quantity, setQuantity] = useState(port.quantity ?? '');
  const [dimensions, setDimensions] = useState<string[]>([...port.dimensions]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSave = unit.trim() !== '' && quantity.trim() !== '' && !submitting;

  const handleSave = () => {
    if (!canSave) return;
    setSubmitting(true);
    setError(null);
    onSave({ unit: unit.trim(), quantity: quantity.trim(), dimensions })
      .then(() => onClose())
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : t('common-save-failed'))
      )
      .finally(() => setSubmitting(false));
  };

  return (
    <Dialog open onClose={submitting ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ pr: 6 }}>
        {t('nodes-edit-output-port')}
        <IconButton
          aria-label={t('common-close')}
          onClick={onClose}
          disabled={submitting}
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
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            autoFocus
            label={t('nodes-port-unit')}
            placeholder={t('nodes-port-unit-hint')}
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
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
          <DimensionsSelect
            label={t('nodes-port-dimensions')}
            value={dimensions}
            onChange={setDimensions}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>
          {t('common-cancel')}
        </Button>
        <Button onClick={handleSave} variant="contained" disabled={!canSave}>
          {submitting ? t('common-saving') : t('common-save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
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

function PortTooltipContent({ port, edgeCount }: { port: OutputPort; edgeCount: number }) {
  const t = useTranslations('model-editor');
  return (
    <Stack spacing={0.5} sx={{ py: 0.5 }}>
      <PortInfoRow label={t('nodes-port-id')} value={port.id} />
      <PortInfoRow label={t('nodes-port-label-field')} value={port.label ?? '—'} />
      <PortInfoRow label={t('nodes-port-quantity')} value={port.quantity ?? '—'} />
      <PortInfoRow label={t('nodes-port-unit')} value={port.unit?.short ?? '—'} />
      <PortInfoRow
        label={t('datasets-dimensions')}
        value={port.dimensions.length ? port.dimensions.join(', ') : '—'}
      />
      <PortInfoRow label={t('nodes-port-edges')} value={String(edgeCount)} />
    </Stack>
  );
}

type NodeOutputPortsSectionProps = {
  nodeId: string;
  ports: readonly OutputPort[];
  outgoingByPort: ReadonlyMap<string, readonly EditorNodeEdgeFragment[]>;
  nodeMap: ReadonlyMap<string, EditorNodeFieldsFragment>;
  hoveredNodeId: string | null;
  open: boolean;
  onToggle: () => void;
  onSelectNode: (nodeId: string) => void;
  onHover: (nodeId: string | null) => void;
  readOnly: boolean;
};

export default function NodeOutputPortsSection({
  nodeId,
  ports,
  outgoingByPort,
  nodeMap,
  hoveredNodeId,
  open,
  onToggle,
  onSelectNode,
  onHover,
  readOnly,
}: NodeOutputPortsSectionProps) {
  const t = useTranslations('model-editor');
  const updateOutputPorts = useUpdateOutputPorts();
  const [editingPortId, setEditingPortId] = useState<string | null>(null);
  const editingPort = editingPortId ? (ports.find((p) => p.id === editingPortId) ?? null) : null;

  // Resend the whole port list (ids preserved) with the edited port's
  // unit/quantity/dimensions applied — updateNode replaces output ports
  // wholesale. The node-level outputDimensions (what the engine actually
  // validates output frames against) is kept in sync as the union of the
  // ports' dimension lists.
  const savePort = (portId: string, patch: PortPatch) => {
    const next = portsToInput(ports).map((p) =>
      p.id === portId
        ? { ...p, unit: patch.unit, quantity: patch.quantity || null, dimensions: patch.dimensions }
        : p
    );
    const outputDimensions = [...new Set(next.flatMap((p) => p.dimensions ?? []))];
    return updateOutputPorts(nodeId, next, outputDimensions);
  };

  if (ports.length === 0) return null;

  return (
    <CollapsibleSection
      title={t('nodes-output-ports', { count: ports.length })}
      open={open}
      onToggle={onToggle}
    >
      {ports.map((port, index) => {
        const connectedEdges = outgoingByPort.get(port.id) ?? [];
        const singleTargetNode =
          connectedEdges.length === 1
            ? (nodeMap.get(connectedEdges[0].portRef.nodeUuid) ?? null)
            : null;
        // For a port with no explicit label and exactly one outgoing edge,
        // use the name downstream formulas reference this output by:
        // the edge's first tag (alias) or the target node's identifier.
        // `tags` cast: codegen is blocked by unrelated schema drift; the
        // fragment fetches `tags` at runtime.
        const singleEdgeTags =
          connectedEdges.length === 1
            ? ((
                connectedEdges[0] satisfies (typeof connectedEdges)[0] & { tags: readonly string[] }
              ).tags ?? [])
            : [];
        const derivedPortName =
          !port.label && singleTargetNode
            ? (singleEdgeTags[0] ?? singleTargetNode.identifier)
            : null;

        const quantityAndUnit =
          [port.quantity, port.unit?.short].filter(Boolean).join(' · ') ||
          t('nodes-port-unrestricted');

        return (
          <Paper key={port.id} variant="outlined" sx={{ p: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 0.5 }}>
              <Tooltip
                title={<PortTooltipContent port={port} edgeCount={connectedEdges.length} />}
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
                <Tooltip title={t('nodes-edit-output-port')} placement="right">
                  <Typography
                    component="button"
                    type="button"
                    variant="body2"
                    onClick={() => setEditingPortId(port.id)}
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
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', flex: 1 }}>
                {connectedEdges.length > 0 ? (
                  connectedEdges.map((e) => {
                    const targetNode = nodeMap.get(e.portRef.nodeUuid);
                    const highlighted = hoveredNodeId === targetNode?.id;
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
                          nodeId={targetNode?.id ?? e.portRef.nodeUuid}
                          label={targetNode?.name ?? e.portRef.nodeUuid}
                          style={
                            targetNode ? getStyleForNode(targetNode) : getNodeStyle('', '', false)
                          }
                          onSelect={onSelectNode}
                          onHover={onHover}
                        />
                      </Box>
                    );
                  })
                ) : (
                  <NotConnectedChip />
                )}
              </Box>
            </Box>
          </Paper>
        );
      })}
      {!readOnly && editingPort && (
        <OutputPortEditDialog
          key={editingPort.id}
          port={editingPort}
          onClose={() => setEditingPortId(null)}
          onSave={(patch) => savePort(editingPort.id, patch)}
        />
      )}
    </CollapsibleSection>
  );
}
