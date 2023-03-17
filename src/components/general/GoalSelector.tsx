import { useState } from 'react';
import { useTranslation } from 'next-i18next';
import { gql, useQuery, useMutation } from '@apollo/client';
import styled from 'styled-components';
import { Dropdown, DropdownToggle, DropdownMenu, DropdownItem, Spinner } from 'reactstrap';

const StyledDropdown = styled(Dropdown)` 
  //min-width: 200px;

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

const GoalSelector = () => {
  const { t } = useTranslation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const toggle = () => setDropdownOpen((prevState) => !prevState);

  const goals = [
    { id: '1', name: 'Total emissions' },
    { id: '2', name: 'Indirect emissions' },
    { id: '3', name: 'Direct emissions' },
  ];

  const activeGoal = goals[0];

  return (
    <StyledDropdown isOpen={dropdownOpen} toggle={toggle}>
      <DropdownLabel>{t('Target')}</DropdownLabel>
      <DropdownToggle color="light">
        <span>{activeGoal.name}</span>
      </DropdownToggle>
      <DropdownMenu>
        <DropdownItem header>{ t('change-target') }</DropdownItem>
        { goals?.map((goal) => (
          <DropdownItem
            key={goal.id}
            active={goal.id === activeGoal.id}
          >
            { goal.name }
          </DropdownItem>
        ))}
      </DropdownMenu>
    </StyledDropdown>
  );
};

export default GoalSelector;
