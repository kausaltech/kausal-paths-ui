import { useCallback, useContext, useState } from 'react';
import { useReactiveVar } from '@apollo/client';
import styled from 'styled-components';
import { Container, Row, Col, Button } from 'reactstrap';
import { Sliders } from 'react-bootstrap-icons';
import RangeSelector from 'components/general/RangeSelector';
import { useSite } from 'context/site';
import { yearRangeVar, } from 'common/cache'
import GoalSelector from 'components/general/GoalSelector';
import ScenarioSelector from 'components/general/ScenarioSelector';
import GoalOutcomeBar from 'components/general/GoalOutcomeBar';
import GlobalParameters from 'components/general/GlobalParameters';
import { useInstance } from 'common/instance';

const FixedPanel = styled.div`
  position: fixed;
  z-index: 255;
  left: 0;
  bottom: 0;
  width: 100%;
  background-color: ${(props) => props.theme.graphColors.grey000};
  color: ${(props) => props.theme.graphColors.grey090};
  box-shadow: 0 0 4px 4px rgba(20,20,20,0.05);
`;

const SettingsButton = styled(Button)`
  position: absolute;
  width: 3rem;
  height: 3rem;
  border-radius: 1.5rem;
  padding: 0;
  bottom: -12px;
  right: 50%;
  box-shadow: 3px 3px 12px rgba(33,33,33,0.15);
`;

const MainSettingsSection = styled.div`
  position: relative;
  padding: 1rem 0 1.5rem;
`;

const ExtraSettingsSection = styled.div`
  padding: 1rem 0 2rem;
  background-color: ${(props) => props.theme.graphColors.grey020};
`;

type SettingsPanelProps = {
  defaultYearRange?: number[],
}

const SettingsPanel: React.FC<SettingsPanelProps> = (props) => {
  if (!(process.browser)) {
    return null;
  }
  const site = useSite();
  const defaultYearRange = props.defaultYearRange ?? [site.minYear, site.targetYear];

  const instance = useInstance();
  const [showExtras, setShowExtras] = useState(false);
  const hasGlobalParameters = (
    site.parameters.find((param) => param.isCustomizable) !== undefined ||
    site.availableNormalizations.length > 0
  );
  const nrGoals = instance.goals.length;

  const setYearRange = useCallback((newRange: [number, number]) => {
    yearRangeVar(newRange);
  }, [yearRangeVar]);

  return (
    <FixedPanel>
      <MainSettingsSection>
      <Container fluid="lg">
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
              referenceYear={instance.referenceYear ?? site.referenceYear}
              handleChange={setYearRange}
            />
            )}
          </Col>
          <Col md="2" sm="4" xs="6">
            { nrGoals > 1 && (
              <GoalSelector />
            )}
          </Col>
          { hasGlobalParameters &&
            <SettingsButton
              onClick={(e) => setShowExtras(!showExtras)}
              color="white"
            > 
              <Sliders />
            </SettingsButton>
          }
          <Col md="6" sm="12" className="mt-3 mt-sm-0">
            { true && 
              <GoalOutcomeBar />
            }
          </Col>
        </Row>
        </Container>
        </MainSettingsSection>
        { showExtras && (
          <ExtraSettingsSection>
            <Container fluid="lg">
              <GlobalParameters parameters={site.parameters} />
            </Container>
          </ExtraSettingsSection>
        )}
    </FixedPanel>
  );
};

export default SettingsPanel;
