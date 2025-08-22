import { Fragment, useEffect, useState } from 'react';

import { useReactiveVar } from '@apollo/client';
import styled from '@emotion/styled';
import {
  Box,
  Divider,
  IconButton,
  Slide,
  Snackbar,
  type SnackbarCloseReason,
  Typography,
} from '@mui/material';
import { useTranslation } from 'next-i18next';
import { X, XLg } from 'react-bootstrap-icons';

import { activeScenarioVar } from '@/common/cache';
import ScenarioSelector from '@/components/scenario/ScenarioSelector';
import { useSiteWithSetter } from '@/context/site';

import ActionsChooser from './ActionsChooser';
import GlobalParameters from './GlobalParameters';

const DrawerHeader = styled.div`
  display: flex;
  align-items: center;
  padding: ${({ theme }) => theme.spaces.s050};
  justify-content: space-between;
`;

const ScenarioEditor = ({ handleDrawerClose }: { handleDrawerClose: () => void }) => {
  const [site] = useSiteWithSetter();
  const { t } = useTranslation();
  const activeScenario = useReactiveVar(activeScenarioVar);
  const [showCustomScenarioSnackbar, setShowCustomScenarioSnackbar] = useState(false);
  const [suppressSnackbar, setSuppressSnackbar] = useState(true);

  useEffect(() => {
    if (!activeScenario.isUserSelected && !suppressSnackbar) {
      setShowCustomScenarioSnackbar(true);
      // We only want to show the snackbar once per scenario change
      setSuppressSnackbar(true);
    } else if (activeScenario.isUserSelected) {
      // It's ok to show the snackbar again if the user has selected a scenario
      setSuppressSnackbar(false);
    }
  }, [activeScenario.isUserSelected, suppressSnackbar]);

  const handleSnackClose = (event: React.SyntheticEvent | Event, reason?: SnackbarCloseReason) => {
    if (reason === 'clickaway') {
      return;
    }
    setShowCustomScenarioSnackbar(false);
  };

  const hasGlobalParameters = site.parameters.length > 0;
  return (
    <Fragment>
      <DrawerHeader>
        <Typography variant="h4" component="h2" sx={{ m: 1, lineHeight: 1 }}>
          {t('edit-scenario')}
        </Typography>
        <IconButton onClick={handleDrawerClose} size="small">
          <XLg />
        </IconButton>
      </DrawerHeader>
      <Box sx={{ p: 1 }}>
        <Box sx={{ mb: 2 }}>
          <ScenarioSelector />
        </Box>
        <Box sx={{ mb: 3 }}>
          <ActionsChooser />
          {hasGlobalParameters && (
            <Box sx={{ mb: 3 }}>
              <Divider />
              <GlobalParameters />
            </Box>
          )}
        </Box>
      </Box>
      <Snackbar
        open={showCustomScenarioSnackbar}
        message="Custom scenario is automatically selected when you edit the scenario."
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        autoHideDuration={5000}
        onClose={handleSnackClose}
        slots={{ transition: Slide }}
        action={
          <IconButton size="small" aria-label="close" color="inherit" onClick={handleSnackClose}>
            <X size={16} />
          </IconButton>
        }
        sx={{ boxShadow: 3 }}
      />
    </Fragment>
  );
};

export default ScenarioEditor;
