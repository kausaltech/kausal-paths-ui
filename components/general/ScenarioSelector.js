import { useState } from 'react';
import { useTranslation } from 'next-i18next';
import { gql, useQuery, useMutation, useReactiveVar } from '@apollo/client';
import { Dropdown, DropdownToggle, DropdownMenu, DropdownItem, Spinner } from 'reactstrap';
import { activeScenarioVar } from 'common/cache';
import { GET_HOME_PAGE } from 'common/queries/getHomePage';
import { GET_ACTION_LIST } from 'common/queries/getActionList';
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
      <Dropdown>
        <DropdownToggle caret color="light">
          Loading
        </DropdownToggle>
      </Dropdown>
    );
  }
  if (error) {
    return <div>{error}</div>;
  }

  const scenarios = data?.scenarios;
  const activeScenario = scenarios.find((scen) => scen.isActive);
  const displayScenario = `${t('scenario')}: ${activeScenario.name.length > 20
    ? `${activeScenario.name.substring(0, 20)}&hellip;` : activeScenario.name}`;

  return (
    <Dropdown isOpen={dropdownOpen} toggle={toggle}>
      <DropdownToggle caret color="light">
        { mutationLoading
          ? <span>{ `${t('scenario')}: ${t('loading')}` }</span>
          : <span dangerouslySetInnerHTML={{ __html: displayScenario }} /> }
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
    </Dropdown>
  );
};

export default ScenarioSelector;
