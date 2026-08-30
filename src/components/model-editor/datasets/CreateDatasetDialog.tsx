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

import { useMutation } from '@apollo/client/react';
import { useTranslations } from 'next-intl';
import { X } from 'react-bootstrap-icons';

import { useInstance } from '@/common/instance';
import { CREATE_DATASET, GET_INSTANCE_DATASETS } from './queries';

type Props = {
  open: boolean;
  onClose: () => void;
  /** Called with the new dataset's id after a successful create. */
  onCreated: (datasetId: string) => void;
};

export function CreateDatasetDialog({ open, onClose, onCreated }: Props) {
  const t = useTranslations('model-editor');
  const instance = useInstance();
  const [createDataset, { loading }] = useMutation(CREATE_DATASET);
  const [name, setName] = useState('');
  const [errorMessages, setErrorMessages] = useState<string[]>([]);

  // Reset on each open so stale state from a previous open doesn't leak.
  // Adjust-state-during-render pattern (React docs) — avoids the cascading
  // re-render an effect would cause.
  const [prevOpen, setPrevOpen] = useState(open);
  if (prevOpen !== open) {
    setPrevOpen(open);
    if (open) {
      setName('');
      setErrorMessages([]);
    }
  }

  const trimmedName = name.trim();
  const canConfirm = trimmedName !== '' && !loading;

  const handleConfirm = async () => {
    if (!canConfirm) return;
    setErrorMessages([]);
    try {
      const result = await createDataset({
        variables: {
          instanceId: instance.id,
          input: {
            name: trimmedName,
            // Start with a single bare metric; label, unit and quantity can be
            // refined in the dataset editor.
            metrics: [
              { id: null, label: t('datasets-default-metric-label'), unit: '', quantity: null },
            ],
            dimensions: [],
            identifier: null,
            id: null,
          },
        },
        // The list query's observer doesn't re-render from cache writes alone
        // here; refetch it so the new dataset shows up when navigating back.
        refetchQueries: [GET_INSTANCE_DATASETS],
      });
      const payload = result.data?.instanceEditor.createDataset;
      if (payload?.__typename === 'Dataset') {
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
      <Box display="flex" justifyContent="space-between" alignItems="center" px={2} py={1.5}>
        <DialogTitle sx={{ fontWeight: 'bold', fontSize: '1.2rem', p: 0 }}>
          {t('datasets-new-dataset')}
        </DialogTitle>
        <IconButton onClick={onClose} size="small" disabled={loading}>
          <X />
        </IconButton>
      </Box>

      <DialogContent sx={{ pt: 1, pb: 2 }}>
        <Typography fontWeight="bold" sx={{ mb: 0.5 }}>
          {t('datasets-name')}
        </Typography>
        <TextField
          fullWidth
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={loading}
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
