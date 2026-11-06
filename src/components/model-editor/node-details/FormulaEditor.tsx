import { useEffect, useState } from 'react';

import { Box, Button, TextField, Typography } from '@mui/material';

import { useTranslations } from 'next-intl';

import { FormulaRejectedError, useSetFormula } from '../useSetFormula';

const monospaceSx = {
  fontFamily: 'monospace',
  fontSize: 12,
  lineHeight: 1.4,
} as const;

function FormulaLabel() {
  const t = useTranslations('model-editor');
  return (
    <Typography variant="body2" sx={{ fontSize: 10, color: 'text.secondary', mb: 0.5 }}>
      {t('nodes-formula')}
    </Typography>
  );
}

/** The formula as plain text, for nodes the user cannot edit. */
export function ReadOnlyFormula({ formula }: { formula: string }) {
  return (
    <Box>
      <FormulaLabel />
      <Box
        component="pre"
        sx={{
          ...monospaceSx,
          m: 0,
          px: 1,
          py: 0.75,
          bgcolor: 'grey.100',
          borderRadius: 0.5,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {formula}
      </Box>
    </Box>
  );
}

type FormulaEditorProps = {
  nodeId: string;
  /** The stored formula; null when the node has none yet. */
  value: string | null;
};

type Status = 'idle' | 'checking' | 'saved';

/**
 * Text editor for a formula node's formula. Saving is explicit (button or
 * Ctrl/Cmd+Enter) rather than on blur, because the backend computes the node
 * with the new formula before accepting it, which can take a few seconds. A
 * refused formula keeps the user's text and shows the backend's reason.
 *
 * Keyed on `nodeId` at the call site, so navigating to another node starts a
 * fresh draft.
 */
export function FormulaEditor({ nodeId, value }: FormulaEditorProps) {
  const t = useTranslations('model-editor');
  const setFormula = useSetFormula();
  const stored = value ?? '';
  const [draft, setDraft] = useState(stored);
  const [baseline, setBaseline] = useState(stored);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);

  // The stored formula changed underneath us (our own save, refetched, or
  // another tab). Follow it unless the user has unsaved edits.
  if (stored !== baseline) {
    setBaseline(stored);
    if (draft === baseline) setDraft(stored);
  }

  useEffect(() => {
    if (status !== 'saved') return;
    const timer = setTimeout(() => setStatus('idle'), 1500);
    return () => clearTimeout(timer);
  }, [status]);

  const trimmed = draft.trim();
  const dirty = trimmed !== stored.trim();
  const checking = status === 'checking';
  const canSave = dirty && trimmed !== '' && !checking;

  const save = () => {
    if (!canSave) return;
    setStatus('checking');
    setError(null);
    setFormula(nodeId, trimmed).then(
      () => {
        setDraft(trimmed);
        setStatus('saved');
      },
      (err: unknown) => {
        setStatus('idle');
        setError(err instanceof FormulaRejectedError ? err.message : t('common-save-failed'));
      }
    );
  };

  const cancel = () => {
    setDraft(stored);
    setError(null);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <FormulaLabel />
        {status !== 'idle' && (
          <Typography
            variant="caption"
            sx={{ fontSize: 10, color: checking ? 'text.secondary' : 'success.main' }}
          >
            {checking ? t('nodes-formula-checking') : t('common-saved')}
          </Typography>
        )}
      </Box>
      <TextField
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value);
          if (error) setError(null);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            save();
          } else if (e.key === 'Escape' && dirty) {
            e.preventDefault();
            cancel();
          }
        }}
        multiline
        minRows={2}
        size="small"
        fullWidth
        disabled={checking}
        error={error !== null}
        placeholder={t('nodes-formula-placeholder')}
        slotProps={{
          input: { sx: monospaceSx },
          htmlInput: { spellCheck: false, 'aria-label': t('nodes-formula') },
        }}
      />
      {error && (
        <Typography
          role="alert"
          variant="body2"
          sx={{
            mt: 0.5,
            fontSize: 12,
            color: 'error.main',
            whiteSpace: 'pre-wrap',
            overflowWrap: 'anywhere',
          }}
        >
          {error}
        </Typography>
      )}
      {(dirty || checking) && (
        <Box sx={{ display: 'flex', gap: 1, mt: 0.75 }}>
          <Button size="small" variant="contained" onClick={save} disabled={!canSave}>
            {t('nodes-formula-save')}
          </Button>
          <Button size="small" onClick={cancel} disabled={checking}>
            {t('nodes-formula-cancel')}
          </Button>
        </Box>
      )}
    </Box>
  );
}
