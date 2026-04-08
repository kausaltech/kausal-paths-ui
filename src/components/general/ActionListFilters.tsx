import styled from '@emotion/styled';
import {
  Box,
  FormControl,
  FormLabel,
  Grid,
  MenuItem,
  Select,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import { useTranslations } from 'next-intl';

import Icon from '@/components/common/icon';
import type { SortActionsBy } from '@/types/actions.types';

const SettingsForm = styled.form`
  display: block;
  margin: 1.5rem 0;
  padding: 0.5rem 0;
  border-top: 1px solid ${(props) => props.theme.neutralLight};
  border-bottom: 1px solid ${(props) => props.theme.neutralLight};
`;

const StyledFormControl = styled(FormControl)`
  width: 100%;
`;

const StyledFormLabel = styled(FormLabel)`
  color: inherit;
  margin-bottom: 0.25rem;

  &.Mui-focused,
  &.Mui-disabled,
  &.Mui-error,
  &.MuiFormLabel-colorPrimary,
  &.MuiFormLabel-colorSecondary {
    color: inherit;
  }
`;

const StyledSelect = styled(Select)<{ $custom?: boolean }>`
  .MuiSelect-select {
    padding: 0.5rem 0.75rem;
    font-size: 1rem;
    line-height: 1.5;
    background-color: ${(props) => props.theme.inputBg};
  }
`;

const SortButtons = styled(ToggleButtonGroup)`
  button {
    padding-top: 0.4rem;
    padding-bottom: 0.4rem;

    &.Mui-selected {
      background-color: ${(props) => props.theme.themeColors.white};
      svg {
        fill: ${(props) => props.theme.themeColors.black};
      }
    }

    &.Mui-selected:hover {
      background-color: ${(props) => props.theme.graphColors.grey010};
    }

    &:hover {
      background-color: ${(props) => props.theme.graphColors.grey080};
    }

    svg {
      fill: ${(props) => props.theme.themeColors.white};
    }
  }

  .icon {
    vertical-align: middle;
  }
`;

type ActionListFiltersProps = {
  hasEfficiency: boolean;
  data: {
    impactOverviews: { label: string }[];
  };
  activeEfficiency: number;
  setActiveEfficiency: (value: number) => void;
  actionGroups: { id: string; name: string }[];
  actionGroup: string;
  setActionGroup: (value: string) => void;
  sortBy: { key: SortActionsBy; label: string };
  sortOptions: { key: SortActionsBy; label: string; isHidden?: boolean }[];
  handleChangeSort: (value: SortActionsBy) => void;
  ascending: boolean;
  handleSortDirectionChange: (event: React.MouseEvent<HTMLElement>, value: 'asc' | 'desc') => void;
};

const ActionListFilters = (props: ActionListFiltersProps) => {
  const {
    hasEfficiency,
    data,
    activeEfficiency,
    setActiveEfficiency,
    actionGroups,
    actionGroup,
    setActionGroup,
    sortBy,
    sortOptions,
    handleChangeSort,
    ascending,
    handleSortDirectionChange,
  } = props;

  const t = useTranslations('common');
  return (
    <SettingsForm className="text-light mt-4">
      <Grid container spacing={2}>
        {hasEfficiency && (
          <Grid size={{ md: 4 }} sx={{ display: 'flex' }}>
            <StyledFormControl>
              <StyledFormLabel id="impact-label" htmlFor="impact">
                {t('actions-impact-on')}
              </StyledFormLabel>
              <StyledSelect
                id="impact"
                labelId="impact-label"
                value={activeEfficiency}
                onChange={(e) => setActiveEfficiency(Number(e.target.value))}
                size="small"
                MenuProps={{ disablePortal: true }}
              >
                {data.impactOverviews.map((impactGroup, indx) => (
                  <MenuItem value={indx} key={indx}>
                    {impactGroup.label}
                  </MenuItem>
                ))}
              </StyledSelect>
            </StyledFormControl>
          </Grid>
        )}

        {actionGroups.length > 1 && (
          <Grid size={{ md: 4 }} sx={{ display: 'flex' }}>
            <StyledFormControl>
              <StyledFormLabel id="type-label" htmlFor="type">
                {t('actions-group-type')}
              </StyledFormLabel>
              <StyledSelect
                id="type"
                labelId="type-label"
                value={actionGroup}
                onChange={(e) => setActionGroup(e.target.value as string)}
                size="small"
                MenuProps={{ container: () => document.getElementById('main')! }}
              >
                <MenuItem value="ALL_ACTIONS">{t('action-groups-all')}</MenuItem>
                {actionGroups.map((group) => (
                  <MenuItem value={group.id} key={group.id}>
                    {group.name}
                  </MenuItem>
                ))}
              </StyledSelect>
            </StyledFormControl>
          </Grid>
        )}

        <Grid size={{ md: 4 }} sx={{ display: 'flex' }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-end', mr: 1.5 }}>
            <StyledFormControl>
              <StyledFormLabel id="sort-label" htmlFor="sort">
                {t('actions-sort-by')}
              </StyledFormLabel>
              <StyledSelect
                id="sort"
                labelId="sort-label"
                value={sortBy.key}
                onChange={(e) => handleChangeSort(e.target.value as SortActionsBy)}
                size="small"
                MenuProps={{ container: () => document.getElementById('main')! }}
              >
                {sortOptions
                  .filter((opt) => !opt.isHidden)
                  .map((opt) => (
                    <MenuItem key={opt.key} value={opt.key}>
                      {opt.label}
                    </MenuItem>
                  ))}
              </StyledSelect>
            </StyledFormControl>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'flex-end' }}>
            <StyledFormControl>
              <StyledFormLabel>{t('sort-direction')}</StyledFormLabel>
              <SortButtons
                value={ascending ? 'asc' : 'desc'}
                exclusive
                onChange={handleSortDirectionChange}
                aria-label={t('sort-direction')}
              >
                <ToggleButton value="asc" aria-label={t('sort-ascending')}>
                  <Icon name="arrowUpWideShort" width="1.5rem" height="1.5rem" />
                </ToggleButton>
                <ToggleButton value="desc" aria-label={t('sort-descending')}>
                  <Icon name="arrowDownShortWide" width="1.5rem" height="1.5rem" />
                </ToggleButton>
              </SortButtons>
            </StyledFormControl>
          </Box>
        </Grid>
      </Grid>
    </SettingsForm>
  );
};

export default ActionListFilters;
