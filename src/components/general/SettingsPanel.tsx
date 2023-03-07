import { useContext, useState } from 'react';
import { useReactiveVar } from '@apollo/client';
import styled from 'styled-components';
import { Container, Row, Col, Button } from 'reactstrap';
import { Sliders } from 'react-bootstrap-icons';
import RangeSelector from 'components/general/RangeSelector';
import SiteContext, { useSite } from 'context/site';
import { yearRangeVar, settingsVar } from 'common/cache';
import ScenarioSelector from './ScenarioSelector';
import TotalEmissionsBar from './TotalEmissionsBar';
import GlobalParameters from './GlobalParameters';
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

const SettingsPanel = () => {
  const settings = useReactiveVar(settingsVar);
  const defaultYearRange = [settings.minYear, settings.targetYear];

  const site = useSite();
  const instance = useInstance();
  const [showExtras, setShowExtras] = useState(false);
  const hasGlobalParameters = (
    site.parameters.find((param) => param.isCustomizable) !== undefined ||
    site.availableNormalizations.length > 0
  );

  return (
    <FixedPanel expanded>
      <MainSettingsSection>
      <Container>
        <Row>
          <Col md="4" sm="4" xs="8">
            { true && (
            <ScenarioSelector />
            )}
          </Col>
          <Col md="2" sm="3" xs="4">
            {true && (
            <RangeSelector
              min={settings.minYear}
              max={settings.maxYear}
              initMin={defaultYearRange[0]}
              initMax={defaultYearRange[1]}
              baseYear={instance.referenceYear ?? settings.baseYear}
              handleChange={yearRangeVar}
            />
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
          <Col md="6" sm="5" xs="12" className="mt-3 mt-sm-0">
            { true && 
              <TotalEmissionsBar />
            }
          </Col>
        </Row>
        </Container>
        </MainSettingsSection>
        { showExtras && (
          <ExtraSettingsSection>
            <Container>
              <GlobalParameters parameters={site.parameters} />
            </Container>
          </ExtraSettingsSection>
        )}
    </FixedPanel>
  );
};

export default SettingsPanel;
