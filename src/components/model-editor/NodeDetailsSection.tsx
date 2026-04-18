import { type ReactNode } from 'react';

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

import {
  ArrowCounterclockwise,
  BoxArrowUpRight,
  PencilSquare,
  X as XIcon,
} from 'react-bootstrap-icons';

import type { EditorNodeFieldsFragment } from '@/common/__generated__/graphql';
import { modelEditorModeVar } from '@/common/cache';
import { NodeLink } from '@/common/links';
import { type EditableNodeField, type MockNodeEdit, setMockNodeFieldEdit } from './mockEdits';
import { getNodeGroup } from './nodeHelpers';

const metaChipSx = {
  height: 20,
  '& .MuiChip-label': { px: 0.75, fontSize: 10, color: 'text.secondary' },
};

function FieldLabel({ children, onRevert }: { children: ReactNode; onRevert?: () => void }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, mb: 0.5, minHeight: 16 }}>
      <Typography variant="body2" sx={{ fontSize: 10, color: 'text.secondary' }}>
        {children}
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

function EditLockOverlay() {
  return (
    <Box
      role="button"
      tabIndex={0}
      onClick={() => modelEditorModeVar('draft')}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          modelEditorModeVar('draft');
        }
      }}
      sx={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 0.75,
        cursor: 'pointer',
        borderRadius: 1,
        opacity: 0,
        bgcolor: (theme) => alpha(theme.palette.warning.main, 0.9),
        color: (theme) => theme.palette.warning.contrastText,
        transition: 'opacity 0.15s',
        '&:hover, &:focus-visible': { opacity: 1 },
        '&:focus-visible': {
          outline: (theme) => `2px solid ${theme.palette.warning.main}`,
          outlineOffset: 2,
        },
      }}
    >
      <PencilSquare size={12} />
      <Typography variant="caption" sx={{ fontWeight: 600, color: 'inherit' }}>
        Edit in draft mode
      </Typography>
    </Box>
  );
}

type EditableWrapperProps = {
  isEditable: boolean;
  children: ReactNode;
};

function EditableWrapper({ isEditable, children }: EditableWrapperProps) {
  return (
    <Box sx={{ position: 'relative' }}>
      {children}
      {!isEditable && <EditLockOverlay />}
    </Box>
  );
}

function editedSx(hasEdit: boolean) {
  return hasEdit
    ? {
        '& .MuiOutlinedInput-root': {
          bgcolor: (theme: Theme) => alpha(theme.palette.warning.main, 0.15),
        },
      }
    : undefined;
}

function editedSwitchSx(hasEdit: boolean) {
  return hasEdit
    ? {
        px: 0.5,
        borderRadius: 1,
        bgcolor: (theme: Theme) => alpha(theme.palette.warning.main, 0.15),
      }
    : { px: 0.5 };
}

type TextEditFieldProps = {
  label: string;
  field: Extract<EditableNodeField, 'name' | 'shortName' | 'description' | 'nodeGroup'>;
  nodeId: string;
  originalValue: string | null;
  currentValue: string | null | undefined;
  isEditable: boolean;
  editorUserName: string;
  multiline?: boolean;
  placeholder?: string;
};

function TextEditField({
  label,
  field,
  nodeId,
  originalValue,
  currentValue,
  isEditable,
  editorUserName,
  multiline,
  placeholder,
}: TextEditFieldProps) {
  const value = currentValue ?? originalValue ?? '';
  const hasEdit =
    isEditable && currentValue !== undefined && (currentValue ?? '') !== (originalValue ?? '');

  const handleRevert = () => {
    setMockNodeFieldEdit(nodeId, field, originalValue, originalValue, editorUserName);
  };

  return (
    <Box>
      <FieldLabel onRevert={hasEdit ? handleRevert : undefined}>{label}</FieldLabel>
      <EditableWrapper isEditable={isEditable}>
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
          disabled={!isEditable}
          multiline={multiline}
          minRows={multiline ? 2 : undefined}
          maxRows={multiline ? 6 : undefined}
          placeholder={placeholder}
          sx={editedSx(hasEdit)}
          slotProps={{
            input: { sx: { fontSize: 13 } },
          }}
        />
      </EditableWrapper>
    </Box>
  );
}

type ActionGroupOption = { id: string; name: string; color: string | null };

type ActionGroupEditFieldProps = {
  nodeId: string;
  originalValue: string | null;
  currentValue: string | null | undefined;
  options: readonly ActionGroupOption[];
  isEditable: boolean;
  editorUserName: string;
};

function ActionGroupEditField({
  nodeId,
  originalValue,
  currentValue,
  options,
  isEditable,
  editorUserName,
}: ActionGroupEditFieldProps) {
  const effective = currentValue === undefined ? originalValue : currentValue;
  const selected = options.find((o) => o.id === effective) ?? null;
  const hasEdit =
    isEditable && currentValue !== undefined && (currentValue ?? null) !== (originalValue ?? null);

  const commit = (next: ActionGroupOption | null) => {
    setMockNodeFieldEdit(nodeId, 'actionGroup', next?.id ?? null, originalValue, editorUserName);
  };

  const handleRevert = () => {
    setMockNodeFieldEdit(nodeId, 'actionGroup', originalValue, originalValue, editorUserName);
  };

  return (
    <Box>
      <FieldLabel onRevert={hasEdit ? handleRevert : undefined}>Action group</FieldLabel>
      <EditableWrapper isEditable={isEditable}>
        <Autocomplete
          value={selected}
          options={[...options]}
          disabled={!isEditable}
          getOptionLabel={(o) => o.name}
          isOptionEqualToValue={(a, b) => a.id === b.id}
          onChange={(_, next) => commit(next)}
          size="small"
          sx={editedSx(hasEdit)}
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
                  sx: { fontSize: 13 },
                },
              }}
            />
          )}
        />
      </EditableWrapper>
    </Box>
  );
}

type NodeGroupEditFieldProps = {
  nodeId: string;
  originalValue: string | null;
  currentValue: string | null | undefined;
  options: readonly string[];
  isEditable: boolean;
  editorUserName: string;
};

function NodeGroupEditField({
  nodeId,
  originalValue,
  currentValue,
  options,
  isEditable,
  editorUserName,
}: NodeGroupEditFieldProps) {
  const effective = currentValue === undefined ? originalValue : currentValue;
  const value = effective ?? '';
  const hasEdit =
    isEditable && currentValue !== undefined && (currentValue ?? null) !== (originalValue ?? null);

  const commit = (next: string | null) => {
    setMockNodeFieldEdit(nodeId, 'nodeGroup', next, originalValue, editorUserName);
  };

  const handleRevert = () => {
    setMockNodeFieldEdit(nodeId, 'nodeGroup', originalValue, originalValue, editorUserName);
  };

  return (
    <Box>
      <FieldLabel onRevert={hasEdit ? handleRevert : undefined}>Node group</FieldLabel>
      <EditableWrapper isEditable={isEditable}>
        <Autocomplete
          value={value}
          options={options}
          freeSolo
          disabled={!isEditable}
          onChange={(_, next) => commit(next && next !== '' ? next : null)}
          onInputChange={(_, next, reason) => {
            if (reason === 'input' || reason === 'clear') {
              commit(next && next !== '' ? next : null);
            }
          }}
          size="small"
          sx={editedSx(hasEdit)}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="No group"
              slotProps={{
                input: {
                  ...params.InputProps,
                  sx: { fontSize: 13 },
                },
              }}
            />
          )}
        />
      </EditableWrapper>
    </Box>
  );
}

type ColorEditFieldProps = {
  nodeId: string;
  originalValue: string | null;
  currentValue: string | null | undefined;
  isEditable: boolean;
  editorUserName: string;
};

function ColorEditField({
  nodeId,
  originalValue,
  currentValue,
  isEditable,
  editorUserName,
}: ColorEditFieldProps) {
  const effective = currentValue === undefined ? originalValue : currentValue;
  const hasEdit =
    isEditable && currentValue !== undefined && (currentValue ?? null) !== (originalValue ?? null);
  const hasColor = typeof effective === 'string' && effective !== '';

  const setValue = (value: string | null) => {
    setMockNodeFieldEdit(nodeId, 'color', value, originalValue, editorUserName);
  };

  const handleRevert = () => {
    setMockNodeFieldEdit(nodeId, 'color', originalValue, originalValue, editorUserName);
  };

  return (
    <Box>
      <FieldLabel onRevert={hasEdit ? handleRevert : undefined}>Color</FieldLabel>
      <EditableWrapper isEditable={isEditable}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            p: 0.25,
            borderRadius: 1,
            bgcolor: hasEdit
              ? (theme: Theme) => alpha(theme.palette.warning.main, 0.15)
              : 'transparent',
          }}
        >
          <Box
            component="label"
            sx={{
              position: 'relative',
              width: 22,
              height: 22,
              borderRadius: 0.5,
              border: '1px solid',
              borderColor: 'divider',
              cursor: isEditable ? 'pointer' : 'default',
              overflow: 'hidden',
              flexShrink: 0,
              ...(hasColor
                ? { bgcolor: effective }
                : {
                    backgroundImage:
                      'linear-gradient(45deg, transparent 45%, rgba(0,0,0,0.3) 45%, rgba(0,0,0,0.3) 55%, transparent 55%)',
                    bgcolor: 'grey.100',
                  }),
            }}
          >
            <input
              type="color"
              value={hasColor ? effective : '#000000'}
              disabled={!isEditable}
              onChange={(e) => setValue(e.target.value)}
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
            {hasColor ? effective : 'No color'}
          </Typography>
          {hasColor && isEditable && (
            <IconButton
              size="small"
              onClick={() => setValue(null)}
              title="Clear color"
              sx={{ p: 0.25 }}
            >
              <XIcon size={12} />
            </IconButton>
          )}
        </Box>
      </EditableWrapper>
    </Box>
  );
}

type BooleanEditFieldProps = {
  label: string;
  field: Extract<EditableNodeField, 'isVisible' | 'isOutcome'>;
  nodeId: string;
  originalValue: boolean;
  currentValue: boolean | undefined;
  isEditable: boolean;
  editorUserName: string;
};

function BooleanEditField({
  label,
  field,
  nodeId,
  originalValue,
  currentValue,
  isEditable,
  editorUserName,
}: BooleanEditFieldProps) {
  const value = currentValue ?? originalValue;
  const hasEdit = isEditable && currentValue !== undefined && currentValue !== originalValue;

  const handleRevert = () => {
    setMockNodeFieldEdit(nodeId, field, originalValue, originalValue, editorUserName);
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <EditableWrapper isEditable={isEditable}>
        <FormControlLabel
          disabled={!isEditable}
          control={
            <Switch
              size="small"
              checked={value}
              onChange={(e) =>
                setMockNodeFieldEdit(nodeId, field, e.target.checked, originalValue, editorUserName)
              }
            />
          }
          label={<Typography sx={{ fontSize: 13 }}>{label}</Typography>}
          sx={editedSwitchSx(hasEdit)}
        />
      </EditableWrapper>
      {hasEdit && (
        <Tooltip title="Revert changes" placement="top">
          <IconButton
            size="small"
            onClick={handleRevert}
            aria-label="Revert changes"
            sx={{ p: 0.125, ml: 0.25, color: 'warning.main' }}
          >
            <ArrowCounterclockwise size={11} />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
}

export type NodeDetailsSectionProps = {
  node: EditorNodeFieldsFragment;
  isEditable: boolean;
  editorUserName: string;
  currentEdit: MockNodeEdit | undefined;
  nodeGroupOptions: readonly string[];
  actionGroupOptions: readonly ActionGroupOption[];
};

export default function NodeDetailsSection({
  node,
  isEditable,
  editorUserName,
  currentEdit,
  nodeGroupOptions,
  actionGroupOptions,
}: NodeDetailsSectionProps) {
  const originalIsOutcome = node.__typename === 'Node' ? (node.isOutcome ?? false) : false;
  const displayIsOutcome = currentEdit?.isOutcome ?? originalIsOutcome;
  const supportsOutcome = node.__typename === 'Node';
  const isActionNode = node.__typename === 'ActionNode';
  const originalActionGroupId = node.__typename === 'ActionNode' ? (node.group?.id ?? null) : null;

  return (
    <>
      <TextEditField
        label="Name"
        field="name"
        nodeId={node.id}
        originalValue={node.name ?? ''}
        currentValue={currentEdit?.name}
        isEditable={isEditable}
        editorUserName={editorUserName}
      />

      <TextEditField
        label="Short name"
        field="shortName"
        nodeId={node.id}
        originalValue={node.shortName ?? null}
        currentValue={currentEdit?.shortName}
        isEditable={isEditable}
        editorUserName={editorUserName}
        placeholder="Abbreviated label"
      />

      <TextEditField
        label="Description"
        field="description"
        nodeId={node.id}
        originalValue={node.description ?? null}
        currentValue={currentEdit?.description}
        isEditable={isEditable}
        editorUserName={editorUserName}
        multiline
      />

      <ColorEditField
        nodeId={node.id}
        originalValue={node.color ?? null}
        currentValue={currentEdit?.color}
        isEditable={isEditable}
        editorUserName={editorUserName}
      />

      <NodeGroupEditField
        nodeId={node.id}
        originalValue={getNodeGroup(node)}
        currentValue={currentEdit?.nodeGroup}
        options={nodeGroupOptions}
        isEditable={isEditable}
        editorUserName={editorUserName}
      />

      {isActionNode && (
        <ActionGroupEditField
          nodeId={node.id}
          originalValue={originalActionGroupId}
          currentValue={currentEdit?.actionGroup}
          options={actionGroupOptions}
          isEditable={isEditable}
          editorUserName={editorUserName}
        />
      )}

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <BooleanEditField
          label="Visible"
          field="isVisible"
          nodeId={node.id}
          originalValue={node.isVisible ?? true}
          currentValue={currentEdit?.isVisible}
          isEditable={isEditable}
          editorUserName={editorUserName}
        />
        {supportsOutcome && (
          <BooleanEditField
            label="Outcome"
            field="isOutcome"
            nodeId={node.id}
            originalValue={originalIsOutcome}
            currentValue={currentEdit?.isOutcome}
            isEditable={isEditable}
            editorUserName={editorUserName}
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

      {(node.quantityKind ?? displayIsOutcome) && (
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
            {displayIsOutcome && (
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
