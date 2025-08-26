import { useCallback, useMemo } from 'react';

import { useReactiveVar } from '@apollo/client';
import styled from '@emotion/styled';
import { Box, InputLabel, NativeSelect } from '@mui/material';
import { useTranslation } from 'react-i18next';

import { yearRangeVar } from '@/common/cache';

const StyledFormControl = styled(Box)`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${(props) => props.theme.spacing(1)};
  border-right: 1px solid ${(props) => props.theme.graphColors.grey040};
  padding-right: ${(props) => props.theme.spacing(1)};

  label {
    font-size: 0.8rem;
  }

  .MuiInputBase-root {
    border: 0;
    font-size: 0.8rem;
  }

  select {
    padding-bottom: 3px;
  }
`;

// Get array of years in given range for easy creation of year dropdown
// Split into historical and forecast years if maxHistoricalYear is provided.
const availableYears = (minYear: number, maxYear: number, maxHistoricalYear?: number | null) => {
  const years: {
    historical?: number[] | null;
    forecast?: number[] | null;
    all: number[];
  } = {
    all: [],
  };
  years.all = Array.from({ length: maxYear - minYear + 1 }, (_, i) => minYear + i);
  if (maxHistoricalYear) {
    years.historical = years.all.filter((year) => year <= maxHistoricalYear);
    years.forecast = years.all.filter((year) => year > maxHistoricalYear);
  } else {
    years.historical = null;
    years.forecast = null;
  }
  return years;
};
interface YearRangeSelectorProps {
  minYear: number;
  maxYear: number;
  maxHistoricalYear?: number | null;
  yearsWithGoals?: number[];
}

/*
Display two dropdowns for reference and target year.
Make sure that only available years are shown in the dropdowns.
Mark the years with goals with a dot.
*/

const YearRangeSelector = (props: YearRangeSelectorProps) => {
  const { minYear, maxYear, maxHistoricalYear, yearsWithGoals } = props;

  const { t } = useTranslation();
  // State of display settings
  // Year range
  const yearRange = useReactiveVar(yearRangeVar);
  const setYearRange = useCallback((newRange: [number, number]) => {
    yearRangeVar(newRange);
  }, []);

  const availableReferenceYears = useMemo(
    () => availableYears(minYear, yearRange[1] - 1, maxHistoricalYear),
    [minYear, yearRange, maxHistoricalYear]
  );
  const availableTargetYears = useMemo(
    () => availableYears(yearRange[0] + 1, maxYear, maxHistoricalYear),
    [yearRange, maxYear, maxHistoricalYear]
  );

  const YearOption = (year: number) => {
    if (yearsWithGoals?.includes(year)) {
      return (
        <option key={year} value={year}>
          {year} {String.fromCharCode(8226)}
        </option>
      );
    }
    return (
      <option key={year} value={year}>
        {year}
      </option>
    );
  };

  return (
    <Box sx={{ display: 'flex', gap: 1 }}>
      <StyledFormControl>
        <InputLabel variant="standard" htmlFor="reference-year">
          {t('comparison-year')}
        </InputLabel>
        <NativeSelect
          defaultValue={yearRange[0]}
          onChange={(e) => setYearRange([Number(e.target.value), yearRange[1]])}
          size="small"
          inputProps={{
            name: 'reference-year',
            id: 'reference-year',
          }}
        >
          {availableReferenceYears.historical && availableReferenceYears.historical.length > 0 && (
            <optgroup label={t('table-historical')}>
              {availableReferenceYears.historical.map((year) => YearOption(year))}
            </optgroup>
          )}
          {availableReferenceYears.forecast && availableReferenceYears.forecast.length > 0 && (
            <optgroup label={t('forecast')}>
              {availableReferenceYears.forecast.map((year) => YearOption(year))}
            </optgroup>
          )}
          {!maxHistoricalYear && availableReferenceYears.all.map((year) => YearOption(year))}
        </NativeSelect>
      </StyledFormControl>
      <StyledFormControl>
        <InputLabel variant="standard" htmlFor="target-year">
          {t('target-year')}
        </InputLabel>
        <NativeSelect
          defaultValue={yearRange[1]}
          onChange={(e) => setYearRange([yearRange[0], Number(e.target.value)])}
          size="small"
          inputProps={{
            name: 'target-year',
            id: 'target-year',
          }}
        >
          {availableTargetYears.historical && availableTargetYears.historical.length > 0 && (
            <optgroup label={t('table-historical')}>
              {availableTargetYears.historical.map((year) => YearOption(year))}
            </optgroup>
          )}
          {availableTargetYears.forecast && availableTargetYears.forecast.length > 0 && (
            <optgroup label={t('forecast')}>
              {availableTargetYears.forecast.map((year) => YearOption(year))}
            </optgroup>
          )}
          {!maxHistoricalYear && availableTargetYears.all.map((year) => YearOption(year))}
        </NativeSelect>
      </StyledFormControl>
    </Box>
  );
};

export default YearRangeSelector;
