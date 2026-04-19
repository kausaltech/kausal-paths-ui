import { type ReactNode, useCallback, useState } from 'react';

import {
  Autocomplete,
  Box,
  Button,
  Chip,
  FormControlLabel,
  IconButton,
  Switch,
  TextField,
  type Theme,
  Tooltip,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';

import { useMutation } from '@apollo/client/react';
import { ArrowCounterclockwise, BoxArrowUpRight } from 'react-bootstrap-icons';

import type {
  EditorNodeFieldsFragment,
  UpdateNodeInput,
  UpdateNodeMutation,
  UpdateNodeMutationVariables,
} from '@/common/__generated__/graphql';
import { useInstance } from '@/common/instance';
import { NodeLink } from '@/common/links';
import { type EditableNodeField, type MockNodeEdit, setMockNodeFieldEdit } from './mockEdits';
import { getNodeGroup } from './nodeHelpers';
import { UPDATE_NODE } from './queries';

const metaChipSx = {
  height: 20,
  '& .MuiChip-label': { px: 0.75, fontSize: 10, color: 'text.secondary' },
};

/**
 * Tint for fields whose edits are not yet persisted to the backend (kept in
 * `mockNodeEditsVar`). Uses the theme's info palette so it's visually distinct
 * from the warning tint we reserve for actual pending/unsaved state.
 */
const MOCK_TINT_ALPHA = 0.18;
function mockBg(theme: Theme) {
  return alpha(theme.palette.info.main, MOCK_TINT_ALPHA);
}

function FieldLabel({
  children,
  onRevert,
  isMock,
}: {
  children: ReactNode;
  onRevert?: () => void;
  isMock?: boolean;
}) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, mb: 0.5, minHeight: 16 }}>
      <Typography
        variant="body2"
        sx={{ fontSize: 10, color: isMock ? 'info.main' : 'text.secondary' }}
      >
        {children}
        {isMock ? ' · mock' : ''}
      </Typography>
      {onRevert && (
        <Tooltip title="Revert changes" placement="top">
          <IconButton
            size="small"
            onClick={onRevert}
            aria-label="Revert changes"
            sx={{ p: 0.125, color: 'warning.main' }}
          >
            <ArrowCounterclockwise size={11} />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
}

function mockSx() {
  return {
    '& .MuiOutlinedInput-root': {
      bgcolor: mockBg,
    },
  };
}

// Backend rejects explicit `null` on Maybe[str] fields — must omit them.
// Codegen types require every input field, so we strip nulls and cast.
function stripNulls(input: Partial<UpdateNodeInput>): UpdateNodeInput {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(input)) {
    if (v !== null && v !== undefined) out[k] = v;
  }
  return out as UpdateNodeInput;
}

function useUpdateNodeMutation() {
  const instance = useInstance();
  const [mutate] = useMutation<UpdateNodeMutation, UpdateNodeMutationVariables>(UPDATE_NODE);
  return useCallback(
    (nodeId: string, input: Partial<UpdateNodeInput>) =>
      mutate({
        variables: { instanceId: instance.id, nodeId, input: stripNulls(input) },
      }),
    [instance.id, mutate]
  );
}

type LiveTextFieldProps = {
  label: string;
  nodeId: string;
  value: string;
  onCommit: (next: string) => Promise<unknown> | void;
  placeholder?: string;
};

// Local-draft text input. The component is keyed on `nodeId` at the call site,
// so React remounts it when the user navigates between nodes — initializing
// `draft` from the new server value without an effect.
function LiveTextField({ label, value, onCommit, placeholder }: LiveTextFieldProps) {
  const [draft, setDraft] = useState(value);

  const commit = () => {
    if (draft === value) return;
    void onCommit(draft);
  };

  return (
    <Box>
      <FieldLabel>{label}</FieldLabel>
      <TextField
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            (e.target as HTMLInputElement).blur();
          }
        }}
        size="small"
        fullWidth
        placeholder={placeholder}
        slotProps={{ input: { sx: { fontSize: 13 } } }}
      />
    </Box>
  );
}

type MockTextFieldProps = {
  label: string;
  field: Extract<EditableNodeField, 'shortName' | 'description' | 'nodeGroup'>;
  nodeId: string;
  originalValue: string | null;
  currentValue: string | null | undefined;
  editorUserName: string;
  multiline?: boolean;
  placeholder?: string;
};

function MockTextField({
  label,
  field,
  nodeId,
  originalValue,
  currentValue,
  editorUserName,
  multiline,
  placeholder,
}: MockTextFieldProps) {
  const value = currentValue ?? originalValue ?? '';
  const hasEdit = currentValue !== undefined && (currentValue ?? '') !== (originalValue ?? '');

  const handleRevert = () => {
    setMockNodeFieldEdit(nodeId, field, originalValue, originalValue, editorUserName);
  };

  return (
    <Box>
      <FieldLabel onRevert={hasEdit ? handleRevert : undefined} isMock>
        {label}
      </FieldLabel>
      <TextField
        value={value}
        onChange={(e) => {
          const next = e.target.value;
          setMockNodeFieldEdit(
            nodeId,
            field,
            next === '' ? null : next,
            originalValue,
            editorUserName
          );
        }}
        size="small"
        fullWidth
        multiline={multiline}
        minRows={multiline ? 2 : undefined}
        maxRows={multiline ? 6 : undefined}
        placeholder={placeholder}
        sx={mockSx()}
        slotProps={{
          input: {
            sx: { fontSize: 13, color: hasEdit ? 'info.dark' : 'text.primary' },
          },
        }}
      />
    </Box>
  );
}

type ActionGroupOption = { id: string; name: string; color: string | null };

type ActionGroupMockFieldProps = {
  nodeId: string;
  originalValue: string | null;
  currentValue: string | null | undefined;
  options: readonly ActionGroupOption[];
  editorUserName: string;
};

function ActionGroupMockField({
  nodeId,
  originalValue,
  currentValue,
  options,
  editorUserName,
}: ActionGroupMockFieldProps) {
  const effective = currentValue === undefined ? originalValue : currentValue;
  const selected = options.find((o) => o.id === effective) ?? null;
  const hasEdit = currentValue !== undefined && (currentValue ?? null) !== (originalValue ?? null);

  const commit = (next: ActionGroupOption | null) => {
    setMockNodeFieldEdit(nodeId, 'actionGroup', next?.id ?? null, originalValue, editorUserName);
  };

  const handleRevert = () => {
    setMockNodeFieldEdit(nodeId, 'actionGroup', originalValue, originalValue, editorUserName);
  };

  return (
    <Box>
      <FieldLabel onRevert={hasEdit ? handleRevert : undefined} isMock>
        Action group
      </FieldLabel>
      <Autocomplete
        value={selected}
        options={[...options]}
        getOptionLabel={(o) => o.name}
        isOptionEqualToValue={(a, b) => a.id === b.id}
        onChange={(_, next) => commit(next)}
        size="small"
        sx={mockSx()}
        renderOption={(props, option) => (
          <Box component="li" {...props} key={option.id}>
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                bgcolor: option.color ?? 'transparent',
                border: option.color ? 'none' : '1px solid',
                borderColor: 'divider',
                mr: 1,
              }}
            />
            <Typography sx={{ fontSize: 13 }}>{option.name}</Typography>
          </Box>
        )}
        renderInput={(params) => (
          <TextField
            {...params}
            placeholder="No action group"
            slotProps={{
              input: {
                ...params.InputProps,
                startAdornment: selected?.color ? (
                  <Box
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      bgcolor: selected.color,
                      ml: 0.5,
                    }}
                  />
                ) : null,
                sx: { fontSize: 13, color: hasEdit ? 'info.dark' : 'text.primary' },
              },
            }}
          />
        )}
      />
    </Box>
  );
}

type NodeGroupMockFieldProps = {
  nodeId: string;
  originalValue: string | null;
  currentValue: string | null | undefined;
  options: readonly string[];
  editorUserName: string;
};

function NodeGroupMockField({
  nodeId,
  originalValue,
  currentValue,
  options,
  editorUserName,
}: NodeGroupMockFieldProps) {
  const effective = currentValue === undefined ? originalValue : currentValue;
  const value = effective ?? '';
  const hasEdit = currentValue !== undefined && (currentValue ?? null) !== (originalValue ?? null);

  const commit = (next: string | null) => {
    setMockNodeFieldEdit(nodeId, 'nodeGroup', next, originalValue, editorUserName);
  };

  const handleRevert = () => {
    setMockNodeFieldEdit(nodeId, 'nodeGroup', originalValue, originalValue, editorUserName);
  };

  return (
    <Box>
      <FieldLabel onRevert={hasEdit ? handleRevert : undefined} isMock>
        Node group
      </FieldLabel>
      <Autocomplete
        value={value}
        options={options}
        freeSolo
        onChange={(_, next) => commit(next && next !== '' ? next : null)}
        onInputChange={(_, next, reason) => {
          if (reason === 'input' || reason === 'clear') {
            commit(next && next !== '' ? next : null);
          }
        }}
        size="small"
        sx={mockSx()}
        renderInput={(params) => (
          <TextField
            {...params}
            placeholder="No group"
            slotProps={{
              input: {
                ...params.InputProps,
                sx: { fontSize: 13, color: hasEdit ? 'info.dark' : 'text.primary' },
              },
            }}
          />
        )}
      />
    </Box>
  );
}

type LiveColorFieldProps = {
  nodeId: string;
  value: string | null;
  onCommit: (value: string | null) => void;
};

function LiveColorField({ nodeId, value, onCommit }: LiveColorFieldProps) {
  const hasColor = typeof value === 'string' && value !== '';

  return (
    <Box>
      <FieldLabel>Color</FieldLabel>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          p: 0.25,
          borderRadius: 1,
        }}
      >
        <Box
          key={nodeId}
          component="label"
          sx={{
            position: 'relative',
            width: 22,
            height: 22,
            borderRadius: 0.5,
            border: '1px solid',
            borderColor: 'divider',
            cursor: 'pointer',
            overflow: 'hidden',
            flexShrink: 0,
            ...(hasColor
              ? { bgcolor: value }
              : {
                  backgroundImage:
                    'linear-gradient(45deg, transparent 45%, rgba(0,0,0,0.3) 45%, rgba(0,0,0,0.3) 55%, transparent 55%)',
                  bgcolor: 'grey.100',
                }),
          }}
        >
          <input
            type="color"
            value={hasColor ? value : '#000000'}
            onChange={(e) => onCommit(e.target.value)}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              opacity: 0,
              cursor: 'inherit',
              border: 'none',
              padding: 0,
            }}
          />
        </Box>
        <Typography
          variant="caption"
          sx={{
            fontFamily: 'monospace',
            fontSize: 12,
            color: hasColor ? 'text.primary' : 'text.disabled',
            flex: 1,
          }}
        >
          {hasColor ? value : 'No color'}
        </Typography>
      </Box>
    </Box>
  );
}

type LiveBooleanFieldProps = {
  label: string;
  value: boolean;
  onCommit: (value: boolean) => void;
};

function LiveBooleanField({ label, value, onCommit }: LiveBooleanFieldProps) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <FormControlLabel
        control={
          <Switch size="small" checked={value} onChange={(e) => onCommit(e.target.checked)} />
        }
        label={<Typography sx={{ fontSize: 13 }}>{label}</Typography>}
        sx={{ px: 0.5 }}
      />
    </Box>
  );
}

export type NodeDetailsSectionProps = {
  node: EditorNodeFieldsFragment;
  editorUserName: string;
  currentEdit: MockNodeEdit | undefined;
  nodeGroupOptions: readonly string[];
  actionGroupOptions: readonly ActionGroupOption[];
};

export default function NodeDetailsSection({
  node,
  editorUserName,
  currentEdit,
  nodeGroupOptions,
  actionGroupOptions,
}: NodeDetailsSectionProps) {
  const updateNode = useUpdateNodeMutation();

  const originalIsOutcome = node.__typename === 'Node' ? (node.isOutcome ?? false) : false;
  const supportsOutcome = node.__typename === 'Node';
  const isActionNode = node.__typename === 'ActionNode';
  const originalActionGroupId = node.__typename === 'ActionNode' ? (node.group?.id ?? null) : null;

  return (
    <>
      <LiveTextField
        key={`name:${node.id}`}
        label="Name"
        nodeId={node.id}
        value={node.name ?? ''}
        onCommit={(next) => updateNode(node.id, { name: next })}
      />

      <MockTextField
        label="Short name"
        field="shortName"
        nodeId={node.id}
        originalValue={node.shortName ?? null}
        currentValue={currentEdit?.shortName}
        editorUserName={editorUserName}
        placeholder="Abbreviated label"
      />

      <MockTextField
        label="Description"
        field="description"
        nodeId={node.id}
        originalValue={node.description ?? null}
        currentValue={currentEdit?.description}
        editorUserName={editorUserName}
        multiline
      />

      <LiveColorField
        nodeId={node.id}
        value={node.color ?? null}
        onCommit={(next) => {
          void updateNode(node.id, { color: next });
        }}
      />

      <NodeGroupMockField
        nodeId={node.id}
        originalValue={getNodeGroup(node)}
        currentValue={currentEdit?.nodeGroup}
        options={nodeGroupOptions}
        editorUserName={editorUserName}
      />

      {isActionNode && (
        <ActionGroupMockField
          nodeId={node.id}
          originalValue={originalActionGroupId}
          currentValue={currentEdit?.actionGroup}
          options={actionGroupOptions}
          editorUserName={editorUserName}
        />
      )}

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <LiveBooleanField
          label="Visible"
          value={node.isVisible ?? true}
          onCommit={(next) => {
            void updateNode(node.id, { isVisible: next });
          }}
        />
        {supportsOutcome && (
          <LiveBooleanField
            label="Outcome"
            value={originalIsOutcome}
            onCommit={(next) => {
              void updateNode(node.id, { isOutcome: next });
            }}
          />
        )}
      </Box>

      <Box>
        <FieldLabel>Identifier</FieldLabel>
        <Box
          sx={{
            width: '100%',
            bgcolor: 'grey.100',
            borderRadius: 0.5,
            px: 1,
            py: 0.5,
            overflowX: 'auto',
          }}
        >
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              display: 'block',
              fontFamily: 'monospace',
              fontSize: 10,
              whiteSpace: 'nowrap',
            }}
          >
            {node.identifier}
          </Typography>
        </Box>
      </Box>

      {(node.quantityKind ?? originalIsOutcome) && (
        <Box>
          <FieldLabel>Quantity</FieldLabel>
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {node.quantityKind && (
              <Chip
                label={`${node.quantityKind.icon ?? ''} ${node.quantityKind.label}`.trim()}
                title={`quantityKind: ${node.quantityKind.id}`}
                size="small"
                variant="outlined"
                sx={metaChipSx}
              />
            )}
            {originalIsOutcome && (
              <Chip label="outcome" size="small" color="primary" sx={metaChipSx} />
            )}
          </Box>
        </Box>
      )}

      <Box sx={{ alignSelf: 'flex-end', '& a': { textDecoration: 'none', color: 'inherit' } }}>
        <NodeLink node={{ id: node.identifier }} target="_blank" rel="noopener noreferrer">
          <Button
            size="small"
            variant="outlined"
            startIcon={<BoxArrowUpRight size={12} />}
            sx={{ fontSize: 11, py: 0.25, textTransform: 'none' }}
          >
            Open public page
          </Button>
        </NodeLink>
      </Box>
    </>
  );
}
