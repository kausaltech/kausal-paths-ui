import { Box, Typography } from '@mui/material';

import ScenarioSelector from '@/components/general/ScenarioSelector';

import ActionsChooser from './ActionsChooser';

const ScenarioEditor = () => {
  return (
    <Box sx={{ p: 1 }}>
      <ScenarioSelector />
      <Box sx={{ mt: 2 }}>
        <Typography variant="h5" component="h2">
          Actions
        </Typography>
        <ActionsChooser />
      </Box>
    </Box>
  );
};

export default ScenarioEditor;
