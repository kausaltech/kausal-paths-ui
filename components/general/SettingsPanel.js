import { useReactiveVar } from '@apollo/client';
import styled from 'styled-components';
import { Container, Row, Col } from 'reactstrap';
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
  padding: 1rem 1.5rem;
  background-color: ${(props) => props.theme.graphColors.grey000};
  color: ${(props) => props.theme.graphColors.grey090};
  box-shadow: 0 0 4px 4px rgba(20,20,20,0.05);
`;

const SettingsPanel = (props) => {
  const { defaultYearRange, useBase } = props;
  const settings = useReactiveVar(settingsVar);

  return (
    <FixedPanel expanded>
      <Container fluid>
        <Row>
          <Col md="4" sm="4" xs="8">
            <ScenarioSelector />
          </Col>
          <Col md="2" sm="3" xs="4">
            <RangeSelector
              min={settings.minYear}
              max={settings.maxYear}
              initMin={defaultYearRange[0]}
              initMax={defaultYearRange[1]}
              baseYear={useBase && settings.baseYear}
              handleChange={yearRangeVar}
            />
          </Col>
          <Col md="6" sm="5" xs="12" className="mt-3 mt-sm-0">
            <TotalEmissionsBar />
          </Col>
        </Row>
      </Container>
    </FixedPanel>
  );
};

export default SettingsPanel;
