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
      <ScenarioSelector />
      <Box sx={{ mt: 2 }}>
        <Typography variant="h5" component="h2">
          Actions
        </Typography>
        <ActionsChooser />
        {hasGlobalParameters && (
          <>
            <h5>Global settings</h5>
            <GlobalParameters />
          </>
        )}
      </Box>
    </Box>
  );
};

export default ScenarioEditor;
