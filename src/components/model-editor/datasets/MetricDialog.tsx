import { useState } from 'react';

import {
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
  Typography,
} from '@mui/material';

import { useTranslations } from 'next-intl';
import { X } from 'react-bootstrap-icons';

import { QUANTITY_SUGGESTIONS } from '../quantities';

export type MetricFormValues = {
  label: string;
  unit: string;
  /** Quantity-kind identifier; null means the metric matches any quantity. */
  quantity: string | null;
};

type Props = {
  open: boolean;
  title: string;
  submitLabel: string;
  savingLabel: string;
  /** Prefill for editing an existing metric; omit when adding a new one. */
  initial?: MetricFormValues;
  onClose: () => void;
  /** Performs the create/update; rejects with an Error whose message is shown inline. */
  onSubmit: (values: MetricFormValues) => Promise<void>;
};

export function MetricDialog({
  open,
  title,
  submitLabel,
  savingLabel,
  initial,
  onClose,
  onSubmit,
}: Props) {
  const t = useTranslations('model-editor');
  const [label, setLabel] = useState('');
  const [unit, setUnit] = useState('');
  const [quantity, setQuantity] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Reset from `initial` on each open so stale state from a previous open
  // (or a different metric) doesn't leak. Adjust-state-during-render pattern
  // (React docs) — avoids the cascading re-render an effect would cause.
  const [prevOpen, setPrevOpen] = useState(open);
  if (prevOpen !== open) {
    setPrevOpen(open);
    if (open) {
      setLabel(initial?.label ?? '');
      setUnit(initial?.unit ?? '');
      setQuantity(initial?.quantity ?? '');
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
      await onSubmit({
        label: trimmedLabel,
        unit: unit.trim(),
        quantity: quantity.trim() || null,
      });
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
        <DialogTitle sx={{ fontWeight: 'bold', fontSize: '1.2rem', p: 0 }}>{title}</DialogTitle>
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
          <Autocomplete
            freeSolo
            options={QUANTITY_SUGGESTIONS}
            inputValue={quantity}
            onInputChange={(_, next) => setQuantity(next)}
            disabled={saving}
            renderInput={(params) => (
              <TextField
                {...params}
                label={t('nodes-port-quantity')}
                placeholder={t('nodes-port-quantity-hint')}
              />
            )}
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
          {saving ? savingLabel : submitLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
