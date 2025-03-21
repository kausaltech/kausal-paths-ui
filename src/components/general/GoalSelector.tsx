import { useCallback, useState } from 'react';

import { useReactiveVar } from '@apollo/client';
import { useTranslation } from 'next-i18next';
import { Dropdown, DropdownItem, DropdownMenu, DropdownToggle } from 'reactstrap';
import styled from 'styled-components';

import { activeGoalVar } from '@/common/cache';
import { InstanceGoal, useInstance } from '@/common/instance';

const StyledDropdown = styled(Dropdown)`
  //min-width: 200px;

  .btn {
    width: 100%;
    text-align: left;
    white-space: nowrap;
    overflow: hidden;
    font-size: 0.9rem;
    padding: ${({ theme }) => theme.spaces.s050};

    &:focus {
      box-shadow: 0 0 0 0.25rem ${(props) => props.theme.inputBtnFocusColor};
    }
  }
`;

const StyledDropdownLabel = styled.span`
  display: block;
  position: relative;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
`;

const StyledSublabel = styled.span`
  display: block;
  font-style: italic;
  font-size: ${({ theme }) => theme.fontSizeSm};
  line-height: ${({ theme }) => theme.lineHeightSm};
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

  const selectGoal = useCallback((goal: InstanceGoal) => {
    activeGoalVar(goal);
  }, []);

  return (
    <StyledDropdown isOpen={dropdownOpen} toggle={toggle}>
      <DropdownLabel>{t('target')}</DropdownLabel>
      <DropdownToggle color="light">
        <StyledDropdownLabel>{activeGoal?.label}</StyledDropdownLabel>
      </DropdownToggle>
      <DropdownMenu>
        <DropdownItem header>{t('change-target')}</DropdownItem>
        {instance.goals.map((goal) => (
          <DropdownItem
            disabled={goal.disabled}
            key={goal.id}
            active={goal.id === activeGoal?.id}
            onClick={() => selectGoal(goal)}
          >
            <span>{goal.label}</span>
            {goal.disabled && <StyledSublabel>{t('coming-soon')}</StyledSublabel>}
          </DropdownItem>
        ))}
      </DropdownMenu>
    </StyledDropdown>
  );
};

export default GoalSelector;
