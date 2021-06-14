import { useState } from 'react';
import { useTranslation } from 'next-i18next';
import { gql, useQuery, useReactiveVar } from '@apollo/client';
import { Dropdown, DropdownToggle, DropdownMenu, DropdownItem, Spinner } from 'reactstrap';

const GET_SCENARIOS = gql` 
  query GetScenarios {
    scenarios {
      id
      name
      isActive
      isDefault
    }
  }
`;

const ScenarioSelector = () => {
  const { t } = useTranslation();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const toggle = () => setDropdownOpen((prevState) => !prevState);

  const { loading, error, data } = useQuery(GET_SCENARIOS);

  if (loading) {
    return <Spinner className="m-5" style={{ width: '3rem', height: '3rem' }} />;
  }
  if (error) {
    return <div>{error}</div>;
  }

  const scenarios = data?.scenarios;

  const activeScenario = scenarios?.find((scenario) => scenario.isActive)
    || scenarios?.find((scenario) => scenario.isDefault);
  const displayScenario = `${t('scenario')}: ${activeScenario.name.length > 15
    ? `${activeScenario.name.substring(0, 15)}&hellip;` : activeScenario.name}`;

  return (
    <Dropdown isOpen={dropdownOpen} toggle={toggle}>
      <DropdownToggle caret color="light">
        <span dangerouslySetInnerHTML={{ __html: displayScenario }} />
      </DropdownToggle>
      <DropdownMenu>
        <DropdownItem header>{ t('change-scenario') }</DropdownItem>
        { scenarios?.map((scenario) => (
          <DropdownItem key={scenario.id} active={scenario.isActive}>{ scenario.name }</DropdownItem>
        ))}
      </DropdownMenu>
    </Dropdown>
  );
};

export default ScenarioSelector;
