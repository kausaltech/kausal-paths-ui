import { useEffect } from 'react';
import { gql, useQuery, useReactiveVar } from '@apollo/client';
import _ from 'lodash';
import styled, { useTheme } from 'styled-components';
import { Spinner } from 'reactstrap';
import { beautifyValue, getMetricValue } from 'common/preprocess';
import { activeScenarioVar, settingsVar, yearRangeVar } from 'common/cache';
import { useTranslation } from 'next-i18next';
import { GetNetEmissionsQuery } from 'common/__generated__/graphql';

const GET_NET_EMISSIONS = gql`
query GetNetEmissions($node: ID!) {
  node(id: $node) {
    id
    name
    goals {
      year
      value
    }
    metric {
      id
      unit {
        htmlShort
      }
      historicalValues {
        year
        value
      }
      forecastValues {
        year
        value
      }
    }
  }
}
`;

const EmissionsBar = styled.div`
  position: relative;
  background-color: ${(props) => props.theme.themeColors.white};
  margin: 24px 0;
  margin-left: auto;
  max-width: 500px;
  height: 24px;
`;

const BarLabel = styled.div<{side?: 'top' | undefined}>`
  font-size: 0.75rem;
  text-align: left;
  white-space: nowrap;
  line-height: 1;
  z-index: 1001;
  position: absolute;
  padding: ${(props) => (props.side === 'top' ? '0 5px 24px 5px' : '24px 5px 0 5px')};
  bottom: ${(props) => (props.side === 'top' ? '0' : '-32px')};
  left: -2px;
  border-left: 2px solid ${(props) => props.theme.graphColors.grey070};
`;

const Value = styled.div`
  font-size: 1rem;
  font-weight: 700;
`;

const Unit = styled.span`
  font-size: 0.75rem;
`;

const EmissionBar = styled.div<{barWidth: number, barColor: string}>`
  position: absolute;
  top: 0;
  right: 0;
  height: 24px;
  width: ${(props) => props.barWidth}%;
  background-color: ${(props) => props.barColor};
  border: 2px solid ${(props) => props.theme.themeColors.white};
`;

const BarWithLabel = (props) => {
  const { label, value, unit, barWidth, barColor, labelSide } = props;

  return (
    <EmissionBar barWidth={barWidth} barColor={barColor}>
      <BarLabel side={labelSide}>
        {label}
        <Value>
          { beautifyValue(value) }
          {' '}
          <Unit dangerouslySetInnerHTML={{ __html: unit }} />
        </Value>

      </BarLabel>
    </EmissionBar>
  );
};

const TotalEmissionsBar = (props) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const targetYear = settingsVar().maxYear;
  const activeScenario = useReactiveVar(activeScenarioVar);
  const yearRange = useReactiveVar(yearRangeVar);

  const { loading, error, data, refetch } = useQuery<GetNetEmissionsQuery>(GET_NET_EMISSIONS, {
    variables: {
      node: 'net_emissions',
    },
  });

  useEffect(() => {
    refetch();
  }, [activeScenario]);

  if (loading) return <span><Spinner size="sm" color="primary" /></span>;
  if (error) return <div>error!</div>;
  if (!data || !data.node || !data.node.metric) return <div>no data</div>
  const { node } = data;
  const metric = node.metric!;

  const unit = metric.unit?.htmlShort;
  const emissionsNow = metric.historicalValues[metric.historicalValues.length - 1].value;
  const emissionsNowYear = metric.historicalValues[metric.historicalValues.length - 1].year;
  const lastGoal = [...node.goals].sort(g => g.year).slice(-1)[0];
  const emissionsTotal = getMetricValue(node, yearRange[1])!;

  const emissionsTarget = lastGoal.value;
  const maxEmission = _.max([emissionsNow, emissionsTotal, emissionsTarget])!;
  const emissionsTotalColor = emissionsTotal > emissionsTarget ? theme.graphColors.red050 : theme.graphColors.green070;
  const emissionsNowWidth = (emissionsNow / maxEmission) * 100;
  const emissionsTotalWidth = (emissionsTotal / maxEmission) * 100;
  const emissionsTargetWidth = (emissionsTarget / maxEmission) * 100;

  const bars = _.sortBy([
    {
      label: `${t('emissions')} ${emissionsNowYear}`,
      value: emissionsNow,
      unit,
      barColor: theme.graphColors.grey030,
      barWidth: emissionsNowWidth,
      labelSide: undefined,
    },
    {
      label: `${t('scenario')} ${yearRange[1]}`,
      value: emissionsTotal,
      unit,
      barColor: emissionsTotalColor,
      barWidth: emissionsTotalWidth,
      labelSide: 'top',
    },
    {
      label: `${t('target')} ${lastGoal.year}`,
      value: emissionsTarget,
      unit,
      barColor: theme.graphColors.green030,
      barWidth: emissionsTargetWidth,
      labelSide: undefined,
    },
  ], [(bar) => -bar.value]);

  return (
    <div>
      <EmissionsBar>
        { bars.map((bar) => (
          <BarWithLabel
            {...bar}
            key={bar.label}
          />
        ))}
      </EmissionsBar>
    </div>
  );
};

export default TotalEmissionsBar;
