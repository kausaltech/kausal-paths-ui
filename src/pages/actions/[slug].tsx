import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useQuery, useReactiveVar } from '@apollo/client';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { useInstance } from 'common/instance';
import { Container } from 'reactstrap';
import styled from 'styled-components';

import { GET_ACTION_CONTENT } from 'common/queries/getActionContent';
import { yearRangeVar, activeScenarioVar, activeGoalVar, } from 'common/cache';
import { useSite } from 'context/site';
import { logError } from 'common/log';
import { summarizeYearlyValuesBetween } from 'common/preprocess';
import GraphQLError from 'components/common/GraphQLError';
import SettingsPanel from 'components/general/SettingsPanel';
import CausalGrid from 'components/general/CausalGrid';
import NodePlot from 'components/general/NodePlot';
import ActionParameters from 'components/general/ActionParameters';
import ContentLoader from 'components/common/ContentLoader';
import { ActionListLink, NodeLink } from 'common/links';
import Badge from 'components/common/Badge';
import { GetActionContentQuery, GetActionContentQueryVariables } from 'common/__generated__/graphql';
import ErrorMessage from 'components/common/ErrorMessage';
import DimensionalPlot from 'components/graphs/DimensionalFlow';
import SubActions from 'components/general/SubActions';
import ImpactDisplay from 'components/general/ImpactDisplay';
import * as Icon from 'react-bootstrap-icons';

const HeaderSection = styled.div`
  padding: 3rem 0 1rem;
  margin-bottom: 4rem;
  background-color: ${(props) => props.theme.graphColors.blue070};
`;

const HeaderCard = styled.div` 
  margin: 1rem 0 -8rem;
  padding: 1.5rem;
  border-radius:  ${(props) => props.theme.cardBorderRadius};
  background-color: ${(props) => props.theme.themeColors.white};
  box-shadow: 3px 3px 12px rgba(33,33,33,0.15);
`;

const ActionDescription = styled.div`
  margin-bottom: 2rem;
  padding: 1rem;
  border-radius:  ${(props) => props.theme.cardBorderRadius};
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
    return <ContentLoader />;
  }
  if (error) {
    logError(error, {query: GET_ACTION_CONTENT});
    return <Container className="pt-5"><GraphQLError errors={error} /></Container>
  }
  if (!data || !data.node) {
    return <ErrorMessage message={t('page-not-found')} />;
  }

  const action = data.node;
  const causalNodes = action.downstreamNodes;
  const lastNode = causalNodes.find((node) => node.outputNodes.length === 0);
  const unitYearly = `${action.impactMetric.unit?.htmlShort}`;
  const actionEffectYearly = action.impactMetric.forecastValues.find(
    (dataPoint) => dataPoint.year === yearRange[1],
  )?.value || 0;

  const actionEffectCumulative = summarizeYearlyValuesBetween(action.impactMetric, yearRange[0], yearRange[1]);
  const unitCumulative = action.impactMetric.yearlyCumulativeUnit?.htmlShort;
  const isActive = action.parameters.find((param) => param.id == `${param.node.id}.enabled`)?.boolValue;
  const flowPlot = action.dimensionalFlow && (
    <DimensionalPlot flow={action.dimensionalFlow} />
  )

  const fakeSubActions = [
    {
      id: 'building_heat_demand',
      name: 'Endenergieverbrauch Fossiler Brennstoff',
      description: 'Sed euismod, nunc vel tincidunt luctus, nunc nisl aliquam nisl, vel aliquam nunc nisl vel nisl. Sed euismod, nunc vel tincidunt luctus, nunc nisl aliquam nisl, vel aliquam nunc nisl vel nisl.',
      active: true,
      isEnabled: true,
      parameters: action.parameters
    },
    {
      id: 'building_heat_consumption_historical',
      name: 'Endenergieverbrauch Biobrennstoff',
      description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod, nunc vel tincidunt luctus, nunc nisl aliquam nisl, vel aliquam nunc nisl vel nisl.',
      active: true,
      isEnabled: true,
      parameters: action.parameters
    },
    {
      id: 'building_energy_retrofit',
      name: 'Endenergieverbrauch Fernwärme',
      description: 'Sed euismod, nunc vel tincidunt luctus, nunc nisl aliquam nisl, vel aliquam nunc nisl vel nisl.',
      active: true,
      isEnabled: false,
      parameters: action.parameters
    },
  ];

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
                {' '}
                {action.name}
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
                <NodeLink node={action}><a>{t('read-more')}</a></NodeLink>
                <hr />
                <ActionMetrics>
                  <MetricsParameters>
                    <ActionParameters
                      parameters={action.parameters}
                    />
                  </MetricsParameters>
                  <MetricsImpact>
                    <ImpactDisplay
                      effectCumulative={undefined}
                      effectYearly={actionEffectYearly}
                      yearRange={yearRange}
                      unitCumulative={undefined}
                      unitYearly={unitYearly}
                      muted={!isActive}
                      impactName={activeGoal?.label || undefined }
                    >
                      {lastNode && (
                      <NodePlot
                        metric={lastNode.metric}
                        impactMetric={lastNode.impactMetric}
                        year="2021"
                        startYear={yearRange[0]}
                        endYear={yearRange[1]}
                        color={lastNode.color}
                        isAction={lastNode.isAction}
                        targetYear={instance.targetYear}
                        targetYearGoal={lastNode.targetYearGoal}
                        quantity={lastNode.quantity}
                        compact={true}
                      /> )}
                    </ImpactDisplay>
                  </MetricsImpact>
                </ActionMetrics>

                { action.metric && (
                  flowPlot || (
                    <NodePlot
                      metric={action.metric}
                      impactMetric={action.impactMetric}
                      year="2021"
                      startYear={yearRange[0]}
                      endYear={yearRange[1]}
                      color={action.color}
                      isAction={action.isAction}
                      targetYearGoal={action.targetYearGoal}
                    />
                  )
                )}
              </ActionDescription>
              
              <SubActions
                actions={fakeSubActions}
              />
            </HeaderCard>
          </PageHeader>
        </Container>
      </HeaderSection>
      <CausalGrid
        nodes={causalNodes}
        yearRange={yearRange}
        actionIsOff={!isActive}
        action={action}
      />
      <SettingsPanel />
    </>
  );
}
