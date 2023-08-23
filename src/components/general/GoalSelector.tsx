import { useCallback, useState } from 'react';
import { useTranslation } from 'next-i18next';
import { gql, useQuery, useMutation, useReactiveVar } from '@apollo/client';
import styled from 'styled-components';
import {
  Dropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
  Spinner,
} from 'reactstrap';
import { InstanceGoal, useInstance } from 'common/instance';
import { activeGoalVar } from 'common/cache';

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
  const instance = useInstance();
  const activeGoal = useReactiveVar(activeGoalVar);

  const selectGoal = useCallback(
    (goal: InstanceGoal) => {
      activeGoalVar(goal);
    },
    [activeGoalVar]
  );

  return (
    <StyledDropdown isOpen={dropdownOpen} toggle={toggle}>
      <DropdownLabel>{t('Target')}</DropdownLabel>
      <DropdownToggle color="light">
        <span>{activeGoal?.label}</span>
      </DropdownToggle>
      <DropdownMenu>
        <DropdownItem header>{t('change-target')}</DropdownItem>
        {instance.goals.map((goal) => (
          <DropdownItem
            key={goal.id}
            active={goal.id === activeGoal?.id}
            onClick={() => selectGoal(goal)}
          >
            {goal.label}
          </DropdownItem>
        ))}
      </DropdownMenu>
    </StyledDropdown>
  );
};

export default GoalSelector;
