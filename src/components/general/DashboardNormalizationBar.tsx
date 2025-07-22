import { useEffect, useState } from 'react';

import { gql, useMutation, useQuery } from '@apollo/client';
import { Fade } from '@mui/material';
import { useTranslation } from 'react-i18next';

import { SettingsToggleBar } from '@common/components/SettingsToggleBar';

import type {
  GetParametersQuery,
  SetNormalizationMutation,
  SetNormalizationMutationVariables,
} from '@/common/__generated__/graphql';
import { GET_PARAMETERS } from '@/queries/getParameters';

const SET_NORMALIZATION_MUTATION = gql`
  mutation SetNormalizationFromWidget($id: ID) {
    setNormalizer(id: $id) {
      ok
    }
  }
`;

/**
 * Similar to NormalizationWidget, but based on the new custom dashboard page designs and using the common SettingsToggleBar component.
 *
 * TODO: Handle errors
 */
function DashboardNormalizationBar() {
  const { t } = useTranslation();

  const { loading, error, data, previousData } = useQuery<GetParametersQuery>(GET_PARAMETERS, {
    notifyOnNetworkStatusChange: true,
  });

  const normalization = data?.availableNormalizations[0];

  // Store normalization separately to optimistically update the UI on switch press
  const [normalizationActive, setNormalizationActive] = useState(normalization?.isActive ?? false);

  const [setNormalization, { loading: mutationLoading, error: mutationError }] = useMutation<
    SetNormalizationMutation,
    SetNormalizationMutationVariables
  >(SET_NORMALIZATION_MUTATION, { refetchQueries: 'active' });

  useEffect(() => {
    // Update the normalization state if it becomes out of sync with the latest data, for example if a mutation failed.
    const isActive = normalization?.isActive ?? false;

    if (isActive !== normalizationActive && !mutationLoading && !loading) {
      setNormalizationActive(isActive);
    }
  }, [normalization, normalizationActive, mutationLoading, loading]);

  if (!normalization || (loading && !previousData) || !data || !data.parameters) {
    return null;
  }

  async function handleChangeNormalization(active: boolean) {
    if (!normalization) {
      return;
    }

    setNormalizationActive(active);

    try {
      await setNormalization({ variables: { id: active ? normalization.id : null } });
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <Fade in>
      <div>
        <SettingsToggleBar
          title={t('display')}
          label={t('values-per', { normalization: normalization.label })}
          value={normalizationActive}
          onChange={(value) => void handleChangeNormalization(value)}
          isLoading={mutationLoading}
        />
      </div>
    </Fade>
  );
}

export default DashboardNormalizationBar;
