import { useEffect } from 'react';
import { useReactiveVar } from '@apollo/client';
import styled from 'styled-components';
import RangeSelector from 'components/general/RangeSelector';
import { yearRangeVar, settingsVar } from 'common/cache';
import ScenarioSelector from './ScenarioSelector';
import TotalEmissionsBar from './TotalEmissionsBar';

const FixedPanel = styled.div`
  display: flex;
  position: fixed;
  z-index: 255;
  left: 0;
  bottom: 0;
  width: 100%;
  padding: 1.5rem;
  background-color: ${(props) => props.theme.graphColors.grey000};
  color: ${(props) => props.theme.graphColors.grey090};
  box-shadow: 0 0 4px 4px rgba(20,20,20,0.05);
`;

const RangeSelectorWrapper = styled.div`
  flex: 0 0;
  margin-right: 2rem;
`;

const ScenarioSelectorWrapper = styled.div`
  flex: 0 0;
  margin-right: 2rem;
`;

const StatusBarWrapper = styled.div`
  flex: 0 2 100%;
  margin-left: 2rem;
  text-align: right;
`;

const SettingsPanel = (props) => {
  const { defaultYearRange } = props;
  const settings = useReactiveVar(settingsVar);

  useEffect(() => {
    yearRangeVar(defaultYearRange);
  });

  return (
    <FixedPanel expanded>
      <ScenarioSelectorWrapper>
        <ScenarioSelector />
      </ScenarioSelectorWrapper>
      <RangeSelectorWrapper>
        <RangeSelector
          min={settings.minYear}
          max={settings.maxYear}
          initMin={defaultYearRange[0]}
          initMax={defaultYearRange[1]}
          baseYear={settings.baseYear}
          handleChange={yearRangeVar}
        />
      </RangeSelectorWrapper>
      <StatusBarWrapper>
        <TotalEmissionsBar />
      </StatusBarWrapper>
    </FixedPanel>
  );
};

export default SettingsPanel;
