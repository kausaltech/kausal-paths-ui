import styled from '@emotion/styled';
import { Container } from '@mui/material';

const StyledHeroSection = styled.div`
  background: ${({ theme }) => theme.brandDark};
`;

const StyledTitle = styled.h1`
  font-size: ${(props) => props.theme.fontSizeLg};
  color: inherit;

  @media (min-width: ${(props) => props.theme.breakpoints.values.md}px) {
    font-size: ${(props) => props.theme.fontSizeXl};
  }
`;

const StyledHeroCard = styled.div`
  max-width: ${({ theme }) => theme.breakpoints.values.md}px;
  border-radius: 0;
  background-color: ${(props) => props.theme.themeColors.white};
  color: ${(props) => props.theme.textColor.primary};
  padding: ${(props) => props.theme.spaces.s100};
  margin-bottom: ${({ theme }) => theme.spaces.s200};

  @media (min-width: ${(props) => props.theme.breakpoints.values.md}px) {
    padding: ${(props) => props.theme.spaces.s200};
  }
`;

const Description = styled.div`
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
  /** @deprecated Whether the children container overlaps part of the hero background, purely aesthetic */
  overlap?: boolean;
  children?: React.ReactNode;
};

export const PageHero = ({ leadTitle, leadDescription, overlap = false, children }: Props) => {
  const hasHeroCard = !!(leadTitle || leadDescription);

  if (!hasHeroCard && !children) {
    return null;
  }

  return (
    <StyledHeroSection>
      <Container fixed maxWidth="xl" sx={{ py: 3 }}>
        {hasHeroCard && (
          <StyledHeroCard>
            {!!leadTitle && <StyledTitle>{leadTitle}</StyledTitle>}
            {!!leadDescription && (
              <Description dangerouslySetInnerHTML={{ __html: leadDescription }} />
            )}
          </StyledHeroCard>
        )}
        {children}
      </Container>
    </StyledHeroSection>
  );
};
