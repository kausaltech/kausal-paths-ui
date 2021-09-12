import { useTranslation } from 'react-i18next';
import DashCard from 'components/general/DashCard';
import styled from 'styled-components';
import { beautifyValue, getMetricChange, getMetricValue } from 'common/preprocess';

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

const Status = styled.div`
  margin-top: .5rem;
  text-align: right;
  white-space: nowrap;
  font-size: 1rem;
  font-weight: 700;
  color: ${(props) => props.theme.graphColors.grey050};
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
  font-size: 0.6rem;
`;

const EmissionsCard = (props) => {
  const { sector, state, hovered, onHover, handleClick, active, color, startYear, endYear } = props;

  const { t } = useTranslation();
  const baseEmissionsValue = getMetricValue(sector.node, startYear);
  const goalEmissionsValue = getMetricValue(sector.node, endYear);
  const change = getMetricChange(baseEmissionsValue, goalEmissionsValue);

  const unit = `kt CO<sub>2</sub>e${t('abbr-per-annum')}`;
  // If there is on emission value for active year, do not display card set
  if (!goalEmissionsValue) return null;

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
            onClick={() => handleClick(sector.id)}
          >
            <Name>{sector.name}</Name>
          </CardAnchor>
        </Title>
      </Header>
      <Body>
        <div />
        <MainValue>
          {beautifyValue(goalEmissionsValue)}
          <MainUnit dangerouslySetInnerHTML={{ __html: unit }} />
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
