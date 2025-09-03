import styled from '@emotion/styled';
import { Card, CardContent } from '@mui/material';

type Props = {
  title?: string;
  cards: {
    title: string;
    shortDescription?: string;
  }[];
};

const StyledCardContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: ${({ theme }) => theme.spaces.s100};
`;

const StyledCardTitle = styled.p`
  line-height: ${({ theme }) => theme.lineHeightMd};
  color: ${({ theme }) => theme.textColor.secondary};
`;

export function CardListBlock({ title, cards }: Props) {
  return (
    <>
      {!!title && <h5>{title}</h5>}

      <StyledCardContainer>
        {cards.map((card, i) => (
          <Card key={i}>
            <CardContent>
              <StyledCardTitle>{card.title}</StyledCardTitle>
              {!!card.shortDescription && <div>{card.shortDescription}</div>}
            </CardContent>
          </Card>
        ))}
      </StyledCardContainer>
    </>
  );
}
