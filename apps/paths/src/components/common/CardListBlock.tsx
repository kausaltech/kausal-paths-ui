import styled from 'styled-components';
import { Card, CardText, CardTitle } from 'reactstrap';

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

const StyledCard = styled(Card)`
  border-radius: ${({ theme }) => theme.cardBorderRadius};
  border: none;
  background-color: ${({ theme }) => theme.cardBackground.secondary};
  padding: ${({ theme }) => theme.spaces.s100};
`;

const StyledCardTitle = styled(CardTitle)`
  line-height: ${({ theme }) => theme.lineHeightMd};
  color: ${({ theme }) => theme.textColor.secondary};
`;

export function CardListBlock({ title, cards }: Props) {
  return (
    <>
      {!!title && <h5>{title}</h5>}

      <StyledCardContainer>
        {cards.map((card, i) => (
          <StyledCard key={i}>
            <StyledCardTitle tag="p">{card.title}</StyledCardTitle>
            {!!card.shortDescription && (
              <CardText>{card.shortDescription}</CardText>
            )}
          </StyledCard>
        ))}
      </StyledCardContainer>
    </>
  );
}
