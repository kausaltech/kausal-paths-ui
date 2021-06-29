import { Container, Row, Col } from 'reactstrap';
import styled from 'styled-components';

const HeaderSection = styled.div`
  padding: .5rem 0 1rem;
  background-color: ${(props) => props.theme.brandDark};
`;

const PageHeader = styled.div` 
  margin-bottom: 2rem;

  h1 {
    font-size: 2rem;
    margin-bottom: 1rem;
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

const FrontPageHeader = (props) => {
  const { leadTitle, leadParagraph } = props;

  return (
    <HeaderSection>
      <Container>
        <Row>
          <Col md={{ size: 10, offset: 1 }}>
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
