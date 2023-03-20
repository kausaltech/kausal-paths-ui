import { useEffect } from 'react';
import { gql, useQuery, useReactiveVar } from '@apollo/client';
import _ from 'lodash';
import styled, { useTheme } from 'styled-components';
import { Spinner } from 'reactstrap';
import { beautifyValue, getMetricValue } from 'common/preprocess';
import { activeScenarioVar, yearRangeVar } from 'common/cache';
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
  padding: ${(props) => (props.side === 'top' ? `0 5px ${12+(props.placement*7)}px 5px` : `${24-(props.placement*7)}px 5px 0 5px`)};
  bottom: ${(props) => (props.side === 'top' ? '0' : 'auto')};
  left: -1px;
  border-left: 1px solid ${(props) => props.theme.graphColors.grey070};
  font-weight: 700;
`;

const Value = styled.div`
  font-size: 0.9rem;
  font-weight: 400;
`;

const Unit = styled.span`
  font-size: 0.75rem;
`;

const EmissionBar = styled.div<{barWidth: number, barColor: string, placement: number}>`
  position: absolute;
  top: ${(props) => props.placement * 7}px;
  right: 0;
  height: 6px;
  width: ${(props) => props.barWidth}%;
  background-color: ${(props) => props.barColor};
  border-right: 1px solid ${(props) => props.theme.graphColors.grey070};
`;

const BarWithLabel = (props) => {
  const { label, value, unit, barWidth, barColor, labelSide, placement } = props;

  return (
    <EmissionBar
      barWidth={barWidth}
      barColor={barColor}
      placement={placement}
    >
      <BarLabel
        side={labelSide}
        placement={placement}
      >
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
  const emissionsTotalColor = emissionsTotal > emissionsTarget ? theme.graphColors.red050 : theme.graphColors.green050;
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
      barColor: theme.graphColors.green050,
      barWidth: emissionsTargetWidth,
      labelSide: undefined,
    },
  ], [(bar) => -bar.value]);

  return (
    <div>
      <EmissionsBar>
        { bars.map((bar, index) => (
          <BarWithLabel
            {...bar}
            key={bar.label}
            placement={index}
          />
        ))}
      </EmissionsBar>
    </div>
  );
};

export default TotalEmissionsBar;
