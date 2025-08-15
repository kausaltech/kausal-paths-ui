import { useEffect, useRef } from 'react';

import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import Chip from '@mui/material/Chip';
import { useTranslation } from 'next-i18next';

import type { OutcomeNodeFieldsFragment } from '@/common/__generated__/graphql';
import { useFeatures } from '@/common/instance';
import { beautifyValue, getMetricChange, getMetricValue } from '@/common/preprocess';
import Loader from '@/components/common/Loader';
import PopoverTip from '@/components/common/PopoverTip';

import DashCard from './DashCard';
import { getHelpText } from './progress-tracking/utils';

const StyledTab = styled.div`
  flex: 0 0 175px;
  cursor: pointer;
`;

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
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const Name = styled.h2`
  margin-bottom: 0;
  font-size: 1rem;
`;

const Status = styled.div<{ $active: boolean | undefined }>`
  font-size: ${({ theme }) => theme.fontSizeSm};
  color: ${({ theme, $active }) => ($active ? theme.textColor.primary : theme.textColor.tertiary)};
  line-height: 1.2;
  white-space: nowrap;
`;

const Body = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-top: 0.5rem;
`;

const MainValueWrapper = styled.div`
  text-align: left;
`;

const TotalValue = styled.div`
  font-size: 1.5rem;
  line-height: 1.2;
  font-weight: 700;
  margin-bottom: 0.25rem;
`;

const NoValue = styled.div`
  text-align: left;
  font-weight: 700;
  color: ${({ theme }) => theme.graphColors.grey030};
  &:before {
    content: '—';
  }
`;

const Label = styled.div<{ $active?: boolean }>`
  font-size: ${({ theme }) => theme.fontSizeSm};
  line-height: 1.2;
  color: ${({ theme, $active }) => ($active ? theme.textColor.primary : theme.textColor.tertiary)};
`;

const MainUnit = styled.span`
  margin-left: 0.25rem;
  font-size: 0.6rem;
`;

// bottom: ${(props) => props.$size > 0 ? props.offset * 100 : 0}%;
const ProportionBarBar = styled.div<{ $size: number; $color: string }>`
  position: absolute;
  bottom: 0;
  //bottom: 0;
  top: ${(props) => (props.$size > 0 ? 'auto' : '0')}%;
  left: 0;
  height: ${(props) => Math.abs(props.$size) * 100}%;
  width: 12px;
  background-color: ${(props) => props.$color};
`;

const ProportionBarContainer = styled.div<{ $active: boolean }>`
  position: absolute;
  height: 100%;
  bottom: 0;
  left: 0;
  width: 12px;
  background-color: ${({ theme, $active }) =>
    $active ? theme.graphColors.grey005 : theme.graphColors.grey030};
`;

const ProportionBar = ({
  size,
  color,
  active,
  isOpen,
}: {
  size: number;
  color: string;
  active: boolean;
  isOpen: boolean;
  offset?: number;
}) => {
  return (
    <ProportionBarContainer $active={active || !isOpen}>
      <ProportionBarBar $size={size} $color={color} />
    </ProportionBarContainer>
  );
};

const ChangeValue = ({ change }: { change: number | undefined }) => {
  const theme = useTheme();
  const chipColor = change
    ? change > 0
      ? theme.graphColors.red010
      : theme.graphColors.green010
    : theme.graphColors.grey010;

  const changeDisplay = change !== undefined ? (change > 0 ? `+${change}%` : `${change}%`) : '-';

  return (
    <Chip
      label={changeDisplay}
      size="small"
      variant="outlined"
      sx={{ backgroundColor: chipColor, borderColor: chipColor }}
    />
  );
};

type SectorSummaryProps = {
  active: boolean;
  isForecast: boolean;
  goalOutcomeValue: number;
  maximumFractionDigits: number | null;
  unit: string | undefined;
  change: number | undefined;
  startYear: number;
  endYear: number;
};

export const SectorSummary = ({
  active,
  isForecast,
  goalOutcomeValue,
  maximumFractionDigits,
  unit,
  change,
  startYear,
  endYear,
}: SectorSummaryProps) => {
  const { t } = useTranslation();
  return (
    <MainValueWrapper>
      <Label $active={active}>
        {isForecast ? t('table-scenario-forecast') : t('table-historical')}
      </Label>
      {goalOutcomeValue !== undefined ? (
        <TotalValue>
          {beautifyValue(goalOutcomeValue, undefined, maximumFractionDigits ?? undefined)}
          <MainUnit dangerouslySetInnerHTML={{ __html: unit || '' }} />
        </TotalValue>
      ) : (
        <NoValue />
      )}
      {change !== undefined && (
        <Status $active={active}>
          <ChangeValue change={change} /> ({startYear} - {endYear})
        </Status>
      )}
    </MainValueWrapper>
  );
};
type OutcomeCardProps = {
  node: OutcomeNodeFieldsFragment;
  startYear: number;
  endYear: number;
  //subNodes: OutcomeNodeFieldsFragment[],
  state: 'open' | 'closed';
  hovered: boolean;
  active: boolean;
  onHover: (evt: string | undefined) => void;
  handleClick: ((segmentId: string) => void) | undefined;
  color: string;
  positiveTotal?: number;
  negativeTotal?: number;
  refetching: boolean;
};

const OutcomeCard = (props: OutcomeCardProps) => {
  const {
    node,
    state,
    hovered,
    onHover,
    handleClick,
    active,
    color,
    startYear,
    endYear,
    negativeTotal,
    positiveTotal,
    refetching,
  } = props;

  const cardRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (active && cardRef.current)
      cardRef.current.scrollIntoView({
        inline: 'center',
        behavior: 'smooth',
        block: 'nearest',
      });
  }, [active]);

  const isCompared = positiveTotal !== undefined && negativeTotal !== undefined;
  const siblingsTotal = isCompared ? positiveTotal - negativeTotal : undefined;
  const baseOutcomeValue = node.metric
    ? getMetricValue({ metric: node.metric }, startYear) || 0
    : 0;
  const goalOutcomeValue = node.metric ? getMetricValue({ metric: node.metric }, endYear) || 0 : 0;
  const change = getMetricChange(baseOutcomeValue, goalOutcomeValue);

  const lastMeasuredYear =
    node?.metric?.historicalValues[node.metric.historicalValues.length - 1]?.year;
  const isForecast = !lastMeasuredYear || endYear > lastMeasuredYear;
  const { maximumFractionDigits, showRefreshPrompt } = useFeatures();

  // TODO: Remove the showRefreshPrompt check once help text is moved to node descriptions on the backend
  const helpText = showRefreshPrompt ? getHelpText(node.id) : undefined;

  const unit = node.metric?.unit?.htmlShort;

  const handleClickTab = () => handleClick && handleClick(node.id);

  const handleKeyDownOnTab = (e: React.KeyboardEvent) => {
    if (e.code === 'Enter' || e.code === 'Space') {
      e.preventDefault();
      if (handleClick !== undefined) handleClick(node.id);
    }
  };

  return (
    <StyledTab
      key={node.id}
      role="tab"
      tabIndex={0}
      onMouseEnter={() => onHover(node.id)}
      onMouseLeave={() => onHover(undefined)}
      onClick={handleClickTab}
      onKeyDown={handleKeyDownOnTab}
      aria-selected={active}
      aria-controls={`tabpanel-${node.id}`}
    >
      <DashCard
        state={state}
        hovered={hovered}
        active={active}
        color={color}
        refProp={cardRef}
        interactive={handleClick !== undefined}
      >
        {refetching && <Loader />}
        {isCompared && siblingsTotal && (
          <ProportionBar
            size={goalOutcomeValue ? goalOutcomeValue / siblingsTotal : 0}
            color={color}
            active={active}
            isOpen={state === 'open'}
            offset={negativeTotal < 0 ? Math.abs(negativeTotal / siblingsTotal) : 0}
          />
        )}
        <Header className={state}>
          <Title color={color}>
            <Name>{node.shortName || node.name}</Name>
          </Title>
          {helpText && <PopoverTip content={helpText} />}
        </Header>

        <Body>
          <SectorSummary
            active={active}
            isForecast={isForecast}
            goalOutcomeValue={goalOutcomeValue}
            maximumFractionDigits={maximumFractionDigits}
            unit={unit}
            change={change}
            startYear={startYear}
            endYear={endYear}
          />
        </Body>
      </DashCard>
    </StyledTab>
  );
};

export default OutcomeCard;
