import { type ReactNode, useEffect, useState } from 'react';

import {
  Autocomplete,
  Box,
  FormControlLabel,
  IconButton,
  Switch,
  TextField,
  type Theme,
  Tooltip,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';

import { useTranslations } from 'next-intl';
import { ArrowCounterclockwise, X } from 'react-bootstrap-icons';

import RichTextField from '../RichTextField';
import { type EditableNodeField, setMockNodeFieldEdit } from '../mockEdits';

/**
 * The field primitives of the node details panel. "Live" fields commit to the
 * backend on blur/change and show per-field save status; "Mock" fields write
 * to the client-side `mockNodeEditsVar` overlay (for backend fields that don't
 * exist yet) and render with the mock tint; "ReadOnly" fields display resolved
 * translations.
 */

export const metaChipSx = {
  height: 20,
  '& .MuiChip-label': { px: 0.75, fontSize: 10, color: 'text.secondary' },
};

/**
 * Tint for fields whose edits are not yet persisted to the backend (kept in
 * `mockNodeEditsVar`). Uses the theme's info palette so it's visually distinct
 * from the warning tint we reserve for actual pending/unsaved state.
 */
const MOCK_TINT_ALPHA = 0.09;
export function mockBg(theme: Theme) {
  return alpha(theme.palette.info.main, MOCK_TINT_ALPHA);
}

export function FieldLabel({
  children,
  onRevert,
  isMock,
}: {
  children: ReactNode;
  onRevert?: () => void;
  isMock?: boolean;
}) {
  const t = useTranslations('model-editor');
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, mb: 0.5, minHeight: 16 }}>
      <Typography
        variant="body2"
        sx={{ fontSize: 10, color: isMock ? 'info.main' : 'text.secondary' }}
      >
        {children}
        {isMock ? t('nodes-uneditable') : ''}
      </Typography>
      {onRevert && (
        <Tooltip title={t('nodes-revert-changes')} placement="top">
          <IconButton
            size="small"
            onClick={onRevert}
            aria-label={t('nodes-revert-changes')}
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

type LiveTextFieldProps = {
  label: string;
  nodeId: string;
  value: string;
  onCommit: (next: string) => Promise<unknown>;
  placeholder?: string;
};

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

function SaveStatusLabel({ status }: { status: SaveStatus }) {
  const t = useTranslations('model-editor');
  if (status === 'idle') return null;
  const { text, color } =
    status === 'saving'
      ? { text: t('common-saving'), color: 'text.secondary' as const }
      : status === 'saved'
        ? { text: t('common-saved'), color: 'success.main' as const }
        : { text: t('common-save-failed'), color: 'error.main' as const };
  return (
    <Typography variant="caption" sx={{ fontSize: 10, color }}>
      {text}
    </Typography>
  );
}

// Local-draft text input. The component is keyed on `nodeId` at the call site,
// so React remounts it when the user navigates between nodes — initializing
// `draft` from the new server value without an effect.
export function LiveTextField({ label, value, onCommit, placeholder }: LiveTextFieldProps) {
  const [draft, setDraft] = useState(value);
  const [status, setStatus] = useState<SaveStatus>('idle');

  useEffect(() => {
    if (status !== 'saved') return;
    const t = setTimeout(() => setStatus('idle'), 1500);
    return () => clearTimeout(t);
  }, [status]);

  const commit = () => {
    if (draft === value) return;
    setStatus('saving');
    onCommit(draft).then(
      () => setStatus('saved'),
      () => setStatus('error')
    );
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
        <FieldLabel>{label}</FieldLabel>
        <SaveStatusLabel status={status} />
      </Box>
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

type MockRichTextFieldProps = {
  label: string;
  field: Extract<EditableNodeField, 'shortDescription'>;
  nodeId: string;
  originalValue: string | null;
  currentValue: string | null | undefined;
  editorUserName: string;
  placeholder?: string;
};

// Mock rich-text editor. Tiptap is seeded only at mount (see RichTextField),
// so we re-key the inner component on revert to force a remount that re-reads
// the original value.
export function MockRichTextField({
  label,
  field,
  nodeId,
  originalValue,
  currentValue,
  editorUserName,
  placeholder,
}: MockRichTextFieldProps) {
  const value = currentValue ?? originalValue ?? '';
  const hasEdit = currentValue !== undefined && (currentValue ?? '') !== (originalValue ?? '');
  const [revertTick, setRevertTick] = useState(0);

  const handleCommit = (html: string | null) => {
    setMockNodeFieldEdit(nodeId, field, html, originalValue, editorUserName);
    return Promise.resolve();
  };

  const handleRevert = () => {
    setMockNodeFieldEdit(nodeId, field, originalValue, originalValue, editorUserName);
    setRevertTick((t) => t + 1);
  };

  return (
    <Box
      sx={{
        '& .ProseMirror': { bgcolor: mockBg },
      }}
    >
      <FieldLabel onRevert={hasEdit ? handleRevert : undefined} isMock>
        {label}
      </FieldLabel>
      <RichTextField
        key={`${field}:${nodeId}:${revertTick}`}
        label={label}
        value={value}
        onCommit={handleCommit}
        placeholder={placeholder}
        hideHeader
        disabled
      />
    </Box>
  );
}

export type ActionGroupOption = { id: string; name: string; color: string | null };

type ActionGroupMockFieldProps = {
  nodeId: string;
  originalValue: string | null;
  currentValue: string | null | undefined;
  options: readonly ActionGroupOption[];
  editorUserName: string;
};

export function ActionGroupMockField({
  nodeId,
  originalValue,
  currentValue,
  options,
  editorUserName,
}: ActionGroupMockFieldProps) {
  const t = useTranslations('model-editor');
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
        {t('editor-field-action-group')}
      </FieldLabel>
      <Autocomplete
        value={selected}
        options={[...options]}
        getOptionLabel={(o) => o.name}
        isOptionEqualToValue={(a, b) => a.id === b.id}
        onChange={(_, next) => commit(next)}
        size="small"
        disabled
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
            placeholder={t('nodes-field-no-action-group')}
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

type LiveNodeGroupFieldProps = {
  value: string | null;
  options: readonly string[];
  onCommit: (next: string | null) => Promise<unknown>;
};

// Local-draft Autocomplete with freeSolo input. Same commit-on-blur pattern
// as LiveTextField — the caller is expected to remount via `key={nodeId}` so
// `draft` re-seeds from the new server value when switching nodes.
export function LiveNodeGroupField({ value, options, onCommit }: LiveNodeGroupFieldProps) {
  const t = useTranslations('model-editor');
  const [draft, setDraft] = useState(value ?? '');
  const [status, setStatus] = useState<SaveStatus>('idle');

  useEffect(() => {
    if (status !== 'saved') return;
    const id = setTimeout(() => setStatus('idle'), 1500);
    return () => clearTimeout(id);
  }, [status]);

  const commit = () => {
    const normalized = draft.trim() === '' ? null : draft.trim();
    if ((normalized ?? '') === (value ?? '')) return;
    setStatus('saving');
    onCommit(normalized).then(
      () => setStatus('saved'),
      () => setStatus('error')
    );
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
        <FieldLabel>{t('nodes-field-node-group')}</FieldLabel>
        <SaveStatusLabel status={status} />
      </Box>
      <Autocomplete
        value={draft}
        inputValue={draft}
        options={[...options]}
        freeSolo
        onChange={(_, next) => setDraft(typeof next === 'string' ? next : (next ?? ''))}
        onInputChange={(_, next, reason) => {
          if (reason === 'input' || reason === 'clear' || reason === 'reset') setDraft(next);
        }}
        onBlur={commit}
        size="small"
        renderInput={(params) => (
          <TextField
            {...params}
            placeholder={t('nodes-no-group')}
            slotProps={{
              input: {
                ...params.InputProps,
                sx: { fontSize: 13 },
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

export function LiveColorField({ nodeId, value, onCommit }: LiveColorFieldProps) {
  const t = useTranslations('model-editor');
  // Local draft so the color input reflects the user's in-progress pick
  // while the native picker is open. Committing on every `onChange` would
  // fire a mutation for each micro-movement in the picker — and back-to-
  // back mutations race the `EditorPublishState` refetch, tripping the
  // stale-version check on every event after the first. Commit once on
  // blur (picker close) instead. Keyed on `nodeId` so switching nodes
  // remounts and resets the draft to the new server value.
  const [draft, setDraft] = useState<string | null>(value);
  const hasColor = typeof draft === 'string' && draft !== '';

  return (
    <Box>
      <FieldLabel>{t('nodes-field-color')}</FieldLabel>
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
              ? { bgcolor: draft }
              : {
                  backgroundImage:
                    'linear-gradient(45deg, transparent 45%, rgba(0,0,0,0.3) 45%, rgba(0,0,0,0.3) 55%, transparent 55%)',
                  bgcolor: 'grey.100',
                }),
          }}
        >
          <input
            type="color"
            value={hasColor ? draft : '#000000'}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => {
              // Normalize cleared state to '' rather than null: the backend's
              // color column is a blank-able (not nullable) CharField, so an
              // explicit null is stripped by stripNulls and the clear becomes a
              // no-op. '' survives and is the backend's canonical "no color".
              if ((draft ?? '') !== (value ?? '')) onCommit(draft ?? '');
            }}
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
          {hasColor ? draft : t('nodes-no-color')}
        </Typography>
        {hasColor && (
          <Tooltip title={t('nodes-clear-color')} placement="top">
            <IconButton
              size="small"
              aria-label={t('nodes-clear-color')}
              onClick={() => {
                setDraft('');
                // Send '' (not null): clears the blank-able CharField on the
                // backend and survives stripNulls, unlike null.
                onCommit('');
              }}
              sx={{ p: 0.25, color: 'text.secondary' }}
            >
              <X size={14} />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    </Box>
  );
}

type LiveBooleanFieldProps = {
  label: string;
  value: boolean;
  onCommit: (value: boolean) => void;
};

export function LiveBooleanField({ label, value, onCommit }: LiveBooleanFieldProps) {
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

export function ReadOnlyTextField({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <Box>
      <FieldLabel isMock>{label}</FieldLabel>
      <TextField
        value={value ?? ''}
        size="small"
        fullWidth
        disabled
        sx={mockSx()}
        slotProps={{ input: { sx: { fontSize: 13 } } }}
      />
    </Box>
  );
}

export function ReadOnlyRichTextField({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <Box sx={{ '& .ProseMirror': { bgcolor: mockBg } }}>
      <FieldLabel isMock>{label}</FieldLabel>
      <RichTextField
        label={label}
        value={value ?? ''}
        onCommit={() => Promise.resolve()}
        hideHeader
        disabled
      />
    </Box>
  );
}
