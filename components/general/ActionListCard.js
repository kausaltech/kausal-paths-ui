import { useTranslation } from 'next-i18next';
import styled from 'styled-components';
import { ActionLink } from 'common/links';
import { summarizeYearlyValuesBetween } from 'common/preprocess';
import DashCard from 'components/general/DashCard';
import ActionParameters from 'components/general/ActionParameters';
import ImpactDisplay from 'components/general/ImpactDisplay';
import Badge from 'components/common/Badge';
import EfficiencyDisplay from 'components/general/EfficiencyDisplay';

const ActionItem = styled.li`
  margin-bottom: 1.5rem;
  color: ${(props) => (props.isActive ? props.theme.graphColors.grey090 : props.theme.graphColors.grey050)};

  h5 {
    color: ${(props) => (props.isActive ? props.theme.graphColors.grey090 : props.theme.graphColors.grey050)};
  }

  .card {
    background-color: ${(props) => (props.isActive ? props.theme.themeColors.white : props.theme.graphColors.grey005)};
    box-shadow: 3px 3px 12px rgba(33,33,33,0.15);
  }
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: flex-start;
  align-items: flex-start;
  margin-bottom: 1rem;
  border-bottom: 1px solid ${(props) => props.theme.graphColors.grey030};
`;

const ActionCategory = styled.div`
  flex: 1;
  margin-bottom: .5rem;
  text-align: right;
`;

const TextContent = styled.div`
  margin: 1rem 0;
`;

const CardContent = styled.div`
  display: flex;
  flex-direction: column;
  padding: .5rem;
`;

const CardDetails = styled.div`
  max-width: 720px;
`;

const ActionState = styled.div`
  display: flex;
  justify-content: space-between;
`;

const GroupTag = styled.div`
  font-size: 80%;
  color: ${(props) => props.color};
`;

const ActionListCard = (props) => {
  const { action, displayType, displayYears, level } = props;
  const { t } = useTranslation();

  console.log('ActionListCard', action);
  // const unitYearly = `kt CO<sub>2</sub>e${t('abbr-per-annum')}`;
  const unitYearly = `${action.impactMetric.unit?.htmlShort}`;
  const actionEffectYearly = action.impactMetric.forecastValues.find(
    (dataPoint) => dataPoint.year === displayYears[1],
  )?.value || 0;

  const actionEffectCumulative = action.impactMetric.cumulativeForecastValue;
  // const unitCumulative = 'kt CO<sub>2</sub>e';
  const unitCumulative = action.impactMetric.yearlyCumulativeUnit?.htmlShort;

  const isActive = action.parameters.find((param) => param.id == `${param.node.id}.enabled`)?.boolValue;

  const hasEfficiency = action.cumulativeEfficiency;

  return (
    <ActionItem
      key={action.id}
      isActive={isActive}
    >
      <DashCard>
        <CardHeader>
          <ActionLink action={action}>
            <a>
              { action.group && (
                <GroupTag color={action.group.color}>{action.group.name}</GroupTag>
              )}
              <h5>
                {action.name}
              </h5>
            </a>
          </ActionLink>
          { level === 'NATION' && (
            <ActionCategory>
              <Badge
                color="neutralLight"
              >
                { t('decision-national') }
              </Badge>
            </ActionCategory> 
          )}
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
      </DashCard>
    </ActionItem>
  );
};

// cumulative impact: displayValue={beautifyValue(summarizeYearlyValues(action.impactMetric.forecastValues))}

export default ActionListCard;
