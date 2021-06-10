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
  background-color: ${(props)=> props.theme.themeColors.dark};
  color: ${(props)=> props.theme.graphColors.grey010};
`;

const SettingsPanel = (props) => {
  const settings = useContext(SettingsContext);

  return (
    <FixedPanel expanded={true}>
      <RangeSelector 
        min={2010}
        max={2030}
        baseYear={1990}
      />
    </FixedPanel>
  )

}

export default SettingsPanel;