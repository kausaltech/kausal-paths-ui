import { useTranslation } from 'next-i18next';
import styled from 'styled-components';
import { ActionLink } from 'common/links';
import { Spinner } from 'reactstrap';
import {
  findActionEnabledParam,
  summarizeYearlyValuesBetween,
} from 'common/preprocess';
import ActionParameters from 'components/general/ActionParameters';
import ImpactDisplay from 'components/general/ImpactDisplay';
import Badge from 'components/common/Badge';
import EfficiencyDisplay from 'components/general/EfficiencyDisplay';
import { ActionWithEfficiency } from 'components/pages/ActionListPage';
import Icon from 'components/common/icon';

const ActionItem = styled.div<{ $isActive: boolean; color?: string }>`
  position: relative;
  margin-bottom: 0.5rem;
  color: ${({ $isActive, theme }) =>
    $isActive ? theme.textColor.secondary : theme.textColor.tertiary};
  padding: 1rem;
  background-color: ${({ $isActive, theme }) =>
    $isActive ? theme.cardBackground.primary : theme.cardBackground.secondary};
  box-shadow: 3px 3px 12px rgba(33, 33, 33, 0.15);
  border-left: 6px solid
    ${(props) =>
      props.color !== 'undefined'
        ? props.color
        : props.theme.graphColors.grey090};

  h5,
  a {
    color: ${({ $isActive, theme }) =>
      $isActive ? theme.textColor.primary : theme.textColor.tertiary};
  }
`;

const LoadingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.4);
  z-index: 1;
`;

const CardHeader = styled.div`
  margin-bottom: 1rem;
  border-bottom: 1px solid ${(props) => props.theme.graphColors.grey030};
`;

const ActionCategory = styled.div`
  margin-bottom: 0.5rem;
`;

const TextContent = styled.div`
  margin: 1rem 0;
`;

const CardContent = styled.div`
  display: flex;
  flex-direction: column;
`;

const CardDetails = styled.div`
  max-width: 720px;
  margin: ${(props) => props.theme.spaces.s100} auto 0 auto;
  font-size: 80%;
`;

const ActionState = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
`;

const GroupTag = styled.div<{ color?: string }>`
  font-size: 80%;
  color: ${(props) => props.theme.themeColors.dark};
`;

const StyledIconWrapper = styled.div`
  font-size: 0;
  transition: transform 0.1s;
`;

const StyledActionLink = styled.a`
  display: flex;
  gap: ${({ theme }) => theme.spaces.s050};
  align-items: center;
  justify-content: space-between;

  &:hover {
    ${StyledIconWrapper} {
      transform: translateX(4px);
    }
  }
`;

const StyledActionTitle = styled.h5`
  margin-bottom: 0;
`;

type ActionListCardProps = {
  action: ActionWithEfficiency;
  displayType: string;
  displayYears: [number, number];
  refetching: boolean;
};

const ActionListCard = (props: ActionListCardProps) => {
  const { action, displayType, displayYears, refetching } = props;
  const { t } = useTranslation();

  // const unitYearly = `kt CO<sub>2</sub>e${t('abbr-per-annum')}`;
  const unitYearly = `${action.impactMetric.unit?.htmlShort}`;

  //const actionEffectCumulative = action.impactMetric.cumulativeForecastValue;
  const actionEffectCumulative = summarizeYearlyValuesBetween(
    action.impactMetric,
    displayYears[0],
    displayYears[1]
  );

  // const unitCumulative = 'kt CO<sub>2</sub>e';
  const unitCumulative = action.impactMetric.yearlyCumulativeUnit?.htmlShort;

  const enabledParam = findActionEnabledParam(action.parameters);
  const isActive = !refetching && (enabledParam?.boolValue ?? false);

  const hasEfficiency = 'cumulativeEfficiency' in action;

  /* Remove html formatting and clip description to max length */
  const originalLength = action?.shortDescription?.length ?? 0;
  const removeHtml = /(<([^>]+)>)/gi;
  let clippedDescription = action?.shortDescription
    ? action.shortDescription.replace(removeHtml, '').slice(0, 120)
    : '';
  if (originalLength > clippedDescription.length) {
    clippedDescription += '...';
  }

  return (
    <ActionItem
      key={action.id}
      $isActive={isActive}
      color={action.group?.color ?? 'undefined'}
    >
      {refetching && (
        <LoadingOverlay>
          <Spinner size="sm" color="primary" />
        </LoadingOverlay>
      )}
      <CardHeader>
        {action.group && (
          <GroupTag color={action.group.color ?? undefined}>
            {action.group.name}
          </GroupTag>
        )}
        <ActionLink action={action}>
          <StyledActionLink>
            <StyledActionTitle>{action.name}</StyledActionTitle>
            <StyledIconWrapper>
              <Icon width="20px" height="20px" name="arrowRight" />
            </StyledIconWrapper>
          </StyledActionLink>
        </ActionLink>
        <ActionCategory>
          {action.decisionLevel === 'NATION' && (
            <Badge color="neutralLight">{t('decision-national')}</Badge>
          )}
        </ActionCategory>
      </CardHeader>
      <CardContent>
        <ActionState>
          <ActionParameters parameters={action.parameters} />
          {action.impactMetric && !hasEfficiency && (
            <ImpactDisplay
              effectCumulative={actionEffectCumulative}
              effectYearly={action.impactOnTargetYear}
              yearRange={displayYears}
              unitCumulative={unitCumulative}
              unitYearly={unitYearly}
              muted={!isActive}
            />
          )}
          {hasEfficiency && (
            <EfficiencyDisplay
              impactCumulative={action.cumulativeImpact}
              impactCumulativeUnit={action.cumulativeImpactUnit}
              impactCumulativeLabel={action.cumulativeImpactName}
              costCumulative={action.cumulativeCost}
              costCumulativeUnit={action.cumulativeCostUnit}
              costCumulativeLabel={action.cumulativeCostName}
              efficiencyCumulative={action.cumulativeEfficiency}
              efficiencyCumulativeUnit={action.cumulativeEfficiencyUnit}
              efficiencyCumulativeLabel={action.cumulativeEfficiencyName}
              efficiencyCap={action.efficiencyCap}
              yearRange={displayYears}
              muted={!isActive}
            />
          )}
        </ActionState>
        <CardDetails>{clippedDescription}</CardDetails>
      </CardContent>
    </ActionItem>
  );
};

// cumulative impact: displayValue={beautifyValue(summarizeYearlyValues(action.impactMetric.forecastValues))}

export default ActionListCard;
