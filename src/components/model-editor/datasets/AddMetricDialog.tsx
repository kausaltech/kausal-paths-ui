import { useState } from 'react';

import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

import { useTranslations } from 'next-intl';
import { X } from 'react-bootstrap-icons';

export type AddMetricInput = {
  label: string;
  unit: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  /** Performs the create; rejects with an Error whose message is shown inline. */
  onSubmit: (input: AddMetricInput) => Promise<void>;
};

export function AddMetricDialog({ open, onClose, onSubmit }: Props) {
  const t = useTranslations('model-editor');
  const [label, setLabel] = useState('');
  const [unit, setUnit] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Reset on each open so stale state from a previous open doesn't leak.
  // Adjust-state-during-render pattern (React docs) — avoids the cascading
  // re-render an effect would cause.
  const [prevOpen, setPrevOpen] = useState(open);
  if (prevOpen !== open) {
    setPrevOpen(open);
    if (open) {
      setLabel('');
      setUnit('');
      setSaving(false);
      setErrorMessage('');
    }
  }

  const trimmedLabel = label.trim();
  const canConfirm = trimmedLabel !== '' && !saving;

  const handleConfirm = async () => {
    if (!canConfirm) return;
    setSaving(true);
    setErrorMessage('');
    try {
      await onSubmit({ label: trimmedLabel, unit: unit.trim() });
      onClose();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : t('common-failed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={saving ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      onKeyDown={(e) => {
        if (e.key === 'Enter' && canConfirm) {
          e.preventDefault();
          void handleConfirm();
        }
      }}
    >
      <Box display="flex" justifyContent="space-between" alignItems="center" px={2} py={1.5}>
        <DialogTitle sx={{ fontWeight: 'bold', fontSize: '1.2rem', p: 0 }}>
          {t('datasets-new-metric')}
        </DialogTitle>
        <IconButton onClick={onClose} size="small" disabled={saving}>
          <X />
        </IconButton>
      </Box>

      <DialogContent sx={{ pt: 1, pb: 2 }}>
        <Stack spacing={2}>
          <TextField
            label={t('datasets-label')}
            fullWidth
            autoFocus
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            disabled={saving}
          />
          <TextField
            label={t('datasets-unit')}
            fullWidth
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            disabled={saving}
          />
        </Stack>
        {errorMessage && (
          <Typography color="error" sx={{ mt: 1, fontSize: '0.9rem' }}>
            {errorMessage}
          </Typography>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={saving}>
          {t('common-cancel')}
        </Button>
        <Button onClick={() => void handleConfirm()} variant="contained" disabled={!canConfirm}>
          {saving ? t('common-adding') : t('common-add')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
