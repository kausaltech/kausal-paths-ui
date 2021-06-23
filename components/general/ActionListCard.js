import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import * as Icon from 'react-bootstrap-icons';
import styled from 'styled-components';
import { summarizeYearlyValuesBetween, beautifyValue } from 'common/preprocess';
import DashCard from 'components/general/DashCard';
import ActionParameters from 'components/general/ActionParameters';
import HighlightValue from 'components/general/HighlightValue';

const ActionItem = styled.li`
  margin-bottom: 1.5rem;
  color: ${(props) => (props.isActive ? props.theme.graphColors.grey090 : props.theme.graphColors.grey050)};

  h5 {
    color: ${(props) => (props.isActive ? props.theme.graphColors.grey090 : props.theme.graphColors.grey050)};
  }

  .card {
    background-color: ${(props) => (props.isActive ? props.theme.themeColors.white : props.theme.graphColors.grey005)};
  }
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: flex-start;
  align-items: flex-start;
  margin-bottom: 1rem;
  border-bottom: 1px solid ${(props) => props.theme.graphColors.grey030};
`;

const TextContent = styled.div`
  margin-right: 2rem;
`;

const CardContent = styled.div`
  padding: .5rem;
`;

const CardDetails = styled.div`
  display: flex;
  justify-content: space-between;
`;

const ActionState = styled.div`
  
`;

const ActionListCard = (props) => {
  const { action, displayType, displayYears } = props;
  const { t } = useTranslation();

  let unit = `kt CO<sub>2</sub>e${t('abbr-per-annum')}`;
  let actionEffect = 0;
  let effectHeader = `${t('action-impact')} ${displayYears[0]} - ${displayYears[1]}`;

  if (displayType === 'displayTypeYearly') {
    actionEffect = beautifyValue(action.impactMetric.forecastValues.find(
      (dataPoint) => dataPoint.year === displayYears[1],
    )?.value || 0);
  }

  if (displayType === 'displayTypeCumulative') {
    actionEffect = beautifyValue(summarizeYearlyValuesBetween(action.impactMetric, displayYears[0], displayYears[1]));
    unit = 'kt CO<sub>2</sub>e';
    effectHeader = `${t('total-effect-until')} ${displayYears[0]} - ${displayYears[1]}`;
  }

  return (
    <ActionItem
      key={action.id}
      isActive={action.parameters.find((param) => param.__typename == 'BoolParameterType')?.boolValue}
    >
      <DashCard>
        <CardContent>
          <CardHeader>
            <Link href={`/actions/${action.id}`}>
              <a>
                <h5>
                  {action.name}
                </h5>
              </a>
            </Link>
          </CardHeader>
          <CardDetails>
            <div>
              {action.shortDescription && (
              <TextContent dangerouslySetInnerHTML={{ __html: action.shortDescription }} />
              )}
              <ActionState>
                <ActionParameters
                  parameters={action.parameters}
                />
              </ActionState>
            </div>
            {action.impactMetric && (
              <HighlightValue
                displayValue={actionEffect}
                header={effectHeader}
                unit={unit}
              />
            )}
          </CardDetails>
        </CardContent>
      </DashCard>
    </ActionItem>
  );
};

// cumulative impact: displayValue={beautifyValue(summarizeYearlyValues(action.impactMetric.forecastValues))}

export default ActionListCard;
