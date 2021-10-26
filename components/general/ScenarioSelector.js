import { useState } from 'react';
import { useTranslation } from 'next-i18next';
import { gql, useQuery, useMutation } from '@apollo/client';
import styled from 'styled-components';
import { Dropdown, DropdownToggle, DropdownMenu, DropdownItem, Spinner } from 'reactstrap';
import { activeScenarioVar } from 'common/cache';
import { GET_SCENARIOS } from 'common/queries/getScenarios';

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
  min-width: 200px;

  .btn {
    width: 100%;
    text-align: left;
    white-space: nowrap;
    overflow: hidden;
  }
`;

const DropdownLabel = styled.div` 
  font-size: 0.8rem;
`;

const ScenarioSelector = () => {
  const { t } = useTranslation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const toggle = () => setDropdownOpen((prevState) => !prevState);
  // const activeScenario = useReactiveVar(activeScenarioVar);

  const { loading, error, data } = useQuery(GET_SCENARIOS, {
    fetchPolicy: 'network-only',
    notifyOnNetworkStatusChange: true,
    onCompleted: (dat) => activeScenarioVar(dat.scenarios.find((scen) => scen.isActive)),
  });
  const [activateScenario, { loading: mutationLoading, error: mutationError }] = useMutation(ACTIVATE_SCENARIO, {
    refetchQueries: [
      { query: GET_SCENARIOS },
    ],
  });

  if (loading) {
    return (
      <StyledDropdown>
        <DropdownLabel>{t('scenario')}</DropdownLabel>
        <DropdownToggle color="light">
          <span><Spinner size="sm" color="primary" /></span>
        </DropdownToggle>
      </StyledDropdown>
    );
  }
  if (error) {
    console.log("Error", JSON.stringify(error));
    return <div>{t('error-loading-data')}</div>;
  }

  const scenarios = data?.scenarios;
  const activeScenario = scenarios.find((scen) => scen.isActive);

  return (
    <StyledDropdown isOpen={dropdownOpen} toggle={toggle}>
      <DropdownLabel>{t('scenario')}</DropdownLabel>
      <DropdownToggle color={`${activeScenario.id === 'custom' ? 'secondary' : 'light'}`}>
        {activeScenario.name}
        {activeScenario.id === 'custom' && '*'}
      </DropdownToggle>
      <DropdownMenu>
        <DropdownItem header>{ t('change-scenario') }</DropdownItem>
        { scenarios?.map((scenario) => (
          <DropdownItem
            key={scenario.id}
            active={scenario.isActive}
            onClick={() => activateScenario({ variables: { scenarioId: scenario.id } })}
          >
            { scenario.name }
          </DropdownItem>
        ))}
      </DropdownMenu>
    </StyledDropdown>
  );
};

export default ScenarioSelector;
