import { Box, LinearProgress, Typography } from '@mui/material';

import type { AddProgress } from './AddRowsModal';

type Props = {
  deleteProgress: AddProgress | null;
  addYearsProgress: AddProgress | null;
};

export function DatasetDataGridProgressOverlay({ deleteProgress, addYearsProgress }: Props) {
  const overlay =
    deleteProgress !== null
      ? {
          progress: deleteProgress,
          label: `Deleting ${deleteProgress.current} of ${deleteProgress.total} data points…`,
        }
      : addYearsProgress !== null
        ? {
            progress: addYearsProgress,
            label: `Adding ${addYearsProgress.current} of ${addYearsProgress.total} year${
              addYearsProgress.total === 1 ? '' : 's'
            }…`,
          }
        : null;

  if (!overlay) return null;
  const { progress, label } = overlay;

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
