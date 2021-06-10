import { useContext } from 'react';
import styled from 'styled-components';
import SettingsContext from 'common/settings-context';
import RangeSelector from 'components/general/RangeSelector';

const FixedPanel = styled.div`
  position: fixed;
  z-index: 255;
  left: 0;
  bottom: 0;
  width: 100%;
  padding: 1.5rem;
  background-color: #ffffff;
  color: ${(props) => props.theme.graphColors.grey090};
  box-shadow: 0 0 6px 6px rgba(20,20,20,0.2);
`;

const SettingsPanel = (props) => {
  const settings = useContext(SettingsContext);

  return (
    <FixedPanel expanded>
      <RangeSelector
        min={2010}
        max={2030}
        baseYear={1990}
      />
    </FixedPanel>
  );
};

export default SettingsPanel;
