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
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';

import { InfoSquare, PencilSquare, X as XIcon } from 'react-bootstrap-icons';

import type {
  EditorNodeEdgeFragment,
  EditorNodeFieldsFragment,
  OutputPortInput,
} from '@/common/__generated__/graphql';
import { getNodeStyle } from '../ElkNode';
import type { getNodeSpec } from '../nodeHelpers';
import { QUANTITY_SUGGESTIONS } from '../quantities';
import { useIsEditorReadOnly } from '../useIsEditorReadOnly';
import { useUpdateOutputPorts } from '../useUpdateOutputPorts';
import { CollapsibleSection, ConnectedNodeChip, NotConnectedChip, getStyleForNode } from './shared';

type NodeSpec = NonNullable<ReturnType<typeof getNodeSpec>>;
type OutputPort = NodeSpec['outputPorts'][number];

type PortPatch = { unit: string; quantity: string };

/**
 * Convert the node's current output ports to the input shape, preserving each
 * port's `id` (so edges/bindings keyed on it survive) and other fields. The
 * caller applies the edited port's changes on top before sending the whole list.
 */
function portsToInput(ports: readonly OutputPort[]): OutputPortInput[] {
  return ports.map((p) => ({
    id: p.id,
    unit: p.unit?.standard ?? '',
    quantity: p.quantity ?? null,
    label: p.label ?? null,
    columnId: p.columnId ?? null,
    dimensions: [...p.dimensions],
    isEditable: true,
  }));
}

/**
 * Edit one output port's unit + quantity. Mirrors the input-port editor: a
 * pencil button opens this dialog. Mounted only while a port is being edited,
 * so its drafts seed from that port.
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
  const [unit, setUnit] = useState(port.unit?.standard ?? '');
  const [quantity, setQuantity] = useState(port.quantity ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSave = unit.trim() !== '' && quantity.trim() !== '' && !submitting;

  const handleSave = () => {
    if (!canSave) return;
    setSubmitting(true);
    setError(null);
    onSave({ unit: unit.trim(), quantity: quantity.trim() })
      .then(() => onClose())
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to save'))
      .finally(() => setSubmitting(false));
  };

  return (
    <Dialog open onClose={submitting ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ pr: 6 }}>
        Edit output port
        <IconButton
          aria-label="Close"
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
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 0.5 }}>
          <TextField
            autoFocus
            label="Unit"
            placeholder="e.g. kt/a"
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
                label="Quantity"
                placeholder="e.g. emissions"
                slotProps={{ input: { ...params.InputProps, sx: { fontSize: 13 } } }}
              />
            )}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button onClick={handleSave} variant="contained" disabled={!canSave}>
          {submitting ? 'Saving…' : 'Save'}
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
  return (
    <Stack spacing={0.5} sx={{ py: 0.5 }}>
      <PortInfoRow label="ID" value={port.id} />
      <PortInfoRow label="Label" value={port.label ?? '—'} />
      <PortInfoRow label="Quantity" value={port.quantity ?? '—'} />
      <PortInfoRow label="Unit" value={port.unit?.short ?? '—'} />
      <PortInfoRow
        label="Dimensions"
        value={port.dimensions.length ? port.dimensions.join(', ') : '—'}
      />
      <PortInfoRow label="Edges" value={String(edgeCount)} />
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
}: NodeOutputPortsSectionProps) {
  const readOnly = useIsEditorReadOnly();
  const updateOutputPorts = useUpdateOutputPorts();
  const [editingPortId, setEditingPortId] = useState<string | null>(null);
  const editingPort = editingPortId ? (ports.find((p) => p.id === editingPortId) ?? null) : null;

  // Resend the whole port list (ids preserved) with the edited port's
  // unit/quantity applied — updateNode replaces output ports wholesale.
  const savePort = (portId: string, patch: PortPatch) => {
    const next = portsToInput(ports).map((p) =>
      p.id === portId ? { ...p, unit: patch.unit, quantity: patch.quantity || null } : p
    );
    return updateOutputPorts(nodeId, next);
  };

  if (ports.length === 0) return null;

  return (
    <CollapsibleSection
      title={`Node output ports (${ports.length})`}
      open={open}
      onToggle={onToggle}
    >
      {ports.map((port, index) => {
        const connectedEdges = outgoingByPort.get(port.id) ?? [];
        const singleTargetNode =
          connectedEdges.length === 1
            ? (nodeMap.get(connectedEdges[0].toRef.nodeId) ?? null)
            : null;
        // For a port with no explicit label and exactly one outgoing edge,
        // use the name downstream formulas reference this output by:
        // the edge's first tag (alias) or the target node's identifier.
        // `tags` cast: codegen is blocked by unrelated schema drift; the
        // fragment fetches `tags` at runtime.
        const singleEdgeTags =
          connectedEdges.length === 1
            ? ((connectedEdges[0] as (typeof connectedEdges)[0] & { tags: readonly string[] })
                .tags ?? [])
            : [];
        const derivedPortName =
          !port.label && singleTargetNode
            ? (singleEdgeTags[0] ?? singleTargetNode.identifier)
            : null;

        return (
          <Box key={port.id}>
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
                Port: {port.label ?? derivedPortName ?? `#${index + 1}`}
                <InfoSquare size={10} aria-label="Port info" />
              </Typography>
            </Tooltip>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', flex: 1 }}>
                {connectedEdges.length > 0 ? (
                  connectedEdges.map((e) => {
                    const targetNode = nodeMap.get(e.toRef.nodeId);
                    const highlighted = hoveredNodeId === e.toRef.nodeId;
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
                          nodeId={e.toRef.nodeId}
                          label={targetNode?.name ?? e.toRef.nodeId}
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
              {!readOnly && (
                <Tooltip title="Edit output port" placement="left">
                  <IconButton
                    size="small"
                    onClick={() => setEditingPortId(port.id)}
                    aria-label="Edit output port"
                    sx={{ p: 0.5, color: 'text.secondary' }}
                  >
                    <PencilSquare size={12} />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </Box>
        );
      })}
      {editingPort && (
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
