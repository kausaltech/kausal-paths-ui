import { type ReactNode, useCallback, useEffect, useState } from 'react';

import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  FormControlLabel,
  IconButton,
  Switch,
  Tab,
  Tabs,
  TextField,
  type Theme,
  Tooltip,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';

import { CombinedGraphQLErrors } from '@apollo/client/errors';
import { useApolloClient, useLazyQuery, useMutation } from '@apollo/client/react';
import { ArrowCounterclockwise, BoxArrowUpRight } from 'react-bootstrap-icons';

import type {
  EditorNodeFieldsFragment,
  NodeTranslationQuery,
  NodeTranslationQueryVariables,
  UpdateNodeInput,
  UpdateNodeMutation,
  UpdateNodeMutationVariables,
} from '@/common/__generated__/graphql';
import { useInstance } from '@/common/instance';
import { NodeLink } from '@/common/links';
import RichTextField from './RichTextField';
import { getNativeLanguageName } from './languageLabel';
import { type EditableNodeField, type MockNodeEdit, setMockNodeFieldEdit } from './mockEdits';
import { getNodeGroup } from './nodeHelpers';
import {
  NODE_TRANSLATION,
  type NodeFieldOverrides,
  UPDATE_NODE,
  draftHeadTokenVar,
  patchNodeGraphOverride,
  staleVersionNotificationVar,
} from './queries';
import { useEditorApolloContext } from './useEditorApolloContext';
import { useIsEditorReadOnly } from './useIsEditorReadOnly';

const metaChipSx = {
  height: 20,
  '& .MuiChip-label': { px: 0.75, fontSize: 10, color: 'text.secondary' },
};

/**
 * Tint for fields whose edits are not yet persisted to the backend (kept in
 * `mockNodeEditsVar`). Uses the theme's info palette so it's visually distinct
 * from the warning tint we reserve for actual pending/unsaved state.
 */
const MOCK_TINT_ALPHA = 0.09;
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
        {isMock ? ' (uneditable)' : ''}
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
  const client = useApolloClient();
  const editorContext = useEditorApolloContext();
  const [mutate] = useMutation<UpdateNodeMutation, UpdateNodeMutationVariables>(UPDATE_NODE);
  return useCallback(
    async (nodeId: string, input: Partial<UpdateNodeInput>) => {
      try {
        const result = await mutate({
          variables: {
            instanceId: instance.id,
            nodeId,
            input: stripNulls(input),
            version: draftHeadTokenVar(),
          },
          context: editorContext,
          // Re-fetch the token after a successful write so subsequent mutations
          // pass the new head and don't trip the stale-check.
          refetchQueries: ['EditorPublishState'],
        });
        const payload = result.data?.instanceEditor.updateNode;
        if (payload?.__typename === 'Node' || payload?.__typename === 'ActionNode') {
          // NodeGraph query uses fetchPolicy: 'no-cache', so propagate the
          // updated fields via the reactive-var overlay.
          const override: NodeFieldOverrides = {};
          if (input.name !== undefined) override.name = payload.name;
          if (input.description !== undefined) override.description = payload.description;
          if (input.color !== undefined) override.color = payload.color;
          if (input.isVisible !== undefined) override.isVisible = payload.isVisible;
          if (input.isOutcome !== undefined && payload.__typename === 'Node') {
            override.isOutcome = payload.isOutcome;
          }
          patchNodeGraphOverride(nodeId, override);
        }
        return result;
      } catch (err) {
        const isStale =
          CombinedGraphQLErrors.is(err) &&
          err.errors.some((e) => e.extensions?.code === 'stale_version');
        if (isStale) {
          staleVersionNotificationVar(true);
          // Refresh the token so the user's next edit — on a fresh page or
          // after dismissing — doesn't hit the stale-check again.
          void client.refetchQueries({ include: ['EditorPublishState'] });
        }
        throw err;
      }
    },
    [instance.id, mutate, client, editorContext]
  );
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
  if (status === 'idle') return null;
  const { text, color } =
    status === 'saving'
      ? { text: 'Saving…', color: 'text.secondary' as const }
      : status === 'saved'
        ? { text: 'Saved', color: 'success.main' as const }
        : { text: 'Save failed', color: 'error.main' as const };
  return (
    <Typography variant="caption" sx={{ fontSize: 10, color }}>
      {text}
    </Typography>
  );
}

// Local-draft text input. The component is keyed on `nodeId` at the call site,
// so React remounts it when the user navigates between nodes — initializing
// `draft` from the new server value without an effect.
function LiveTextField({ label, value, onCommit, placeholder }: LiveTextFieldProps) {
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
function MockRichTextField({
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

type MockTextFieldProps = {
  label: string;
  field: Extract<EditableNodeField, 'shortName' | 'nodeGroup'>;
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
        disabled
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
        disabled
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
              if (draft !== value) onCommit(draft);
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
          {hasColor ? draft : 'No color'}
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

function ReadOnlyTextField({ label, value }: { label: string; value: string | null | undefined }) {
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

function ReadOnlyRichTextField({
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

export type NodeContentSectionProps = {
  node: EditorNodeFieldsFragment;
  editorUserName: string;
  currentEdit: MockNodeEdit | undefined;
};

/**
 * Translatable node-content fields (name, short description, description).
 *
 * Editor reads/writes always target the instance's default-language column
 * (see useEditorApolloContext), so the default-language tab is editable.
 * Other-language tabs show the resolved translation read-only — they re-run
 * a small query with `context: { locale }` and `fetchPolicy: 'no-cache'` so
 * each switch returns fresh data without colliding on Apollo's cache key.
 */
export function NodeContentSection({ node, editorUserName, currentEdit }: NodeContentSectionProps) {
  const updateNode = useUpdateNodeMutation();
  const readOnly = useIsEditorReadOnly();
  const instance = useInstance();

  const languages = [
    instance.defaultLanguage,
    ...instance.supportedLanguages.filter((l) => l !== instance.defaultLanguage),
  ];
  const showTabs = languages.length > 1;

  const [selectedLang, setSelectedLang] = useState(instance.defaultLanguage);
  const isDefault = selectedLang === instance.defaultLanguage;

  // Apollo treats `context` as out-of-band metadata, not part of the
  // operation's identity, so changing `selectedLang` while `variables` stays
  // the same doesn't refetch on its own. Drive the fetch explicitly via
  // useLazyQuery so each tab switch fires fresh with the latest locale.
  const [fetchTranslation, { data: translationData, loading: translationLoading }] = useLazyQuery<
    NodeTranslationQuery,
    NodeTranslationQueryVariables
  >(NODE_TRANSLATION, { fetchPolicy: 'no-cache' });

  useEffect(() => {
    if (isDefault) return;
    void fetchTranslation({
      variables: { nodeId: node.id },
      context: { locale: selectedLang },
    });
  }, [fetchTranslation, isDefault, node.id, selectedLang]);

  const translated = translationData?.node ?? null;

  const langLabel = (code: string) =>
    code === instance.defaultLanguage
      ? `${code} · ${getNativeLanguageName(code)}`
      : getNativeLanguageName(code);

  const tabs = showTabs ? (
    <Tabs
      value={selectedLang}
      onChange={(_, next: string) => setSelectedLang(next)}
      variant="scrollable"
      scrollButtons="auto"
      sx={{
        minHeight: 32,
        mb: 1,
        borderBottom: '1px solid',
        borderColor: 'divider',
        '& .MuiTab-root': {
          minHeight: 32,
          minWidth: 0,
          px: 1,
          py: 0.25,
          fontSize: 11,
          textTransform: 'uppercase',
          fontWeight: 600,
          letterSpacing: 0.5,
        },
      }}
    >
      {languages.map((lang) => (
        <Tab key={lang} value={lang} label={lang} title={langLabel(lang)} />
      ))}
    </Tabs>
  ) : null;

  const editableBody = (
    <Box
      component="fieldset"
      disabled={readOnly}
      sx={{ border: 0, p: 0, m: 0, minWidth: 0, display: 'contents' }}
    >
      <LiveTextField
        key={`name:${node.id}`}
        label="Name"
        nodeId={node.id}
        value={node.name ?? ''}
        onCommit={(next) => updateNode(node.id, { name: next })}
      />

      <MockRichTextField
        label="Short description"
        field="shortDescription"
        nodeId={node.id}
        originalValue={node.shortDescription ?? null}
        currentValue={currentEdit?.shortDescription}
        editorUserName={editorUserName}
        placeholder="Brief summary"
      />

      <RichTextField
        key={`description:${node.id}`}
        label="Description"
        value={node.description ?? ''}
        onCommit={(html) => updateNode(node.id, { description: html })}
        disabled={readOnly}
      />
    </Box>
  );

  const readOnlyBody = (
    <Box sx={{ display: 'contents' }}>
      <Alert severity="info" sx={{ fontSize: 12, py: 0.5, '& .MuiAlert-message': { py: 0.25 } }}>
        Content translations are not currently editable in model editor
      </Alert>
      {translationLoading ? (
        <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>Loading translation…</Typography>
      ) : (
        <>
          <ReadOnlyTextField label="Name" value={translated?.name} />
          <ReadOnlyRichTextField label="Short description" value={translated?.shortDescription} />
          <ReadOnlyRichTextField label="Description" value={translated?.description} />
        </>
      )}
    </Box>
  );

  const body = (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      {tabs}
      {isDefault ? editableBody : readOnlyBody}
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
    </Box>
  );

  if (!readOnly || !isDefault) return body;
  return (
    <Tooltip
      title="Read-only: you're viewing the published revision. Switch to Draft mode to edit."
      placement="left"
      arrow
      followCursor
    >
      {body}
    </Tooltip>
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
  const readOnly = useIsEditorReadOnly();

  const originalIsOutcome = node.__typename === 'Node' ? (node.isOutcome ?? false) : false;
  const supportsOutcome = node.__typename === 'Node';
  const isActionNode = node.__typename === 'ActionNode';
  const originalActionGroupId = node.__typename === 'ActionNode' ? (node.group?.id ?? null) : null;

  // `fieldset disabled` propagates disabled state to every native form control
  // inside, so MUI TextField / Switch / Autocomplete / color input all go
  // read-only without per-component plumbing.
  const body = (
    <Box
      component="fieldset"
      disabled={readOnly}
      sx={{
        border: 0,
        p: 0,
        m: 0,
        minWidth: 0,
        display: 'contents',
      }}
    >
      <MockTextField
        label="Short name"
        field="shortName"
        nodeId={node.id}
        originalValue={node.shortName ?? null}
        currentValue={currentEdit?.shortName}
        editorUserName={editorUserName}
        placeholder="Abbreviated label"
      />

      <LiveColorField
        key={`color:${node.id}`}
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
    </Box>
  );

  if (!readOnly) return body;
  return (
    <Tooltip
      title="Read-only: you're viewing the published revision. Switch to Draft mode to edit."
      placement="left"
      arrow
      followCursor
    >
      {body}
    </Tooltip>
  );
}
