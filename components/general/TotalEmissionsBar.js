import { useEffect } from 'react';
import { gql, useQuery, useReactiveVar } from '@apollo/client';
import styled from 'styled-components';
import { beautifyValue, getMetricValue } from 'common/preprocess';
import { activeScenarioVar, settingsVar, yearRangeVar } from 'common/cache';
import { useTranslation } from 'react-i18next';

const GET_NET_EMISSIONS = gql`
query GetNodePage($node: ID!) {
  node(id: $node) {
    id
    name
    targetYearGoal
    metric {
      id
      historicalValues {
        year
        value
      }
      forecastValues {
        year
        value
      }
      baselineForecastValues {
        year
        value
      }
    }
  }
}
`;

const EmissionsBar = styled.div`
  position: relative;
  margin-top: 0.5rem;
  margin-left: auto;
  height: 1.5rem;
  width: 360px;
`;

const BarValue = styled.div`
  text-align: left;
  font-size: 0.75rem;
  line-height: 1;
  z-index: 1000;
  position: absolute;
  bottom: -2rem;
  border-left: 1px solid ${(props) => props.theme.graphColors.grey020};
  padding-left: 0.25rem; 
`;

const BarLabel = styled.div`
  font-size: 0.75rem;
  line-height: 1;
  z-index: 1001;
  position: absolute;
  top: -1rem;
`;

const Value = styled.div`
  font-size: 1rem;
  font-weight: 700;
`;

const Unit = styled.div`
  font-size: 0.75rem;
`;

const TotalBar = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  height: 1.5rem;
  width: ${(props) => props.barWidth}%;
  background-color: ${(props) => props.theme.graphColors.red050};
  border: 1px solid ${(props) => props.theme.themeColors.white};
`;
const TargetBar = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  height: 1.5rem;
  width: ${(props) => props.barWidth}%;
  background-color: ${(props) => props.theme.graphColors.green030};
  border: 1px solid ${(props) => props.theme.themeColors.white};
`;
const NowBar = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  height: 1.5rem;
  width: ${(props) => props.barWidth}%;
  background-color: ${(props) => props.theme.graphColors.grey020};
  border: 1px solid ${(props) => props.theme.themeColors.white};
`;

const TotalEmissionsBar = (props) => {
  const { t } = useTranslation();
  const targetYear = settingsVar().maxYear;
  const activeScenario = useReactiveVar(activeScenarioVar);
  const yearRange = useReactiveVar(yearRangeVar);

  const emissionsBase = 0;

  const { loading, error, data, refetch } = useQuery(GET_NET_EMISSIONS, {
    variables: {
      node: 'net_emissions',
    },
  });

  useEffect(() => {
    refetch();
  }, [activeScenario]);

  if (loading) return <div>loading...</div>;
  if (error) return <div>error!</div>;

  const unit = `kt${t('abbr-per-annum')}`;
  const emissionsNow = data.node.metric.historicalValues[data.node.metric.historicalValues.length - 1].value;
  const emissionsNowYear = data.node.metric.historicalValues[data.node.metric.historicalValues.length - 1].year;
  const emissionsTotal = getMetricValue(data.node, yearRange[1]);
  const emissionsTarget = data.node.targetYearGoal;

  const emissionsNowWidth = 100;
  const emissionsTotalWidth = (emissionsTotal / emissionsNow) * 100;
  const emissionsTargetWidth = (emissionsTarget / emissionsNow) * 100;

  return (
    <div>
      <EmissionsBar>
        <NowBar barWidth={emissionsNowWidth}>
          <BarLabel>
            {`${t('emissions')} ${emissionsNowYear}`}
          </BarLabel>
          <BarValue>
            <Value>{ beautifyValue(emissionsNow) }</Value>
            <Unit dangerouslySetInnerHTML={{ __html: unit }} />
          </BarValue>
        </NowBar>
        <TotalBar barWidth={emissionsTotalWidth}>
          <BarLabel>
            {yearRange[1]}
          </BarLabel>
          <BarValue>
            <Value>{ beautifyValue(emissionsTotal) }</Value>
            <Unit dangerouslySetInnerHTML={{ __html: unit }} />
          </BarValue>
        </TotalBar>
        <TargetBar barWidth={emissionsTargetWidth}>
          <BarLabel>
            {`${t('target')} ${targetYear}`}
          </BarLabel>
          <BarValue>
            <Value>{ beautifyValue(emissionsTarget) }</Value>
            <Unit dangerouslySetInnerHTML={{ __html: unit }} />
          </BarValue>
        </TargetBar>
      </EmissionsBar>
    </div>
  );
};

export default TotalEmissionsBar;
