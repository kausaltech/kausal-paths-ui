import { useCallback, useContext, useState } from 'react';
import { useReactiveVar } from '@apollo/client';
import styled from 'styled-components';
import { Container, Row, Col, Button } from 'reactstrap';
import { Sliders, ChevronBarExpand, ChevronBarContract, ChevronBarDown } from 'react-bootstrap-icons';
import RangeSelector from 'components/general/RangeSelector';
import { useSite } from 'context/site';
import { yearRangeVar, } from 'common/cache'
import GoalSelector from 'components/general/GoalSelector';
import ScenarioSelector from 'components/general/ScenarioSelector';
import NormalizationWidget from './NormalizationWidget';
import GoalOutcomeBar from 'components/general/GoalOutcomeBar';
import GlobalParameters from 'components/general/GlobalParameters';
import { useInstance } from 'common/instance';
import { useTranslation } from 'next-i18next';

const FixedPanel = styled.div`
  position: fixed;
  z-index: 255;
  left: 0;
  bottom: 0;
  width: 100%;
  // background-color: ${(props) => props.theme.graphColors.grey070};
  color: ${(props) => props.theme.graphColors.grey090};
  box-shadow: 0 0 4px 4px rgba(20,20,20,0.05);
  transition: height .25s;
  border-top: 2px solid ${(props) => props.theme.graphColors.grey050};

  &.panel-sm {
    height: 4rem;
  }

  &.panel-md {
    height: 10rem;
  }

  &.panel-lg {
    height: 95%;
  }

`;

const PanelToggle = styled(Button)`
  position: absolute;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 1rem;
  padding: 0;
  top: 3px;
  right: 3px;
  box-shadow: 3px 3px 12px rgba(33,33,33,0.15);
`;

const PanelContent = styled.div`
  background-color: ${(props) => props.theme.graphColors.grey020};
  padding: 1rem;
  width: 100%;
  height: 100%;
  overflow-y: auto;
`;

const ExtraSettingsSection = styled.div`
  padding: 1rem 0 2rem;
  background-color: ${(props) => props.theme.graphColors.grey020};
`;

type SettingsPanelFullProps = {
  defaultYearRange?: number[],
}

const SettingsPanelFull: React.FC<SettingsPanelFullProps> = (props) => {
  if (!(process.browser)) {
    return null;
  }
  const site = useSite();
  const instance = useInstance();
  console.log("Site", "Instance", site, instance);

  // Handle panel states
  const MODE = {
    SM: 'sm',
    MD: 'md', 
    LG: 'lg',
  };
  const [mode, setMode] = useState(MODE.SM);
  const hasGlobalParameters = (
    site.parameters.find((param) => param.isCustomizable) !== undefined ||
    site.availableNormalizations.length > 0
  );
  const handleToggle = (e) => {
    e.preventDefault();
    if (mode === MODE.LG) {
      setMode(MODE.MD); 
    } else if (mode === MODE.MD) {
      setMode(MODE.SM);
    } else {
      setMode(MODE.LG);
    }   
  };

  // State of display settings
  // Year range
  const defaultYearRange = props.defaultYearRange ?? [site.minYear, site.targetYear];
  const yearRange = useReactiveVar(yearRangeVar);
  const setYearRange = useCallback((newRange: [number, number]) => {
    yearRangeVar(newRange);
  }, [yearRangeVar]);
  const { t } = useTranslation();

  // Normalization
  const availableNormalizations = site.availableNormalizations;

  // Target
  const nrGoals = instance.goals.length;

  console.log(props);
  return (
    <FixedPanel className={`panel-${mode}`}>
      <PanelToggle
        onClick={(e) => handleToggle(e)}
        color="white"
      > 
        { mode === MODE.SM && <ChevronBarExpand />}
        { mode === MODE.MD && <ChevronBarContract />}
        { mode === MODE.LG && <ChevronBarDown />}
      </PanelToggle>
      <PanelContent>
      <Container fluid="lg">
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
        { mode === MODE.MD && (<>
          <Row>
            <Col md="2" sm="4" xs="12">
              { true && (
              <ScenarioSelector />
              )}
            </Col>
            <Col md="2" sm="4" xs="6">
              {true && (
              <RangeSelector
                min={site.minYear}
                max={site.maxYear}
                initMin={defaultYearRange[0]}
                initMax={defaultYearRange[1]}
                baseYear={instance.referenceYear ?? site.baseYear}
                handleChange={setYearRange}
              />
              )}
            </Col>
            <Col md="2" sm="4" xs="6">
              { nrGoals > 1 && (
                <GoalSelector />
              )}
            </Col>
            <Col md="6" sm="12" className="mt-3 mt-sm-0">
              { true && 
                <GoalOutcomeBar />
              }
            </Col>
          </Row>
        </>)}
        { mode === MODE.LG && (<>
          <h4>Display</h4>
          <h5>{t('comparing-years')}</h5>
          <RangeSelector
              min={site.minYear}
              max={site.maxYear}
              initMin={defaultYearRange[0]}
              initMax={defaultYearRange[1]}
              baseYear={instance.referenceYear ?? site.baseYear}
              handleChange={setYearRange}
            />
          <h5>Normalization</h5>
          { availableNormalizations.length > 0 && <NormalizationWidget availableNormalizations={availableNormalizations} />}
          <h5>Target</h5>
          { nrGoals > 1 && (
              <GoalSelector />
            )}
          <h4>Scenario: Selected Scenario</h4>
          <h5>Select scenario</h5>
          <h5>Actions</h5>
          <h5>Global settings</h5>
          <GlobalParameters parameters={site.parameters} />
          <h4>Outcome</h4>
          <GoalOutcomeBar />
        </>)}
        
      </Container>
      </PanelContent>
    </FixedPanel>
  );
};

export default SettingsPanelFull;
