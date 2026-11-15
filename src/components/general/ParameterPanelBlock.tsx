import { useState } from 'react';

import { Box, Button, Stack, Typography } from '@mui/material';

import { type TypedDocumentNode, gql } from '@apollo/client';
import { useApolloClient } from '@apollo/client/react';

import type {
  ParameterPanelActiveScenarioQuery,
  ParameterPanelActiveScenarioQueryVariables,
  ParameterPanelResetMutation,
  ParameterPanelResetMutationVariables,
  StreamFieldFragment,
} from '@/common/__generated__/graphql';
import { activeScenarioVar } from '@/common/cache';
import { useTranslation } from '@/common/i18n';
import ParameterWidget from '@/components/general/ParameterWidget';
import { useSite } from '@/context/site';

type ParameterPanelBlockData = Extract<StreamFieldFragment, { __typename: 'ParameterPanelBlock' }>;

const RESET_PARAMETER: TypedDocumentNode<
  ParameterPanelResetMutation,
  ParameterPanelResetMutationVariables
> = gql`
  mutation ParameterPanelReset($parameterId: ID!) {
    resetParameter(id: $parameterId) {
      ok
    }
  }
`;

const ACTIVE_SCENARIO: TypedDocumentNode<
  ParameterPanelActiveScenarioQuery,
  ParameterPanelActiveScenarioQueryVariables
> = gql`
  query ParameterPanelActiveScenario {
    activeScenario {
      id
    }
  }
`;

type Props = {
  block: ParameterPanelBlockData;
};

/**
 * A panel of parameters chosen by the page editor.
 *
 * It changes the visitor's session, as the settings panel does, so the change applies on every
 * page. Reset returns only this panel's parameters to their defaults, not the visitor's other
 * settings.
 */
export function ParameterPanelBlock({ block }: Props) {
  const { t } = useTranslation();
  const client = useApolloClient();
  const site = useSite();
  const [resetting, setResetting] = useState(false);

  // Grapple types every list as nullable with nullable items.
  const parameters = (block.parameters ?? []).filter(
    (param): param is NonNullable<typeof param> => !!param?.isCustomizable
  );
  if (!parameters.length) return null;
  const customized = parameters.filter((param) => param.isCustomized);

  const handleReset = async () => {
    setResetting(true);
    try {
      // One at a time: each reset rewrites the same session.
      for (const param of customized) {
        await client.mutate({ mutation: RESET_PARAMETER, variables: { parameterId: param.id } });
      }
      // With no customizations left the backend leaves the custom scenario; follow it.
      const { data } = await client.query({ query: ACTIVE_SCENARIO, fetchPolicy: 'network-only' });
      const active = site.scenarios.find((scen) => scen.id === data?.activeScenario.id);
      if (active) activeScenarioVar({ ...active, isUserSelected: false });
      await client.refetchQueries({ include: 'active' });
    } finally {
      setResetting(false);
    }
  };

  return (
    <Box component="section" sx={{ my: 3 }}>
      {block.title && (
        <Typography variant="h4" component="h2" sx={{ mb: 1 }}>
          {block.title}
        </Typography>
      )}
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {t('parameter-panel-applies-everywhere')}
      </Typography>
      <Stack spacing={2}>
        {parameters.map((param) => (
          <Box key={param.id}>
            <ParameterWidget parameter={param} disabled={resetting} />
            {/* The number widget uses the description as its label; the switch shows the label. */}
            {param.__typename !== 'NumberParameterType' && param.description && (
              <Typography variant="body2" sx={{ mt: -0.5 }}>
                {param.description}
              </Typography>
            )}
          </Box>
        ))}
      </Stack>
      {block.showReset && (
        <Button
          variant="outlined"
          size="small"
          sx={{ mt: 2 }}
          disabled={!customized.length || resetting}
          onClick={() => void handleReset()}
        >
          {t('reset-button')}
        </Button>
      )}
    </Box>
  );
}
