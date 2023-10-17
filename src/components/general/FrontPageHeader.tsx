import { Container } from 'reactstrap';
import styled from 'styled-components';

const HeaderSection = styled.div<{ backgroundColor?: string }>`
  padding: 0.5rem 0 1rem;
  background: ${(props) => props.backgroundColor || props.theme.brandDark};
`;

const PageHeader = styled.div`
  margin-bottom: 1rem;
`;

const HeaderCard = styled.div`
  margin: ${(props) => props.theme.spaces.s100} 0;
  padding: ${(props) => props.theme.spaces.s100};
  border-radius: 0;
  background-color: ${(props) => props.theme.themeColors.white};

  h1 {
    margin: 0 0 ${(props) => props.theme.spaces.s100};
    font-size: ${(props) => props.theme.fontSizeLg};
  }

  @media (min-width: ${(props) => props.theme.breakpointMd}) {
    margin: ${(props) => props.theme.spaces.s200} 0;
    padding: ${(props) => props.theme.spaces.s200};

    h1 {
      max-width: ${({ theme }) => theme.breakpointSm};
      margin: 0 0 ${(props) => props.theme.spaces.s200};
      font-size: ${(props) => props.theme.fontSizeXl};
    }
  }
`;

const Description = styled.div`
  max-width: ${({ theme }) => theme.breakpointSm};

  p:last-child {
    margin-bottom: 0;
  }
`;

type FrontPageHeaderProps = {
  leadTitle: string;
  leadParagraph: string;
  backgroundColor?: string;
};

const FrontPageHeader = (props: FrontPageHeaderProps) => {
  const { leadTitle, leadParagraph, backgroundColor } = props;

  return (
    <HeaderSection backgroundColor={backgroundColor}>
      <Container fluid="lg">
        <PageHeader>
          <HeaderCard>
            <h1>{leadTitle}</h1>
            <Description dangerouslySetInnerHTML={{ __html: leadParagraph }} />
          </HeaderCard>
        </PageHeader>
      </Container>
    </HeaderSection>
  );
};

export default FrontPageHeader;
