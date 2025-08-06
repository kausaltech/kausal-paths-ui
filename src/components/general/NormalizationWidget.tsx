import { NetworkStatus, gql, useMutation, useQuery } from '@apollo/client';
import styled from '@emotion/styled';
import { CircularProgress, FormControlLabel, Switch } from '@mui/material';
import { useTranslation } from 'react-i18next';

import { startInteraction } from '@common/sentry/helpers';

import type {
  GetParametersQuery,
  SetNormalizationMutation,
  SetNormalizationMutationVariables,
} from '@/common/__generated__/graphql';
import { GET_PARAMETERS } from '@/queries/getParameters';

const SwitchWrapper = styled.div`
  max-width: 160px;
  .form-label {
    margin-bottom: 0;
    line-height: 1;
    font-size: 0.8rem;
  }
`;

export const SET_NORMALIZATION_MUTATION = gql`
  mutation SetNormalizationFromWidget($id: ID) {
    setNormalizer(id: $id) {
      ok
    }
  }
`;

function NormalizationWidget() {
  const { t } = useTranslation();

  const { loading, error, data, previousData, networkStatus } = useQuery<GetParametersQuery>(
    GET_PARAMETERS,
    {
      notifyOnNetworkStatusChange: true,
    }
  );

  const [setNormalization, { loading: mutationLoading }] = useMutation<
    SetNormalizationMutation,
    SetNormalizationMutationVariables
  >(SET_NORMALIZATION_MUTATION, {
    refetchQueries: 'active',
  });

  if ((loading && !previousData) || !data || !data.parameters) {
    return <CircularProgress size={10} sx={{ ml: 0.5, mb: -0.1 }} />;
  }
  if (error) {
    return (
      <>
        <div>{t('error-loading-data')}</div>
      </>
    );
  }

  const { availableNormalizations } = data;
  if (!availableNormalizations.length) return null;

  // Assume there is only one normalization
  const norm = availableNormalizations[0];
  const label = t('normalize-by', { node: norm.label });
  return (
    <SwitchWrapper>
      <FormControlLabel
        control={
          <Switch
            onChange={(_e) =>
              void startInteraction(
                () =>
                  setNormalization({
                    variables: {
                      id: norm.isActive ? null : norm.id,
                    },
                  }),
                {
                  name: 'setNormalization',
                  componentName: 'NormalizationWidget',
                  attributes: { normalization_id: norm.id },
                }
              )
            }
            disabled={mutationLoading || networkStatus === NetworkStatus.refetch}
            checked={norm.isActive}
            size="small"
          />
        }
        label={label}
        sx={{
          m: 0,
          p: 0,
        }}
        slotProps={{
          typography: {
            variant: 'caption',
          },
        }}
      />
    </SwitchWrapper>
  );
}

export default NormalizationWidget;
