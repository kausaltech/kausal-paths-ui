import { Box, Typography } from '@mui/material';

import ScenarioSelector from '@/components/scenario/ScenarioSelector';
import { useSiteWithSetter } from '@/context/site';

import ActionsChooser from './ActionsChooser';
import GlobalParameters from './GlobalParameters';

const ScenarioEditor = () => {
  const [site] = useSiteWithSetter();
  const hasGlobalParameters = site.parameters.length > 0;
  return (
    <Box sx={{ p: 1 }}>
      <Box sx={{ mb: 2 }}>
        <ScenarioSelector />
      </Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" component="h2">
          Actions
        </Typography>
        <ActionsChooser />
        {hasGlobalParameters && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h5" component="h2">
              Global settings
            </Typography>
            <GlobalParameters />
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default ScenarioEditor;
