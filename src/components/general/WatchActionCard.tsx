import styled from 'styled-components';
import Icon from 'components/common/icon';

const ActionCard = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1 1 380px;
  margin-right: 1rem;
  background-color: ${({ theme }) => theme.cardBackground.secondary};
  margin-bottom: 1rem;
`;

const GhostCard = styled.div`
  display: flex;
  flex: 1 1 380px;
  margin-right: 1rem;
`;

const ActionCardImage = styled.div`
  flex: 0 0 150px;
  position: relative;
  background-color: ${({ theme }) => theme.cardBackground.secondary};

  img {
    position: absolute;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const ActionCardContent = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  padding: 1rem;

  p {
    font-size: 0.9rem;
    margin-bottom: 1rem;
    line-height: 1.2;
  }
`;

const ActionCardLink = styled.div`
  display: flex;
  flex: 3 0 auto;
  align-self: flex-end;

  a {
    display: inline-block;
    align-self: flex-end;
  }
`;

const WatchActionCard = (props: any) => {
  const { action } = props;

  if (!action) return <GhostCard />;

  return (
    <ActionCard>
      {action?.image && (
        <ActionCardImage>
          <img src={action?.image} alt={action?.name} />
        </ActionCardImage>
      )}
      <ActionCardContent>
        <h5>{action?.name}</h5>
        <p>{action?.description}</p>
        {action?.link && (
          <ActionCardLink>
            <a href={action?.link}>
              Read more <Icon name="arrowRight" />
            </a>
          </ActionCardLink>
        )}
      </ActionCardContent>
    </ActionCard>
  );
};

export default WatchActionCard;
