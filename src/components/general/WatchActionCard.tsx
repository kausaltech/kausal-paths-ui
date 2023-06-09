import styled from 'styled-components';

const ActionCard = styled.div`
  display: flex;
  background-color: ${(props) => props.theme.graphColors.grey000};
  border-radius: 0;
  margin-bottom: 1rem;
`;

const ActionCardImage = styled.div`
  flex: 1 1 60px;
  position: relative;
  background-color: ${(props) => props.theme.graphColors.grey005};

  img {
    position: absolute;
    width: 100%;
    height: 100%;
  }
`;

const ActionCardContent = styled.div`
  flex: 1 1 auto;
  padding: 1rem;
  background-color: ${(props) => props.theme.graphColors.grey000};
`;

const WatchActionCard = (props: any) => {
  const { action } = props;

  return (
    <ActionCard>
      <ActionCardImage>
        <img src={action?.image} alt={action?.name} />
      </ActionCardImage>
      <ActionCardContent>
        <h5>{action?.name}</h5>
        <p>{action?.description}</p>
      </ActionCardContent>
    </ActionCard>
  );
};

export default WatchActionCard;