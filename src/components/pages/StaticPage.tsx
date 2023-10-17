import styled from 'styled-components';

import type { GetPageQuery } from 'common/__generated__/graphql';
import { useTranslation } from 'common/i18n';
import type { PageRefetchCallback } from './Page';
import { Col, Container, Row } from 'reactstrap';
import RichText from 'components/common/RichText';

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
  border-radius: ${(props) => props.theme.cardBorderRadius};
  background-color: ${(props) => props.theme.themeColors.white};
  box-shadow: 3px 3px 12px rgba(33, 33, 33, 0.15);
`;

type StaticPageProps = {
  page: NonNullable<GetPageQuery['page']> & {
    __typename: 'StaticPage';
  };
  refetch: PageRefetchCallback;
};

function StaticPage(props: StaticPageProps) {
  const { page } = props;
  console.log(page);
  return (
    <>
      <HeaderSection>
        <Container fluid="lg">
          <Row>
            <Col lg={{ size: 8, offset: 2 }}>
              <PageHeader>
                <h1>{page.title}</h1>
              </PageHeader>
            </Col>
          </Row>
        </Container>
      </HeaderSection>
      <Container fluid="lg" className="mb-5">
        <Row>
          <Col lg={{ size: 8, offset: 2 }}>
            <GraphCard>
              {page!.body!.map((block) => {
                console.log(block);
                if (block?.__typename == 'RichTextBlock') {
                  return <RichText key={block.id} html={block.value} />;
                }
                return null;
              })}
            </GraphCard>
          </Col>
        </Row>
      </Container>
    </>
  );
}

export default StaticPage;
