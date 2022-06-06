import { useState } from 'react';
import styled from 'styled-components';
import dynamic from 'next/dynamic';
import { Container, Row, Col, ButtonGroup, Button } from 'reactstrap';
import { useTranslation } from 'next-i18next';
import Layout from 'components/Layout';
import MacGraph from 'components/graphs/MacGraph';

const MOCK_DATA = {
  actions: [
    'Low -energy lamps',
    'Pressure -controlled fans',
    'Adjustment ventilation system',
    'Sneak -flushing luminaires',
    'Presence controlled LED',
    'Replacement thermostats/valves + adjustment heating system',
    'Wind insulation 300mm',
    'Painting/sealing windows/doors',
    'New entrance/basement doors',
    'Heat exchanger wastewater',
    'IMD hot water',
    'FVP COP 3.0',
    'FTX 85 %',
    'Additional insulation windows',
    'Facade insulation 100mm',
    'Window replacement (U = 1.0)',
    ],  
  netcost:  [
    -30.8,
    -27.1,
    -21.1,
    -20.1,
    -17.8,
    -17.5,
    -17.1,
    -13.6,
    -13.5,
    -11.9,
    -11.9,
    -5,
    -1.9,
    -1.6,
    20.2,
    22.7,
    ],  
    energySaving: [
    10400000,
    41600000,
    52000000,
    62400000,
    10400000,
    135200000,
    36400000,
    20800000,
    26000000,
    52000000,
    52000000,
    166400000,
    78000000,
    78000000,
    43680000,
    31200000,
    ], 
};

const HeaderSection = styled.div`
  padding: 4rem 0 10rem; 
  background-color: ${(props) => props.theme.graphColors.blue070};
`;

const PageHeader = styled.div` 
  h1 {
    margin-bottom: 2rem;
    font-size: 2rem;
    color: ${(props) => props.theme.themeColors.white};
  }
`;

const GraphCard = styled.div` 
  margin: -8rem 0 3rem;
  padding: 2rem;
  border-radius:  ${(props) => props.theme.cardBorderRadius};
  background-color: ${(props) => props.theme.themeColors.white};
  box-shadow: 3px 3px 12px rgba(33,33,33,0.15);
`;

const ActiveScenario = styled.div`
  padding: .75rem;
  border-radius:  ${(props) => props.theme.cardBorderRadius};
  background-color: ${(props) => props.theme.brandDark};
  color: ${(props) => props.theme.themeColors.white};
  font-size: 1rem;
  font-weight: 700;
  vertical-align: middle;
`;

function MacPage() {
  const { t } = useTranslation();

  return (
  <Layout>
    <HeaderSection>
      <Container>
        <PageHeader>
          <h1>
            Cost effectiveness
            {' '}
          </h1>
        </PageHeader>
      </Container>
    </HeaderSection>
    <Container className="mb-5">
      <Row>
        <Col>
          <GraphCard>
            <MacGraph
            data={MOCK_DATA}
            />
          </GraphCard>
        </Col>
      </Row>
    </Container>
  </Layout>
  )
}

export default MacPage