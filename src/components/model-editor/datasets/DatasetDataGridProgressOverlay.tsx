import { Box, LinearProgress, Typography } from '@mui/material';

import { useTranslations } from 'next-intl';

import type { AddProgress } from './AddRowsModal';

type Props = {
  saveProgress: AddProgress | null;
};

export function DatasetDataGridProgressOverlay({ saveProgress }: Props) {
  const t = useTranslations('model-editor');
  if (saveProgress === null) return null;
  const progress = saveProgress;
  const label = t('datasets-saving-progress', {
    current: saveProgress.current,
    total: saveProgress.total,
  });

  return (
    <Box
      sx={{
        position: 'absolute',
        inset: 0,
        bgcolor: 'rgba(255, 255, 255, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1,
        // Eat all pointer events so the user can't fire another delete
        // or edit cells while mutations are in flight.
        cursor: 'wait',
      }}
    >
      <Box sx={{ width: '60%', maxWidth: 360 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, textAlign: 'center' }}>
          {label}
        </Typography>
        <LinearProgress
          variant="determinate"
          value={progress.total > 0 ? (progress.current / progress.total) * 100 : 0}
        />
      </Box>
    </Box>
  );
}
