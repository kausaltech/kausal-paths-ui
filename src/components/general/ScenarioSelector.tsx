import { useState } from 'react';
import { useTranslation } from 'next-i18next';
import { gql, useQuery, useMutation } from '@apollo/client';
import styled from 'styled-components';
import {
  Dropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
  Spinner,
} from 'reactstrap';
import { activeScenarioVar } from 'common/cache';
import { useInstance } from 'common/instance';
import { GET_SCENARIOS } from 'queries/getScenarios';
import {
  ActivateScenarioMutation,
  ActivateScenarioMutationVariables,
  GetScenariosQuery,
} from 'common/__generated__/graphql';

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

const StyledDropdown = styled(Dropdown)`
  max-width: 320px;

  .btn {
    width: 100%;
    text-align: left;
    white-space: nowrap;
    overflow: hidden;

    &:focus {
      box-shadow: 0 0 0 0.25rem ${(props) => props.theme.inputBtnFocusColor};
    }
  }
`;

const DropdownLabel = styled.div`
  font-size: 0.8rem;
`;

const ScenarioSelector = () => {
  const { t } = useTranslation();
  const instance = useInstance();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const toggle = () => setDropdownOpen((prevState) => !prevState);

  const { loading, error, data } = useQuery<GetScenariosQuery>(GET_SCENARIOS, {
    fetchPolicy: 'network-only',
    notifyOnNetworkStatusChange: true,
    onCompleted: (dat) =>
      activeScenarioVar(dat.scenarios.find((scen) => scen.isActive)),
  });
  const [activateScenario, { loading: mutationLoading, error: mutationError }] =
    useMutation<ActivateScenarioMutation, ActivateScenarioMutationVariables>(
      ACTIVATE_SCENARIO,
      {
        refetchQueries: 'active',
      }
    );

  if (loading) {
    return (
      <StyledDropdown>
        <DropdownLabel>{t('scenario')}</DropdownLabel>
        <DropdownToggle color="light">
          <span>
            <Spinner size="sm" color="primary" />
          </span>
        </DropdownToggle>
      </StyledDropdown>
    );
  }
  if (error) {
    //console.log("Error", JSON.stringify(error));
    return <div>{t('error-loading-data')}</div>;
  }

  const hideBaseScenario = instance.features?.baselineVisibleInGraphs === false;
  const scenarios =
    data?.scenarios.filter((scen) =>
      hideBaseScenario ? scen.id !== 'baseline' : true
    ) ?? [];
  const activeScenario = scenarios.find((scen) => scen.isActive);

  return (
    <StyledDropdown isOpen={dropdownOpen} toggle={toggle}>
      <DropdownLabel>{t('scenario')}</DropdownLabel>
      <DropdownToggle
        color={`${activeScenario.id === 'custom' ? 'secondary' : 'light'}`}
      >
        <span>{activeScenario.name}</span>
        <span>{activeScenario.id === 'custom' && <span>*</span>}</span>
      </DropdownToggle>
      <DropdownMenu>
        <DropdownItem header>{t('change-scenario')}</DropdownItem>
        {scenarios?.map((scenario) => (
          <DropdownItem
            key={scenario.id}
            active={scenario.isActive}
            onClick={() =>
              activateScenario({ variables: { scenarioId: scenario.id } })
            }
          >
            {scenario.name}
          </DropdownItem>
        ))}
      </DropdownMenu>
    </StyledDropdown>
  );
};

export default ScenarioSelector;
