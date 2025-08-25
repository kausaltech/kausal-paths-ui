import styled from '@emotion/styled';
import { Container } from '@mui/material';

export const StyledContentContainer = styled(Container)<{ $overlap: boolean }>`
  /* Pull content to overlap the header section */
  margin-top: ${({ $overlap }) => ($overlap ? '-10rem' : '0')};
`;

const StyledHeroContainer = styled.div<{ $overlap: boolean }>`
  padding: 4rem 0 2rem;
  margin-bottom: 1rem;
  background-color: ${({ theme }) => theme.brandDark};
  color: ${(props) => props.theme.themeColors.white};
  padding-bottom: ${({ $overlap }) => ($overlap ? '10rem' : '0')};
`;

const StyledHero = styled.div<{ $overlap: boolean }>`
  background: ${({ $overlap, theme }) => (!$overlap ? theme.brandDark : undefined)};
`;

const StyledTitle = styled.h1`
  font-size: ${(props) => props.theme.fontSizeLg};
  color: inherit;

  @media (min-width: ${(props) => props.theme.breakpointMd}) {
    font-size: ${(props) => props.theme.fontSizeXl};
  }
`;

const StyledHeroCard = styled(Container)`
  border-radius: 0;
  background-color: ${(props) => props.theme.themeColors.white};
  color: ${(props) => props.theme.textColor.primary};
  padding: ${(props) => props.theme.spaces.s100};
  margin-bottom: ${({ theme }) => theme.spaces.s400};

  @media (min-width: ${(props) => props.theme.breakpointMd}) {
    padding: ${(props) => props.theme.spaces.s200};
  }
`;

const Description = styled.div`
  max-width: ${({ theme }) => theme.breakpointSm};

  p:last-child {
    margin-bottom: 0;
  }

  a {
    text-decoration: underline;
    &:hover {
      text-decoration: none;
    }
  }
`;

type Props = {
  title: string;
  leadTitle?: string;
  leadDescription?: string;
  /** Whether the children container overlaps part of the hero background, purely aesthetic */
  overlap?: boolean;
  children?: React.ReactNode;
};

export const PageHero = ({ leadTitle, leadDescription, overlap = false, children }: Props) => {
  const hasHeroCard = !!(leadTitle || leadDescription);

  return (
    <StyledHero $overlap={overlap}>
      <StyledHeroContainer $overlap={overlap}>
        <Container fixed maxWidth="xl" sx={{ p: 4 }}>
          {hasHeroCard && (
            <StyledHeroCard>
              {!!leadTitle && <StyledTitle>{leadTitle}</StyledTitle>}
              {!!leadDescription && (
                <Description dangerouslySetInnerHTML={{ __html: leadDescription }} />
              )}
            </StyledHeroCard>
          )}
        </Container>
      </StyledHeroContainer>

      {!!children && (
        <StyledContentContainer $overlap={overlap} maxWidth="xl" sx={{ p: 4 }}>
          {children}
        </StyledContentContainer>
      )}
    </StyledHero>
  );
};
