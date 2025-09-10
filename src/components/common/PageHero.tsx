import type { Theme } from '@emotion/react';
import styled from '@emotion/styled';
import { Card, Container, type SxProps } from '@mui/material';

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

const StyledHeroCard = styled(Card)`
  max-width: ${({ theme }) => theme.breakpoints.values.md}px;
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

type PageHeroProps = {
  leadTitle?: string;
  leadDescription?: string;
  children?: React.ReactNode;
  CardStyles?: SxProps<Theme>;
};

export const PageHero = ({
  leadTitle,
  leadDescription,
  children,
  CardStyles = {},
}: PageHeroProps) => {
  const hasHeroCard = !!(leadTitle || leadDescription);

  if (!hasHeroCard && !children) {
    return null;
  }

  return (
    <StyledHeroSection>
      <Container fixed maxWidth="xl" sx={{ py: 3 }}>
        {hasHeroCard && (
          <StyledHeroCard sx={CardStyles}>
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
