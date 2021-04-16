import DashCard from 'components/general/DashCard';
import { BarChartFill, InfoSquare } from 'react-bootstrap-icons';
import { Button, ButtonGroup } from 'reactstrap';
import styled from 'styled-components';

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  border-bottom: 1px solid #999;
`;

const Title = styled.div`

`;

const Name = styled.h2`
  margin-bottom: 0;
  font-size: 1.2rem;
`;

const Date = styled.p`
  margin-bottom: 0;
  color: #333333;
`;

const Status = styled.div`
  text-align: right;
  white-space: nowrap;
  color: #999999;
  font-weight: 700;
`;

const Body = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 1rem;
`;

const TabButton = styled(Button)`
  padding-top: 0.2rem;
  padding-bottom: 0.4rem;
`;

const MainValue = styled.div`
  text-align: right;
  font-size: 2rem;
  line-height: 1;
  font-weight: 700;
`;

const MainUnit = styled.div`
  font-size: 0.8rem;
`;

const getTotalEmissions = (card, goal) => {
  let totalEmissions = 0;
  card.metrics.forEach((metric) => {
    totalEmissions += metric.forecastValues.find((metric) => metric.year === parseInt(goal))?.value;
  });
  return totalEmissions;
}

const getChange = (card, goal) => {
  let currentEmissions = 0;
  card.metrics.forEach((metric) => {
    currentEmissions += metric.historicalValues[metric.historicalValues.length-1].value;
  });
  const totalEmissions = getTotalEmissions(card, goal);
  return -Math.round(((currentEmissions-totalEmissions)/currentEmissions)*100);
}

const EmissionsCard = (props) => {
  const { unit, card, date, state  } = props;
  const status = state !== 'active' ?  'inactive' : 'active';

  return (
    <DashCard state={status}>
      <Header>
        <Title>
          <Name>{card.name}</Name>
          <Date>{date}</Date>
        </Title>
        <Status>
          {getChange(card, date)} %
        </Status>
      </Header>
      <Body>
        { state === 'active' &&
          <ButtonGroup>
            <TabButton outline color="dark"><BarChartFill /></TabButton>
            <TabButton outline color="dark"><InfoSquare /></TabButton>
          </ButtonGroup>
        }
        <div />
        <MainValue>
          {getTotalEmissions(card, date)}
          <MainUnit>{unit}</MainUnit>
        </MainValue>
      </Body>
    </DashCard>
  );
};

export default EmissionsCard;
