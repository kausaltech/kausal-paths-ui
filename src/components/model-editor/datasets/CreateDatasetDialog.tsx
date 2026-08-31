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
  TextField,
  Typography,
} from '@mui/material';

import { useMutation, useQuery } from '@apollo/client/react';
import { useTranslations } from 'next-intl';
import { X } from 'react-bootstrap-icons';

import type { InstanceDimensionFieldsFragment } from '@/common/__generated__/graphql';
import { useInstance } from '@/common/instance';
import { GET_INSTANCE_DIMENSIONS } from '../dimensions/queries';
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
  const { data: dimensionsData } = useQuery(GET_INSTANCE_DIMENSIONS, {
    skip: !open,
    fetchPolicy: 'cache-first',
  });
  const dimensionOptions = dimensionsData?.instance.editor?.dimensions ?? [];
  const [name, setName] = useState('');
  // Selection order becomes the dataset's dimension column order.
  const [selectedDimensions, setSelectedDimensions] = useState<InstanceDimensionFieldsFragment[]>(
    []
  );
  const [errorMessages, setErrorMessages] = useState<string[]>([]);

  // Reset on each open so stale state from a previous open doesn't leak.
  // Adjust-state-during-render pattern (React docs) — avoids the cascading
  // re-render an effect would cause.
  const [prevOpen, setPrevOpen] = useState(open);
  if (prevOpen !== open) {
    setPrevOpen(open);
    if (open) {
      setName('');
      setSelectedDimensions([]);
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
            dimensions: selectedDimensions.map((d) => d.id),
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
        // defaultPrevented: the Autocomplete consumed Enter to pick an option.
        if (e.key === 'Enter' && !e.defaultPrevented && canConfirm) {
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
          {t('datasets-new-dataset')}
        </DialogTitle>
        <IconButton onClick={onClose} size="small" disabled={loading}>
          <X />
        </IconButton>
      </Box>

      <DialogContent sx={{ pt: 1, pb: 2 }}>
        <Typography sx={{ fontWeight: 'bold', mb: 0.5 }}>{t('datasets-name')}</Typography>
        <TextField
          fullWidth
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={loading}
        />
        <Typography sx={{ fontWeight: 'bold', mt: 2, mb: 0.5 }}>
          {t('datasets-dimensions')}
        </Typography>
        <Autocomplete
          multiple
          options={dimensionOptions}
          value={selectedDimensions}
          disabled={loading}
          getOptionLabel={(d) => d.name}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          onChange={(_, next) => setSelectedDimensions(next)}
          renderInput={(params) => (
            <TextField {...params} helperText={t('datasets-create-dimensions-helper')} />
          )}
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
