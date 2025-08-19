import { Fragment } from 'react';

import styled from '@emotion/styled';
import { Box, Divider, IconButton, Typography } from '@mui/material';
import { useTranslation } from 'next-i18next';
import { XLg } from 'react-bootstrap-icons';

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
    </Fragment>
  );
};

export default ScenarioEditor;
