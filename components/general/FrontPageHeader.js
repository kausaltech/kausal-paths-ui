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
  // const { t } = useTranslation();
  const yearRange = useReactiveVar(yearRangeVar);
  const activeScenario = useReactiveVar(activeScenarioVar);

  const description = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.';
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
