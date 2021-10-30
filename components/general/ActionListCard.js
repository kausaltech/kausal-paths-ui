import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import styled from 'styled-components';
import { Badge } from 'reactstrap';
import { summarizeYearlyValuesBetween } from 'common/preprocess';
import DashCard from 'components/general/DashCard';
import ActionParameters from 'components/general/ActionParameters';
import ImpactDisplay from 'components/general/ImpactDisplay';

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

const ActionListCard = (props) => {
  const { action, displayType, displayYears, level } = props;
  const { t } = useTranslation();

  // const unitYearly = `kt CO<sub>2</sub>e${t('abbr-per-annum')}`;
  const unitYearly = `${action.impactMetric.unit?.htmlShort} ${t('abbr-per-annum')}`;
  const actionEffectYearly = action.impactMetric.forecastValues.find(
    (dataPoint) => dataPoint.year === displayYears[1],
  )?.value || 0;

  const actionEffectCumulative = summarizeYearlyValuesBetween(action.impactMetric, displayYears[0], displayYears[1]);
  // const unitCumulative = 'kt CO<sub>2</sub>e';
  const unitCumulative = action.impactMetric.unit?.htmlShort;

  const isActive = action.parameters.find((param) => param.id == `${param.node.id}.enabled`)?.boolValue;

  return (
    <ActionItem
      key={action.id}
      isActive={isActive}
    >
      <DashCard>
        <CardHeader>
          <Link href={`/actions/${action.id}`}>
            <a>
              <h5>
                {action.name}
              </h5>
            </a>
          </Link>
          { level === 'NATION' && <ActionCategory><Badge>{ t('decision-national') }</Badge></ActionCategory> }
        </CardHeader>
        <CardContent>
          <ActionState>
            <ActionParameters
              parameters={action.parameters}
            />
            {action.impactMetric && (
              <ImpactDisplay
                effectCumulative={actionEffectCumulative}
                effectYearly={actionEffectYearly}
                yearRange={displayYears}
                unitCumulative={unitCumulative}
                unitYearly={unitYearly}
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
