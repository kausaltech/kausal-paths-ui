import { gql, useMutation, useQuery } from '@apollo/client';
import styled from '@emotion/styled';
import {
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  type SelectChangeEvent,
} from '@mui/material';
import { useTranslation } from 'next-i18next';

import { startInteraction } from '@common/sentry/helpers';

import type {
  ActivateScenarioMutation,
  ActivateScenarioMutationVariables,
  GetScenariosQuery,
} from '@/common/__generated__/graphql';
import { activeScenarioVar } from '@/common/cache';
import { useInstance } from '@/common/instance';
import { GET_SCENARIOS } from '@/queries/getScenarios';

const ACTIVATE_SCENARIO = gql`
  mutation ActivateScenario($scenarioId: ID!) {
    activateScenario(id: $scenarioId) {
      ok
      activeScenario {
        id
        name
      }
    }
  }
`;
const StyledFormControl = styled(FormControl)`
  max-width: 320px;
  min-width: 200px;
`;

const StyledInputLabel = styled(InputLabel)`
  /* Position label above the input like Bootstrap */
  position: static;
  transform: none;
  color: ${(props) => props.theme.palette.text.primary};
  font-size: ${(props) => props.theme.fontSizeSm};

  /* Remove MUI's shrink behavior */
  &.MuiInputLabel-shrink {
    transform: none;
  }

  /* Override focused state */
  &.Mui-focused {
    color: ${(props) => props.theme.palette.text.primary};
  }
`;

const StyledSelect = styled(Select)`
  /* Make it look like Bootstrap form-control */

  .MuiSelect-select {
    padding: 8px 12px;
    font-size: 1rem;
    line-height: 1.5;
  }
`;

const ScenarioSelector = () => {
  const { t } = useTranslation();
  const instance = useInstance();

  const { loading, error, data } = useQuery<GetScenariosQuery>(GET_SCENARIOS, {
    fetchPolicy: 'network-only',
    notifyOnNetworkStatusChange: true,
    onCompleted: (dat) => activeScenarioVar(dat.scenarios.find((scen) => scen.isActive)),
    context: {
      componentName: 'ScenarioSelector',
    },
  });

  const [activateScenario, { loading: mutationLoading, error: mutationError }] = useMutation<
    ActivateScenarioMutation,
    ActivateScenarioMutationVariables
  >(ACTIVATE_SCENARIO, {
    refetchQueries: 'active',
  });

  if (loading || mutationLoading) {
    return (
      <StyledFormControl>
        <StyledInputLabel>{t('scenario')}</StyledInputLabel>
        <StyledSelect value={t('loading')} id="scenario-select">
          <MenuItem disabled value={t('loading')}>
            <span>
              <CircularProgress size={16} />
            </span>
          </MenuItem>
        </StyledSelect>
      </StyledFormControl>
    );
  }
  if (error || mutationError) {
    //console.log("Error", JSON.stringify(error));
    return <div>{t('error-loading-data')}</div>;
  }

  const hideBaseScenario = instance.features?.baselineVisibleInGraphs === false;
  const scenarios =
    data?.scenarios.filter(
      (scen) => scen.isSelectable && (hideBaseScenario ? scen.id !== 'baseline' : true)
    ) ?? [];
  const activeScenario = scenarios.find((scen) => scen.isActive)!;

  const handleChange = (event: SelectChangeEvent) => {
    void startInteraction(
      () => activateScenario({ variables: { scenarioId: event.target.value } }),
      {
        name: 'activateScenario',
        componentName: 'ScenarioSelector',
        attributes: { scenario_id: event.target.value },
      }
    );
  };

  return (
    <StyledFormControl>
      <StyledInputLabel>{t('scenario')}</StyledInputLabel>
      <StyledSelect value={activeScenario.id} onChange={handleChange} id="scenario-select">
        <MenuItem disabled value="">
          {t('change-scenario')}
        </MenuItem>
        {scenarios.map((scenario) => (
          <MenuItem key={scenario.id} value={scenario.id}>
            {scenario.name}
          </MenuItem>
        ))}
      </StyledSelect>
    </StyledFormControl>
  );
};

export default ScenarioSelector;
