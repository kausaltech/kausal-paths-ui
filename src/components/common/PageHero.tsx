import type { Theme } from '@emotion/react';
import styled from '@emotion/styled';
import { Card, Container, Typography, type SxProps } from '@mui/material';

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

const visuallyHiddenSx = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap' as const,
  border: 0,
};

type PageHeroProps = {
  /** use title as fallback h1 if no leadTitle for accessibility */
  title?: string;
  leadTitle?: string;
  leadDescription?: string;
  children?: React.ReactNode;
  CardStyles?: SxProps<Theme>;
};

export const PageHero = ({
  title,
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
        {!hasHeroCard && !!title && (
          <Typography component="h1" sx={visuallyHiddenSx}>
            {title}
          </Typography>
        )}

        {children}
      </Container>
    </StyledHeroSection>
  );
};
