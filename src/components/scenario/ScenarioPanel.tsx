import { useReactiveVar } from '@apollo/client';
import { useTheme } from '@emotion/react';
import { Alert, Box, Button, Grid } from '@mui/material';

import { scenarioEditorDrawerOpenVar } from '@/common/cache';
import { useInstance } from '@/common/instance';
import { useSiteWithSetter } from '@/context/site';

import GoalSelector from '../general/GoalSelector';
import NormalizationWidget from '../general/NormalizationWidget';
import YearRangeSelector from '../general/YearRangeSelector';
import ScenarioSelector from './ScenarioSelector';

const ScenarioPanel = () => {
  const theme = useTheme();
  const [site] = useSiteWithSetter();
  const instance = useInstance();
  const scenarioEditorDrawerOpen = useReactiveVar(scenarioEditorDrawerOpenVar);
  const handleEditClick = () => {
    scenarioEditorDrawerOpenVar(!scenarioEditorDrawerOpen);
  };

  const minYear = site.minYear;
  const maxYear = site.maxYear;

  const availableNormalizations =
    site.availableNormalizations.length > 0 ? site.availableNormalizations : [];

  // Target
  const nrGoals = instance.goals.length;

  return (
    <Box>
      <Box sx={{ p: 1, backgroundColor: theme.graphColors.blue010 }}>
        <Grid container spacing={1}>
          <Grid>
            <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
              <ScenarioSelector />
              <Button size="small" variant="outlined" color="primary" onClick={handleEditClick}>
                Edit
              </Button>
            </Box>
          </Grid>
          {nrGoals > 1 && (
            <Grid>
              <GoalSelector />
            </Grid>
          )}

          <Grid>
            <Alert variant="outlined" severity="success">
              This is an outlined success Alert.
            </Alert>
          </Grid>
        </Grid>
      </Box>
      <Box sx={{ p: 1, backgroundColor: theme.graphColors.grey010 }}>
        <Grid container spacing={1}>
          {availableNormalizations.length > 0 && (
            <Grid>
              <NormalizationWidget availableNormalizations={availableNormalizations} />
            </Grid>
          )}
          <Grid>
            <YearRangeSelector minYear={minYear} maxYear={maxYear} />
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default ScenarioPanel;
