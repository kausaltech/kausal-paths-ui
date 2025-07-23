import { useCallback } from 'react';

import { useReactiveVar } from '@apollo/client';
import { FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import { useTranslation } from 'react-i18next';

import { yearRangeVar } from '@/common/cache';

interface YearRangeSelectorProps {
  minYear: number;
  maxYear: number;
}

const YearRangeSelector = (props: YearRangeSelectorProps) => {
  const { minYear, maxYear } = props;
  // const [yearRange, setYearRange] = useState([minYear, maxYear]);
  const { t } = useTranslation();
  console.log(props);
  // State of display settings
  // Year range
  const yearRange = useReactiveVar(yearRangeVar);
  const setYearRange = useCallback((newRange: [number, number]) => {
    yearRangeVar(newRange);
  }, []);

  return (
    <div>
      <FormControl>
        <InputLabel>{t('comparing-years')}</InputLabel>
        <Select
          value={yearRange[0]}
          onChange={(e) => setYearRange([e.target.value, yearRange[1]])}
          size="small"
        >
          {Array.from({ length: yearRange[1] - minYear }, (_, i) => (
            <MenuItem key={i} value={minYear + i}>
              {minYear + i}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControl>
        <InputLabel>{t('comparing-years')}</InputLabel>
        <Select
          value={yearRange[1]}
          onChange={(e) => setYearRange([yearRange[0], e.target.value])}
          size="small"
        >
          {Array.from({ length: maxYear - yearRange[0] }, (_, i) => (
            <MenuItem key={i} value={yearRange[0] + i + 1}>
              {yearRange[0] + i + 1}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </div>
  );
};

export default YearRangeSelector;
