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
  font-size: 1rem;
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
  align-items: flex-start;
  margin-top: 1rem;
`;

const TabButton = styled(Button)`
  padding-top: 0.2rem;
  padding-bottom: 0.4rem;
`;

const MainValue = styled.div`
  text-align: right;
  font-size: 1.75rem;
  line-height: 1.2;
  font-weight: 700;
`;

const MainUnit = styled.div`
  font-size: 0.8rem;
`;

const EmissionsCard = (props) => {
  const { date, unit, sector, subSectors, state } = props;
  const status = state !== 'active' ?  'inactive' : 'active';

  const baseEmissions = sector.metric.historicalValues[0];
  const goalEmissions = sector.metric.forecastValues.find((dataPoint) => dataPoint.year === date) || sector.metric.historicalValues.find((dataPoint) => dataPoint.year === date);
  const change =  -Math.round(((baseEmissions.value-goalEmissions.value)/baseEmissions.value)*100);

  return (
    <DashCard state={status}>
      <Header>
        <Title>
          <Name>{sector.name}</Name>
        </Title>
        <Status>
          {change}%
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
          <MainUnit>{ date }</MainUnit>
          {goalEmissions.value.toLocaleString('fi-FI')}
          <MainUnit>{unit}</MainUnit>
        </MainValue>
      </Body>
    </DashCard>
  );
};

export default EmissionsCard;
