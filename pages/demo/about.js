import { useState, useEffect, useContext } from 'react';
import styled, { useTheme } from 'styled-components';

import { useRouter } from 'next/router';
import { activeScenarioVar, yearRangeVar, settingsVar } from 'common/cache';
import { Container, Row, Col, ButtonGroup, Button } from 'reactstrap';
import { useTranslation } from 'next-i18next';
import { useSite } from 'context/site';

import Layout from 'components/Layout';
import ContentLoader from 'components/common/ContentLoader';

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

function AboutPage(props) {
  const { page, activeScenario: queryActiveScenario } = props;
  const { t } = useTranslation();
  const theme = useTheme();
  const site = useSite();
  const router = useRouter();
  const { locale } = router;

  const CONTENT = {
    en: {
      header: "About Scenario Tool",
    },
    fi: {
      header: "Tietoa skenaarioty??kalusta",
    },
    de: {
      header: "??ber das Szenario-Tool",
    }
  }

  return (
  <Layout>
    <HeaderSection>
      <Container>
      <Row>
        <Col lg={{ size: 8, offset: 2 }}>
        <PageHeader>
          <h1>
            { CONTENT[locale].header }
          </h1>
        </PageHeader>
</Col></Row>
      </Container>
    </HeaderSection>
    <Container className="mb-5">
      <Row>
        <Col lg={{ size: 8, offset: 2 }}>
          { locale==='en' &&
          <GraphCard>
            <p>Sunnydale Climate Scenario Tool is an open source state-of-the-art platform for assessing possible climate actions and their emissions, costs, health and other impacts. It is a scenario tool for developing and updating climate action plans and targets for key indicators. It works seamlessly with Sunnydale Climate Action Plan platform, which is designed for monitoring, managing, and communicating about the climate action plan.</p>
            <p>The platform consists of a public user interface (UI), which all the stakeholders can browse. You can see climate emissions and their trends of different sectors and subsectors. You can select between scenarios and compare the outcomes to the Sunnydale's targets. You can also adjust the selections themselves, thus creating new scenarios to be considered. All changes in the input values are recalculated instantly, so you can easily toggle between options and compare scenarios.</p>
          </GraphCard> }
          { locale==='fi' &&
          <GraphCard>
            <p>Sunnydale Climate Scenario Tool on avoimen l??hdekoodin huippumoderni alusta mahdollisten ilmastotoimien ja niiden p????st??jen, kustannusten, terveys- ja muiden vaikutusten arvioimiseen. Se on skenaarioty??kalu ilmastotoimintasuunnitelmien ja avainindikaattoreiden tavoitteiden kehitt??miseen ja p??ivitt??miseen. Se toimii saumattomasti Sunnydale Climate Action Plan -alustan kanssa, joka on suunniteltu ilmastotoimintasuunnitelman seurantaan, hallintaan ja viestint????n.</p>
            <p>Alusta koostuu julkisesta k??ytt??liittym??st?? (UI), jota kaikki sidosryhm??t voivat selata. N??et ilmastop????st??t ja niiden trendit eri toimialoilla ja osa-alueilla. Voit valita skenaarioiden v??lill?? ja verrata tuloksia Sunnydalen tavoitteisiin. Voit my??s s????t???? itse valintoja ja luoda n??in uusia skenaarioita harkittavaksi. Kaikki sy??tt??arvojen muutokset lasketaan uudelleen v??litt??m??sti, joten voit helposti vaihtaa vaihtoehtojen v??lill?? ja verrata skenaarioita.</p>
          </GraphCard> }
          { locale==='de' &&
          <GraphCard>
            <p>Das Sunnydale Climate Scenario Tool ist eine hochmoderne Open-Source-Plattform zur Bewertung m??glicher Klimaschutzma??nahmen und ihrer Emissionen, Kosten, Gesundheit und anderer Auswirkungen. Es ist ein Szenario-Tool zur Entwicklung und Aktualisierung von Klimaschutzpl??nen und Zielvorgaben f??r Schl??sselindikatoren. Es funktioniert nahtlos mit der Sunnydale Climate Action Plan-Plattform, die f??r die ??berwachung, Verwaltung und Kommunikation des Klimaschutzplans konzipiert ist.</p>
            <p>Die Plattform besteht aus einer ??ffentlichen Benutzeroberfl??che (UI), die alle Beteiligten durchsuchen k??nnen. Sie k??nnen die Klimaemissionen und deren Trends verschiedener Sektoren und Teilsektoren sehen. Sie k??nnen zwischen Szenarien w??hlen und die Ergebnisse mit den Zielen von Sunnydale vergleichen. Sie k??nnen auch die Auswahlen selbst anpassen und so neue zu ber??cksichtigende Szenarien erstellen. Alle ??nderungen der Eingabewerte werden sofort neu berechnet, sodass Sie problemlos zwischen Optionen wechseln und Szenarien vergleichen k??nnen.</p>
          </GraphCard> }
        </Col>
      </Row>
    </Container>
  </Layout>
  )
}

export default AboutPage