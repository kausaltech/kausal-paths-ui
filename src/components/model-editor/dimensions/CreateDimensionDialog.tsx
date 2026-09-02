import { useState } from 'react';

import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
  Typography,
} from '@mui/material';

import { useMutation, useQuery } from '@apollo/client/react';
import { useTranslations } from 'next-intl';
import { X } from 'react-bootstrap-icons';

import { useInstance } from '@/common/instance';
import { normalizeLabel } from '../datasets/import/matching';
import { CREATE_DIMENSION, GET_INSTANCE_DIMENSIONS } from './queries';

/** Slugify a dimension name into an identifier (ASCII, lowercase, underscores). */
function deriveIdentifier(name: string): string {
  return normalizeLabel(name)
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}

/**
 * Sanitize a hand-typed identifier. Gentler than deriveIdentifier so typing
 * underscores works (normalizeLabel would strip them).
 */
function sanitizeIdentifier(s: string): string {
  return s
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}

type Props = {
  open: boolean;
  onClose: () => void;
  /** Called with the new dimension's id after a successful create. */
  onCreated: (dimensionId: string) => void;
};

export function CreateDimensionDialog({ open, onClose, onCreated }: Props) {
  const t = useTranslations('model-editor');
  const instance = useInstance();
  const [createDimension, { loading }] = useMutation(CREATE_DIMENSION);
  // For the duplicate-identifier pre-check; the list page has usually already
  // populated the cache. The backend still enforces uniqueness on submit.
  const { data: dimensionsData } = useQuery(GET_INSTANCE_DIMENSIONS, {
    skip: !open,
    fetchPolicy: 'cache-first',
  });
  const existingIdentifiers = new Set(
    (dimensionsData?.instance.editor?.dimensions ?? []).map((d) => d.identifier)
  );
  const [name, setName] = useState('');
  // The identifier follows the name until the user edits it by hand.
  const [identifier, setIdentifier] = useState('');
  const [identifierTouched, setIdentifierTouched] = useState(false);
  const [errorMessages, setErrorMessages] = useState<string[]>([]);

  // Reset on each open so stale state from a previous open doesn't leak.
  // Adjust-state-during-render pattern (React docs) — avoids the cascading
  // re-render an effect would cause.
  const [prevOpen, setPrevOpen] = useState(open);
  if (prevOpen !== open) {
    setPrevOpen(open);
    if (open) {
      setName('');
      setIdentifier('');
      setIdentifierTouched(false);
      setErrorMessages([]);
    }
  }

  const trimmedName = name.trim();
  const identifierTaken = identifier !== '' && existingIdentifiers.has(identifier);
  const canConfirm = trimmedName !== '' && identifier !== '' && !identifierTaken && !loading;

  const handleConfirm = async () => {
    if (!canConfirm) return;
    setErrorMessages([]);
    try {
      const result = await createDimension({
        variables: {
          instanceId: instance.id,
          input: {
            name: trimmedName,
            identifier,
            id: null,
            categories: [],
          },
        },
        // The list query's observer doesn't re-render from cache writes alone
        // here; refetch it so the new dimension shows up in the list.
        refetchQueries: [GET_INSTANCE_DIMENSIONS],
      });
      const payload = result.data?.instanceEditor.createDimension;
      if (payload?.__typename === 'InstanceDimension') {
        onCreated(payload.id);
        onClose();
      } else if (payload?.__typename === 'OperationInfo') {
        setErrorMessages(payload.messages.map((m) => m.message));
      } else {
        setErrorMessages([t('common-failed')]);
      }
    } catch (err) {
      setErrorMessages([err instanceof Error ? err.message : t('common-failed')]);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      onKeyDown={(e) => {
        if (e.key === 'Enter' && canConfirm) {
          e.preventDefault();
          void handleConfirm();
        }
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          px: 2,
          py: 1.5,
        }}
      >
        <DialogTitle sx={{ fontWeight: 'bold', fontSize: '1.2rem', p: 0 }}>
          {t('dimensions-new-dimension')}
        </DialogTitle>
        <IconButton onClick={onClose} size="small" disabled={loading}>
          <X />
        </IconButton>
      </Box>

      <DialogContent sx={{ pt: 1, pb: 2 }}>
        <Typography sx={{ fontWeight: 'bold', mb: 0.5 }}>{t('dimensions-name')}</Typography>
        <TextField
          fullWidth
          autoFocus
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (!identifierTouched) setIdentifier(deriveIdentifier(e.target.value));
          }}
          disabled={loading}
        />
        <Typography sx={{ fontWeight: 'bold', mt: 2, mb: 0.5 }}>
          {t('dimensions-identifier')}
        </Typography>
        <TextField
          fullWidth
          value={identifier}
          onChange={(e) => {
            setIdentifierTouched(true);
            setIdentifier(sanitizeIdentifier(e.target.value));
          }}
          error={identifierTaken}
          helperText={
            identifierTaken
              ? t('dimensions-identifier-taken')
              : t('dimensions-create-identifier-helper')
          }
          disabled={loading}
          slotProps={{ input: { sx: { fontFamily: 'monospace' } } }}
        />
        {errorMessages.map((msg, i) => (
          <Typography key={i} color="error" sx={{ mt: 1, fontSize: '0.9rem' }}>
            {msg}
          </Typography>
        ))}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading}>
          {t('common-cancel')}
        </Button>
        <Button onClick={() => void handleConfirm()} variant="contained" disabled={!canConfirm}>
          {loading ? t('common-creating') : t('common-create')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
