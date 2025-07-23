import { NetworkStatus, useQuery } from '@apollo/client';
import styled from '@emotion/styled';
import { Grid } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Row } from 'reactstrap';

import type {
  GetParametersQuery,
  GetParametersQueryVariables,
} from '@/common/__generated__/graphql';
import ContentLoader from '@/components/common/ContentLoader';
import ParameterWidget from '@/components/general/ParameterWidget';
import { GET_PARAMETERS } from '@/queries/getParameters';

const GlobalParametersPanel = styled(Row)`
  .form-group {
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
  }
  label {
    font-size: ${(props) => props.theme.fontSizeSm};
    line-height: 1;
    overflow-wrap: break-word;
    max-width: 100%;
  }
`;

const GlobalParameters = () => {
  const { loading, error, data, previousData, refetch, networkStatus } = useQuery<
    GetParametersQuery,
    GetParametersQueryVariables
  >(GET_PARAMETERS, {
    notifyOnNetworkStatusChange: true,
    context: {
      componentName: 'GlobalParameters',
    },
  });
  const { t } = useTranslation();

  const refetching = networkStatus === NetworkStatus.refetch;

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
    <GlobalParametersPanel>
      <Grid container spacing={1}>
        {parameters.map(
          (param) => param.isCustomizable && <ParameterWidget key={param.id} parameter={param} />
        )}
      </Grid>
    </GlobalParametersPanel>
  );
};

export default GlobalParameters;
