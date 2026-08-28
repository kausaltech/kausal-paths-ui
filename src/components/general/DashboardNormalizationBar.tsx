import { Fade } from '@mui/material';

import { useMutation, useQuery } from '@apollo/client/react';

import { SettingsToggleBar } from '@common/components/SettingsToggleBar';

import { useTranslation } from '@/common/i18n';
import { SET_NORMALIZATION_MUTATION } from '@/components/general/NormalizationWidget';
import { GET_PARAMETERS } from '@/queries/getParameters';

/**
 * Similar to NormalizationWidget, but based on the new custom dashboard page designs and using the common SettingsToggleBar component.
 *
 * TODO: Handle errors
 */
function DashboardNormalizationBar() {
  const { t } = useTranslation();

  const { loading, data, previousData } = useQuery(GET_PARAMETERS, {
    notifyOnNetworkStatusChange: true,
  });

  const normalization = data?.availableNormalizations[0];

  // Todo handle mutation error
  const [setNormalization, { loading: mutationLoading }] = useMutation(SET_NORMALIZATION_MUTATION, {
    refetchQueries: 'active',
  });

  if (!normalization || (loading && !previousData) || !data || !data.parameters) {
    return null;
  }

  async function handleChangeNormalization(active: boolean) {
    if (!normalization) {
      return;
    }

    try {
      await setNormalization({
        variables: { id: active ? normalization.id : null },
        optimisticResponse: {
          __typename: 'Mutation',
          setNormalizer: { __typename: 'SetNormalizerMutation', ok: true },
        },
        update(cache, { data: mutationData }) {
          if (!mutationData?.setNormalizer.ok) return;
          const normalizationCacheId = cache.identify(normalization);
          if (!normalizationCacheId) return;
          cache.modify({
            id: normalizationCacheId,
            fields: {
              isActive: () => active,
            },
          });
        },
      });
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
          value={normalization.isActive}
          onChange={(value) => void handleChangeNormalization(value)}
          isLoading={mutationLoading}
        />
      </div>
    </Fade>
  );
}

export default DashboardNormalizationBar;
