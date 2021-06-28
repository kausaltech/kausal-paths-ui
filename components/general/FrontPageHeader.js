import { useReactiveVar } from '@apollo/client';
import { Container, Row, Col } from 'reactstrap';
import styled from 'styled-components';
import { activeScenarioVar, settingsVar, yearRangeVar } from 'common/cache';

const HeaderSection = styled.div`
  padding: 1rem 0 1rem;
  background-color: ${(props) => props.theme.graphColors.blue070};
`;

const PageHeader = styled.div` 
  margin-bottom: 2rem;

  h1 {
    font-size: 1.5rem;
    color: ${(props) => props.theme.themeColors.dark};
  }
`;

const HeaderCard = styled.div` 
  margin: 3rem 0;
  padding: 2rem;
  border-radius: 1rem;
  background-color: ${(props) => props.theme.themeColors.white};
`;

const Description = styled.div`
`;

const ContentWrapper = styled.div`
  padding: 1rem;
  margin: .5rem 0;
  background-color: ${(props) => props.theme.graphColors.grey005};
  border-radius: 10px;

  .x2sstick text, .xtick text {
    text-anchor: end !important;
  }
`;

const FrontPageHeader = () => {
  const description = 'Tampereen tavoitteena on tulla hiilineutraaliksi vuoteen 2030 mennessä: silloin kasvihuonekaasupäästöt saavat olla enintään 260 kilotonnia. Tampereen päästöskenaariot näyttää, mistä Tampereen päästöt syntyvät ja miten kaupunki aikoo niitä vähentää. Voit tarkastella, miten päästöt kehittyvät erilaisissa skenaarioissa ja rakentaa myös oman skenaarion valitsemistasi toimista.';

  return (
    <HeaderSection>
      <Container fluid>
        <Row>
          <Col md={{ size: 8, offset: 2 }}>
            <PageHeader>
              <HeaderCard>
                <h1>
                  Tampereen päästöskenaariot
                </h1>
                <Description dangerouslySetInnerHTML={{ __html: description }} />
              </HeaderCard>
            </PageHeader>
          </Col>
        </Row>
      </Container>
    </HeaderSection>
  );
};

export default FrontPageHeader;
