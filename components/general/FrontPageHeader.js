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

const FrontPageHeader = (props) => {
  const { leadTitle, leadParagraph } = props;

  return (
    <HeaderSection>
      <Container fluid>
        <Row>
          <Col md={{ size: 8, offset: 2 }}>
            <PageHeader>
              <HeaderCard>
                <h1>
                  { leadTitle }
                </h1>
                <Description dangerouslySetInnerHTML={{ __html: leadParagraph }} />
              </HeaderCard>
            </PageHeader>
          </Col>
        </Row>
      </Container>
    </HeaderSection>
  );
};

export default FrontPageHeader;
