import { useReactiveVar } from '@apollo/client';
import styled from 'styled-components';
import RangeSelector from 'components/general/RangeSelector';
import { yearRangeVar, settingsVar, activeScenarioVar } from 'common/cache';
import ScenarioSelector from './ScenarioSelector';

const FixedPanel = styled.div`
  display: flex;
  position: fixed;
  z-index: 255;
  left: 0;
  bottom: 0;
  width: 100%;
  padding: 1.5rem;
  background-color: #ffffff;
  color: ${(props) => props.theme.graphColors.grey090};
  box-shadow: 0 0 6px 6px rgba(20,20,20,0.05);
`;

const RangeSelectorWrapper = styled.div`
  flex: 0 0;
  margin-right: 2rem;
`;

const SettingsPanel = (props) => {
  const settings = useReactiveVar(settingsVar);

  return (
    <FixedPanel expanded>
      <RangeSelectorWrapper>
        <ScenarioSelector
          handleChange={activeScenarioVar}
        />
      </RangeSelectorWrapper>
      <RangeSelectorWrapper>
        <RangeSelector
          min={settings.minYear}
          max={settings.maxYear}
          baseYear={settings.baseYear}
          handleChange={yearRangeVar}
        />
      </RangeSelectorWrapper>

    </FixedPanel>
  );
};

export default SettingsPanel;