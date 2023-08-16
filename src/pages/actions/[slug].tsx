import { useEffect, useState, useMemo } from 'react';
import Head from 'next/head';
import { useQuery, useReactiveVar } from '@apollo/client';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { useInstance } from 'common/instance';
import { Container } from 'reactstrap';
import styled from 'styled-components';

import { GET_ACTION_CONTENT } from 'queries/getActionContent';
import { yearRangeVar, activeScenarioVar, activeGoalVar, } from 'common/cache';
import { useSite } from 'context/site';
import { logError } from 'common/log';
import { summarizeYearlyValuesBetween } from 'common/preprocess';
import GraphQLError from 'components/common/GraphQLError';
import SettingsPanelFull from 'components/general/SettingsPanelFull';
import CausalGrid from 'components/general/CausalGrid';
import NodePlot from 'components/general/NodePlot';
import ActionParameters from 'components/general/ActionParameters';
import ContentLoader from 'components/common/ContentLoader';
import { ActionListLink, NodeLink } from 'common/links';
import Badge from 'components/common/Badge';
import { GetActionContentQuery, GetActionContentQueryVariables } from 'common/__generated__/graphql';
import ErrorMessage from 'components/common/ErrorMessage';
import DimensionalPlot from 'components/graphs/DimensionalFlow';
import ImpactDisplay from 'components/general/ImpactDisplay';
import { ArrowRight } from 'react-bootstrap-icons';
import SubActions from 'components/general/SubActions';

const HeaderSection = styled.div`
  padding: 3rem 0 1rem;
  margin-bottom: 4rem;
  background-color: ${(props) => props.theme.graphColors.blue070};
`;

const HeaderCard = styled.div` 
  margin: 1rem 0 -8rem;
  padding: 1.5rem 1.5rem 2.5rem;
  border-radius: 0;
  background-color: ${(props) => props.theme.themeColors.white};
  box-shadow: 3px 3px 12px rgba(33,33,33,0.15);
`;

const ActionDescription = styled.div`
  margin-bottom: 2rem;
  padding: 1rem;
  border-radius: 0;
  font-size: 1rem;
  background-color: ${(props) => props.theme.graphColors.grey010};
`;

const ActionCategory = styled.div`
  margin-bottom: 1rem;
`;

const ActionMetrics = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 1rem;
  flex-direction: column;

  @media (min-width: ${(props) => props.theme.breakpointMd}) {
    flex-direction: row;
  }
`;

const ActionGraphHeader = styled.h4`
`;

const PageHeader = styled.div` 
  margin-bottom: 2rem;

  h1 {
    margin-bottom: 2rem;
    font-size: 1.5rem;
    color: ${(props) => props.theme.themeColors.dark};
  }
`;

const MetricsParameters = styled.div`
  flex: 2 1 auto;
  margin-bottom: 1rem;
`;

const MetricsImpact = styled.div`
  flex: 3 1 auto;
  margin-bottom: 1rem;
`;

export default function ActionPage() {
  const router = useRouter();
  const { slug } = router.query;
  const { t } = useTranslation();
  const yearRange = useReactiveVar(yearRangeVar);
  const activeScenario = useReactiveVar(activeScenarioVar);
  const activeGoal = useReactiveVar(activeGoalVar);
  const site = useSite();
  const instance = useInstance();
  const [activeSubAction, setActiveSubAction] = useState(undefined);

  const queryResp = useQuery<GetActionContentQuery, GetActionContentQueryVariables>(GET_ACTION_CONTENT, {
    fetchPolicy: 'cache-and-network',
    variables: {
      node: slug as string,
      goal: activeGoal?.id,
    },
  });
  const { loading, error, previousData, refetch } = queryResp;

  const data = queryResp.data ?? previousData;

  useEffect(() => {
    refetch();
  }, [activeScenario]);

  if (!data) {
    return <div style={{ height: '100hv'}}><ContentLoader /></div>;
  }
  if (error) {
    logError(error, {query: GET_ACTION_CONTENT});
    return <Container className="pt-5"><GraphQLError errors={error} /></Container>
  }
  if (!data || !data.action) {
    return <ErrorMessage message={t('page-not-found')} />;
  }
  const action = data.action;
  const subActions = action.subactions;
  /*
  {
      id: 'replacement_of_heating_networks',
      name: 'Heizungsersatz durch thermische Netze',
      description: 'Sed euismod, nunc vel tincidunt luctus, nunc nisl aliquam nisl, vel aliquam nunc nisl vel nisl. Sed euismod, nunc vel tincidunt luctus, nunc nisl aliquam nisl, vel aliquam nunc nisl vel nisl.',
      active: true,
      isEnabled: true,
      parameters: action.parameters
    },
    {
      id: 'district_heat_decarbonisation',
      name: 'Dekarbonisierung thermische Netze',
      description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod, nunc vel tincidunt luctus, nunc nisl aliquam nisl, vel aliquam nunc nisl vel nisl.',
      active: true,
      isEnabled: true,
      parameters: action.parameters
    },
    {
      id: 'natural_gas_network_decarbonisation',
      name: 'Dekarbonisierung Gasversorgung',
      description: 'Sed euismod, nunc vel tincidunt luctus, nunc nisl aliquam nisl, vel aliquam nunc nisl vel nisl.',
      active: true,
      isEnabled: false,
      parameters: action.parameters
    },
    {
      id: 'replacement_of_heat_pumps',
      name: 'Heizungsersatz durch Wärmepumpen',
      description: 'Sed euismod, nunc vel tincidunt luctus, nunc nisl aliquam nisl, vel aliquam nunc nisl vel nisl.',
      active: true,
      isEnabled: false,
      parameters: action.parameters
    },
    {
      id: 'replacement_of_other_systems',
      name: 'Heizungsersatz durch übrige Systeme',
      description: 'Sed euismod, nunc vel tincidunt luctus, nunc nisl aliquam nisl, vel aliquam nunc nisl vel nisl.',
      active: true,
      isEnabled: false,
      parameters: action.parameters
    },
  ] : [];
  */
  // show causal nodes only for selected subaction
  const causalNodes = action.downstreamNodes;
  const lastNode = action.downstreamNodes.find((node) => node.outputNodes.length === 0);
  //const causalNodes = activeSubAction ? action.downstreamNodes : [lastNode];

  const unitYearly = `${action.impactMetric.unit?.htmlShort}`;
  const actionEffectYearly = action.impactMetric.forecastValues.find(
    (dataPoint) => dataPoint.year === yearRange[1],
  )?.value || 0;

  const actionEffectCumulative = summarizeYearlyValuesBetween(action.impactMetric, yearRange[0], yearRange[1]);
  const unitCumulative = action.impactMetric.yearlyCumulativeUnit?.htmlShort;
  const isActive = action.parameters.find((param) => param.id == `${param.node.id}.enabled`)?.boolValue;
  const flowPlot = action.dimensionalFlow && (
    <DimensionalPlot flow={action.dimensionalFlow} />
  );

  return (
    <>
      <Head>
        <title>
          {site.title}
          {' '}
          |
          {' '}
          {action.name}
        </title>
      </Head>
      <HeaderSection>
        <Container fluid="lg">
          <PageHeader>
            <HeaderCard>
              <h1>
                <ActionListLink>
                  <a>
                    { t('actions') }
                  </a>
                </ActionListLink>
                {' '}
                /
                { action.group && ` ${action.group.name} /`}
                {` ${action.name}`}
              </h1>
              <div>
              { action.decisionLevel === 'NATION' && (
                <ActionCategory>
                  <Badge
                    color="neutralLight"
                  >
                    { t('decision-national') }
                  </Badge>
                </ActionCategory>
              )}
              </div>
              <ActionDescription>
                <div dangerouslySetInnerHTML={{ __html: action.shortDescription }} />
                <NodeLink node={action}>
                  <a>
                    {t('read-more')}
                    {' '}
                    <ArrowRight />
                  </a>
                </NodeLink>
                <hr />
                <ActionMetrics>
                  <MetricsParameters>
                    <ActionParameters
                      parameters={action.parameters}
                    />
                  </MetricsParameters>
                </ActionMetrics>
                { action.metric && (
                  <ActionGraphHeader>
                    {action.quantity} (<span dangerouslySetInnerHTML={{__html: action.unit?.htmlShort}} />)
                  </ActionGraphHeader> )}
                { action.metric && (
                  flowPlot || (
                    <NodePlot
                      metric={action.metric}
                      impactMetric={action.impactMetric}
                      year="2021"
                      startYear={yearRange[0]}
                      endYear={yearRange[1]}
                      color={action.color}
                      isAction={action.__typename === 'ActionNode'}
                      targetYearGoal={action.targetYearGoal}
                    />
                  )
                )}
              </ActionDescription>
              { subActions.length > 0 && (
                <SubActions
                  actions={subActions}
                  activeSubAction={activeSubAction}
                  setActiveSubAction={setActiveSubAction}
                />
              )}
            </HeaderCard>
          </PageHeader>
        </Container>
      </HeaderSection>
      { causalNodes.length > 0 && (
        <CausalGrid
          nodes={causalNodes}
          yearRange={yearRange}
          actionIsOff={!isActive}
          action={action}
        />
      )}
      <SettingsPanelFull />
    </>
  );
}
