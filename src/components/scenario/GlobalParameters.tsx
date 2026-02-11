import { useQuery } from '@apollo/client';
import { Box, Grid, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

import type { ParametersQuery, ParametersQueryVariables } from '@/common/__generated__/graphql';
import ContentLoader from '@/components/common/ContentLoader';
import ParameterWidget from '@/components/general/ParameterWidget';
import { GET_PARAMETERS } from '@/queries/getParameters';

const GlobalParameters = () => {
  const { loading, error, data, previousData } = useQuery<
    ParametersQuery,
    ParametersQueryVariables
  >(GET_PARAMETERS, {
    notifyOnNetworkStatusChange: true,
    context: {
      componentName: 'GlobalParameters',
    },
  });
  const { t } = useTranslation();

  //const refetching = networkStatus === NetworkStatus.refetch;

  if ((loading && !previousData) || !data || !data.parameters) {
    return (
      <>
        <ContentLoader />
      </>
    );
  }
  if (error) {
    return (
      <>
        <div>{t('error-loading-data')}</div>
      </>
    );
  }

  const { parameters } = data;

  return (
    <Box sx={{ mb: 2, mt: 2 }}>
      <Typography variant="h5" component="h2" sx={{ mb: 1 }}>
        {t('all-settings')}
      </Typography>
      <Grid container spacing={1.5} sx={{ mt: 1, ml: 0.5, mr: 0.5 }}>
        {parameters.map(
          (param) => param.isCustomizable && <ParameterWidget key={param.id} parameter={param} />
        )}
      </Grid>
    </Box>
  );
};

export default GlobalParameters;
