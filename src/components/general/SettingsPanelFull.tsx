import { useCallback, useContext, useState } from 'react';
import { useReactiveVar } from '@apollo/client';
import styled from 'styled-components';
import { transparentize } from 'polished';
import { Row, Col, Button } from 'reactstrap';
import { Sliders, XLg } from 'react-bootstrap-icons';
import { useSite } from 'context/site';
import { yearRangeVar } from 'common/cache';
import { useInstance } from 'common/instance';
import { useTranslation } from 'next-i18next';
import CompleteSettings from './CompleteSettings';
import MediumSettings from './MediumSettings';

const FixedPanel = styled.div`
  position: fixed;
  z-index: 255;
  left: 0;
  bottom: 0;
  width: 100%;
  background-color: ${(props) => props.theme.graphColors.grey000};
  color: ${(props) => props.theme.graphColors.grey090};
  box-shadow: 0 0 4px 4px rgba(20,20,20,0.05);
  transition: height .25s;
  //border-top: 2px solid ${(props) => props.theme.graphColors.grey050};

  &.panel-sm {
    height: 4rem;
  }

  &.panel-md {
    height: 7rem;
  }

  &.panel-lg {
    height: 95%;

    &::before {
      content: '';
      position: fixed;
      z-index: -50;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: ${(props) => transparentize(0.15, props.theme.graphColors.grey090)};
    }
  }
`;

const PanelToggle = styled(Button)`
  position: absolute;
  background-color: ${(props) => props.theme.themeColors.white} !important;
  z-index: 25;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  padding: 0;
  top: 6px;
  right: 6px;
  box-shadow: 3px 3px 12px rgba(33,33,33,0.15);

  &:hover {
    background-color: ${(props) => props.theme.graphColors.grey030};
  }
`;

const SettingsPanelFull: React.FC<SettingsPanelFullProps> = (props) => {
  if (!(process.browser)) {
    return null;
  }
  const site = useSite();
  const instance = useInstance();
  // console.log("Site", "Instance", site, instance);

  // Handle panel states
  const MODE = {
    SM: 'sm',
    MD: 'md', 
    LG: 'lg',
  };
  const [mode, setMode] = useState(MODE.MD);

  const handleToggle = (e) => {
    e.preventDefault();
    if (mode === MODE.LG) {
      setMode(MODE.MD); 
    } else if (mode === MODE.MD) {
      setMode(MODE.LG); // Make SM mobile only
    } else {
      setMode(MODE.LG);
    }   
  };

  // State of display settings
  // Year range
  const yearRange = useReactiveVar(yearRangeVar);
  const setYearRange = useCallback((newRange: [number, number]) => {
    yearRangeVar(newRange);
  }, [yearRangeVar]);
  const { t } = useTranslation();

  // Normalization
  const availableNormalizations = site.availableNormalizations;

  // Target
  const nrGoals = instance.goals.length;

  // console.log(props);
  return (
    <FixedPanel className={`panel-${mode}`}>
      <PanelToggle
        onClick={(e) => handleToggle(e)}
      > 
        { mode === MODE.SM && <Sliders />}
        { mode === MODE.MD && <Sliders />}
        { mode === MODE.LG && <XLg />}
      </PanelToggle>
        { mode === MODE.SM && (<>
          <Row>
            <Col sm="3">
              {t('scenario')}
            </Col>
            <Col sm="3">
              {t('comparing-years')}({yearRange[0]} - {yearRange[1]})
            </Col>
            <Col sm="3">
              { nrGoals > 1 && (
                <>{t('Target')}</>
              )}
            </Col>
          </Row>
        </>)}
        { mode === MODE.MD && (
          <MediumSettings />
        )}
        { mode === MODE.LG && (
          <CompleteSettings />
        )}
    </FixedPanel>
  );
};

export default SettingsPanelFull;
