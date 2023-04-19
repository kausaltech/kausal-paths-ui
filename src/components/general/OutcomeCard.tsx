import { useRef, useEffect } from 'react';
import { useTranslation } from 'next-i18next';
import DashCard from 'components/general/DashCard';
import styled from 'styled-components';
import { beautifyValue, getMetricChange, getMetricValue } from 'common/preprocess';
import { OutcomeNodeFieldsFragment } from 'common/__generated__/graphql';

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
  text-align: left;
  font-size: 1.5rem;
  line-height: 1.2;
  font-weight: 700;
`;

const Label = styled.div`
  font-size: 0.8rem;
  font-weight: 700;
  color: ${(props) => props.theme.graphColors.grey050};
`;

const MainUnit = styled.span`
  margin-left: 0.25rem;
  font-size: 0.6rem;
`;

type OutcomeCardProps = {
  node: OutcomeNodeFieldsFragment,
  startYear: number,
  endYear: number,
  //subNodes: OutcomeNodeFieldsFragment[],
  state: 'open' | 'closed',
  hovered: boolean,
  active: boolean,
  onHover: (evt) => void,
  handleClick: (segmentId: string) => void,
  color: string,

}

const OutcomeCard = (props: OutcomeCardProps) => {
  const { node, state, hovered, onHover, handleClick, active, color, startYear, endYear } = props;

  const cardRef = useRef(null);
  useEffect(() => {
    if (active && cardRef.current) cardRef.current.scrollIntoView({ inline: "center"});
  }, [active]);

  //console.log(state);
  const { t } = useTranslation();
  const baseOutcomeValue = getMetricValue(node, startYear) || 0;
  const goalOutcomeValue = getMetricValue(node, endYear);
  const change = getMetricChange(baseOutcomeValue, goalOutcomeValue);

  // const unit = `kt CO<sub>2</sub>e${t('abbr-per-annum')}`;
  const unit = node.metric?.unit?.htmlShort;
  // If there is no outcome  value for active year, do not display card set
  if (goalOutcomeValue === undefined) return null;

  return (
    <DashCard
      state={state}
      hovered={hovered}
      active={active}
      color={color}
      refProp={cardRef}
    >
      <Header className={state}>
        <Title color={color}>
          <CardAnchor
            onMouseEnter={() => onHover(node.id)}
            onMouseLeave={() => onHover(undefined)}
            onClick={() => handleClick(node.id)}
          >
            <Name>{node.shortName || node.name}</Name>
          </CardAnchor>
        </Title>
      </Header>
      { !active && (
      <Body>
        <div />
        <MainValue>
          <Label>Total {endYear}</Label>
          {beautifyValue(goalOutcomeValue)}
          <MainUnit dangerouslySetInnerHTML={{ __html: unit || '' }} />
          { change && (
            <Status>
              <Label>Change {startYear} - {endYear}:</Label>
              {change > 0 && <span>+</span>}
              {change ? <span>{`${change}%`}</span> : <span>-</span>}
            </Status>
          )}
        </MainValue>
      </Body>
      )}
    </DashCard>
  );
};

export default OutcomeCard;
