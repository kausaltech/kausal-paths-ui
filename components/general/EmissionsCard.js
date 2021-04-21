import DashCard from 'components/general/DashCard';
import { BarChartFill, InfoSquare } from 'react-bootstrap-icons';
import { Button, ButtonGroup } from 'reactstrap';
import styled from 'styled-components';

const Header = styled.div`
  display: flex;
  justify-content: space-between;
`;

const Title = styled.div`
  // border-left: 6px solid ${(props) => props.color};
  // padding-left: 6px;
`;

const CardAnchor = styled.a`
  &:hover {
    text-decoration: none;
  }
  &::after {
    content: '';
    position: absolute; 
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    cursor: pointer;
  }
`;

const Name = styled.h2`
  margin-bottom: 0;
  font-size: 0.8rem;
`;

const Date = styled.p`
  margin-bottom: 0;
`;

const Status = styled.div`
  text-align: right;
  white-space: nowrap;
  font-size: 0.8rem;
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
  font-size: 1.5rem;
  line-height: 1.2;
  font-weight: 700;
`;

const MainUnit = styled.div`
  font-size: 0.8rem;
`;

const EmissionsCard = (props) => {
  const { date, unit, sector, subSectors, state, hovered, onHover, handleClick, active, color } = props;
  const status = state !== 'active' ?  'inactive' : 'active';

  const baseEmissions = sector.metric.historicalValues[0];
  const goalEmissions = sector.metric.forecastValues.find((dataPoint) => dataPoint.year === date)
    || sector.metric.historicalValues.find((dataPoint) => dataPoint.year === date);
  const change =  -Math.round(((baseEmissions.value-goalEmissions?.value)/baseEmissions.value)*100);

  return (
    <DashCard state={status} hovered={hovered} active={active} color={color}>
      <Header>
        <Title color={color}>
          <CardAnchor
            onMouseEnter={() => onHover(sector.id)}
            onMouseLeave={() => onHover(undefined)}
            onClick={() => handleClick(active ? undefined : sector.id)}
          >
            <Name>{sector.name} {date}</Name>
          </CardAnchor>
        </Title>
      </Header>
      <Body>
        { state === 'active' &&
          <ButtonGroup>
            <TabButton outline color="info"><BarChartFill /></TabButton>
            <TabButton outline color="info"><InfoSquare /></TabButton>
          </ButtonGroup>
        }
        <div />
        <MainValue>
          <Status>
            {change}%
          </Status>
          {goalEmissions?.value.toLocaleString('fi-FI')}
          <MainUnit>{unit}</MainUnit>
        </MainValue>
      </Body>
    </DashCard>
  );
};

export default EmissionsCard;
