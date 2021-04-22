import DashCard from 'components/general/DashCard';
import styled from 'styled-components';

const Header = styled.div`
  display: flex;
  justify-content: space-between;

  &.root h2 {
    font-size: 1.5rem;
  }
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
  font-size: 1rem;
`;

const Date = styled.p`
  margin-bottom: 0;
`;

const Status = styled.div`
  margin-top: .5rem;
  text-align: right;
  white-space: nowrap;
  font-size: 1rem;
  font-weight: 700;
`;

const Body = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-top: .5rem;
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

// Use Finnish style numeric display formatting
function beautifyValue(x) {
  let out;
  if (!Number.isInteger(x)) {
    out = x.toFixed(x<10 ? 1 : 0);
  } else {
    out = x;
  }
  const s = out.toString();
  const displayNumber = s.replace('.', ',');
  return displayNumber.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

const EmissionsCard = (props) => {
  const { date, unit, sector, subSectors, state, hovered, onHover, handleClick, active, color } = props;

  const baseEmissions = sector.metric.historicalValues[0];
  const goalEmissions = sector.metric.forecastValues.find((dataPoint) => dataPoint.year === date)
    || sector.metric.historicalValues.find((dataPoint) => dataPoint.year === date);
  const change =  baseEmissions.value !== 0 ? -Math.round(((baseEmissions.value-goalEmissions?.value)/baseEmissions.value)*100) : undefined;

  const displayEmissions = goalEmissions?.value.toFixed(1);
  if (!goalEmissions) return null;

  return (
    <DashCard
      state={state}
      hovered={hovered}
      active={active}
      color={color}
    >
      <Header className={state}>
        <Title color={color}>
          <CardAnchor
            onMouseEnter={() => onHover(sector.id)}
            onMouseLeave={() => onHover(undefined)}
            onClick={() => handleClick(active ? undefined : sector.id)}
          >
            <Name>{sector.name}</Name>
          </CardAnchor>
        </Title>
      </Header>
      <Body>
        <div />
        <MainValue>
          {beautifyValue(goalEmissions?.value)}
          <MainUnit>{unit}</MainUnit>
          <Status>
            {change > 0 && '+'}
            {change ? `${change}%` : '-'}
          </Status>
        </MainValue>
      </Body>
    </DashCard>
  );
};

export default EmissionsCard;
