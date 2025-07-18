import { useCallback } from 'react';

import { useReactiveVar } from '@apollo/client';
import styled from '@emotion/styled';
import { FormControl, InputLabel, MenuItem, Select, type SelectChangeEvent } from '@mui/material';
import { useTranslation } from 'next-i18next';

import { activeGoalVar } from '@/common/cache';
import type { InstanceGoal } from '@/common/instance';
import { useInstance } from '@/common/instance';

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
  .MuiSelect-select {
    padding: 8px 12px;
    font-size: 1rem;
    line-height: 1.5;
  }
`;

const StyledSublabel = styled.span`
  display: block;
  font-style: italic;
  font-size: ${({ theme }) => theme.fontSizeSm};
  line-height: ${({ theme }) => theme.lineHeightSm};
  color: ${(props) => props.theme.palette.text.secondary};
`;

const GoalSelector = () => {
  const { t } = useTranslation();
  const instance = useInstance();
  const activeGoal = useReactiveVar(activeGoalVar);

  const selectGoal = useCallback((goal: InstanceGoal) => {
    activeGoalVar(goal);
  }, []);

  const handleChange = (event: SelectChangeEvent) => {
    const selectedGoal = instance.goals.find((goal) => goal.id === event.target.value);
    if (selectedGoal) {
      selectGoal(selectedGoal);
    }
  };

  return (
    <StyledFormControl>
      <StyledInputLabel>{t('target')}</StyledInputLabel>
      <StyledSelect value={activeGoal?.id || ''} onChange={handleChange} id="goal-select">
        <MenuItem disabled value="">
          {t('change-target')}
        </MenuItem>
        {instance.goals.map((goal) => (
          <MenuItem key={goal.id} value={goal.id} disabled={goal.disabled}>
            <div>
              <span>{goal.label}</span>
              {goal.disabled && <StyledSublabel>{t('coming-soon')}</StyledSublabel>}
            </div>
          </MenuItem>
        ))}
      </StyledSelect>
    </StyledFormControl>
  );
};

export default GoalSelector;
