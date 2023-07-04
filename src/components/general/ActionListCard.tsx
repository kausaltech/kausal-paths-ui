import { useTranslation } from 'next-i18next';
import styled from 'styled-components';
import { ActionLink } from 'common/links';
import { Spinner } from 'reactstrap';
import { summarizeYearlyValuesBetween } from 'common/preprocess';
import DashCard from 'components/general/DashCard';
import ActionParameters from 'components/general/ActionParameters';
import ImpactDisplay from 'components/general/ImpactDisplay';
import Badge from 'components/common/Badge';
import EfficiencyDisplay from 'components/general/EfficiencyDisplay';
import { ActionWithEfficiency } from 'components/pages/ActionListPage';

const ActionItem = styled.li<{isActive: boolean}>`
  position: relative;
  margin-bottom: .5rem;
  color: ${(props) => (props.isActive ? props.theme.graphColors.grey090 : props.theme.graphColors.grey050)};

  h5 {
    color: ${(props) => (props.isActive ? props.theme.graphColors.grey090 : props.theme.graphColors.grey050)};
  }
`;

const ActionCard = styled.div`
  padding: 1rem;
  background-color: ${(props) => (props.isActive ? props.theme.themeColors.white : props.theme.graphColors.grey005)};
  box-shadow: 3px 3px 12px rgba(33,33,33,0.15);
  border-left: 6px solid ${(props) => props.color !== 'undefined' ? props.color : props.theme.graphColors.grey070};
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
  background-color: rgba(255,255,255,0.4);
  z-index: 1;
`;

const CardHeader = styled.div`
  margin-bottom: 1rem;
  border-bottom: 1px solid ${(props) => props.theme.graphColors.grey030};
`;

const ActionCategory = styled.div`
  margin-bottom: .5rem;
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
  font-size: 80%;
`;

const ActionState = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
`;

const GroupTag = styled.div<{color?: string}>`
  font-size: 80%;
  color: ${(props) => props.theme.themeColors.dark};
`;

type ActionListCardProps = {
  action: ActionWithEfficiency,
  displayType: string,
  displayYears: [number, number],
  refetching: boolean,
}

const ActionListCard = (props: ActionListCardProps) => {
  const { action, displayType, displayYears, refetching } = props;
  const { t } = useTranslation();

  // console.log('ActionListCard', action);
  // const unitYearly = `kt CO<sub>2</sub>e${t('abbr-per-annum')}`;
  const unitYearly = `${action.impactMetric.unit?.htmlShort}`;
  const actionEffectYearly = action.impactMetric.forecastValues.find(
    (dataPoint) => dataPoint.year === displayYears[1],
  )?.value || 0;

  //const actionEffectCumulative = action.impactMetric.cumulativeForecastValue;
  const actionEffectCumulative = summarizeYearlyValuesBetween(action.impactMetric, displayYears[0], displayYears[1]);
  
  // const unitCumulative = 'kt CO<sub>2</sub>e';
  const unitCumulative = action.impactMetric.yearlyCumulativeUnit?.htmlShort;

  const isActive = !refetching && action.parameters.find((param) => param.id == `${param.node.id}.enabled`)?.boolValue;

  const hasEfficiency = 'cumulativeEfficiency' in action;

  return (
    <ActionItem
      key={action.id}
      isActive={isActive}
    >
      { refetching && <LoadingOverlay><Spinner size="sm" color="primary" /></LoadingOverlay> }
      <ActionCard
        color={action.group?.color ?? 'undefined'}
      >
        <CardHeader>
          <ActionLink action={action}>
            <a>
              { action.group && (
                <GroupTag color={action.group.color ?? undefined}>{action.group.name}</GroupTag>
              )}
              <h5>
                {action.name}
              </h5>
            </a>
          </ActionLink>
          <ActionCategory>
            { action.decisionLevel === 'NATION' && (
                <Badge
                  color="neutralLight"
                >
                  { t('decision-national') }
                </Badge>
            )}
          </ActionCategory>
        </CardHeader>
        <CardContent>
          <ActionState>
            <ActionParameters
              parameters={action.parameters}
            />
            {(action.impactMetric && !hasEfficiency) && (
              <ImpactDisplay
                effectCumulative={actionEffectCumulative}
                effectYearly={actionEffectYearly}
                yearRange={displayYears}
                unitCumulative={unitCumulative}
                unitYearly={unitYearly}
                muted={!isActive}
              />
            )}
            { hasEfficiency && (
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
          <CardDetails>
            <div>
              {action.shortDescription && (
              <TextContent dangerouslySetInnerHTML={{ __html: action.shortDescription }} />
              )}
            </div>
          </CardDetails>
        </CardContent>
      </ActionCard>
    </ActionItem>
  );
};

// cumulative impact: displayValue={beautifyValue(summarizeYearlyValues(action.impactMetric.forecastValues))}

export default ActionListCard;
