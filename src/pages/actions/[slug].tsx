import { useEffect, useState, useMemo } from 'react';
import Head from 'next/head';
import { useQuery, useReactiveVar, NetworkStatus } from '@apollo/client';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { useTheme } from 'common/theme';
import { Container, Row, Col } from 'reactstrap';

import styled from 'styled-components';

import { GET_ACTION_CONTENT } from 'queries/getActionContent';
import { yearRangeVar, activeScenarioVar, activeGoalVar } from 'common/cache';
import { useSite } from 'context/site';
import { logError } from 'common/log';
import GraphQLError from 'components/common/GraphQLError';
import SettingsPanelFull from 'components/general/SettingsPanelFull';
import CausalGrid from 'components/general/CausalGrid';
import NodePlot from 'components/general/NodePlot';
import ActionParameters from 'components/general/ActionParameters';
import ContentLoader from 'components/common/ContentLoader';
import { ActionListLink, NodeLink } from 'common/links';
import Badge from 'components/common/Badge';
import {
  GetActionContentQuery,
  GetActionContentQueryVariables,
} from 'common/__generated__/graphql';
import ErrorMessage from 'components/common/ErrorMessage';
import DimensionalPlot from 'components/graphs/DimensionalFlow';
import ImpactDisplay from 'components/general/ImpactDisplay';
import Icon from 'components/common/icon';
import SubActions from 'components/general/SubActions';
import Loader from 'components/common/Loader';

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
  box-shadow: 3px 3px 12px rgba(33, 33, 33, 0.15);
`;

const Breadcrumb = styled.nav`
  margin-bottom: ${({ theme }) => theme.spaces.s050};
  font-weight: ${({ theme }) => theme.fontWeightBold};
  ol {
    margin: 0;
    padding: 0;
  }

  li {
    display: inline-block;
    color: ${(props) => props.theme.themeColors.dark};

    &::after {
      content: '/';
      margin: 0 0.25rem;
    }
  }
`;

const ActionDescription = styled.div`
  max-width: ${({ theme }) => theme.breakpointSm};
`;

const ActionCategory = styled.div`
  margin-bottom: 1rem;
`;

const ActionMetrics = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 1rem;
  padding-top: 1rem;
  flex-direction: column;
  border-top: 1px solid ${(props) => props.theme.graphColors.grey020};
  border-bottom: 1px solid ${(props) => props.theme.graphColors.grey020};

  @media (min-width: ${(props) => props.theme.breakpointMd}) {
    height: 100%;
    border-top: 0;
    border-bottom: 0;
    border-left: 1px solid ${(props) => props.theme.graphColors.grey020};
    padding-left: 1rem;
  }
`;

const ActionPlotCard = styled.div`
  padding: 1rem;
  background-color: ${({ theme }) => theme.cardBackground.secondary};
`;

const ActionGraphHeader = styled.h2`
  font-size: ${({ theme }) => theme.fontSizeLg};
`;

const PageHeader = styled.div`
  margin-bottom: 2rem;

  h1 {
    margin-bottom: 2rem;
    font-size: ${({ theme }) => theme.fontSizeXl};
    color: ${(props) => props.theme.themeColors.dark};
  }
`;

const MetricsParameters = styled.div`
  flex: 2 1 auto;
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
  const [activeSubAction, setActiveSubAction] = useState(undefined);
  const theme = useTheme();

  const queryResp = useQuery<
    GetActionContentQuery,
    GetActionContentQueryVariables
  >(GET_ACTION_CONTENT, {
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
    return <ContentLoader fullPage />;
  }
  if (error) {
    logError(error, { query: GET_ACTION_CONTENT });
    return (
      <Container className="pt-5">
        <GraphQLError errors={error} />
      </Container>
    );
  }
  if (!data || !data.action) {
    return <ErrorMessage message={t('page-not-found')} />;
  }

  const action = data.action;
  const subActions = action.subactions;

  // style differently if not active
  const isActive = action.parameters.find(
    (param) => param.id == `${param.node.id}.enabled`
  )?.boolValue;

  // use flowplot if action has dimensional flow
  const flowPlot = action.dimensionalFlow && (
    <DimensionalPlot flow={action.dimensionalFlow} />
  );

  // if action is simple, has just one output node and no subactions, use first downstream node for graph
  const outputNodes = action.downstreamNodes.filter((node) =>
    node.inputNodes.find((inputNode) => inputNode.id === action.id)
  );
  const actionVizNode =
    outputNodes.length === 1 &&
    action.subactions.length === 0 &&
    outputNodes[0].metric
      ? outputNodes[0]
      : action;

  const actionPlot = action.metric
    ? flowPlot || (
        <>
          <ActionGraphHeader>
            {t('impact')}: {actionVizNode.name} (
            <span
              dangerouslySetInnerHTML={{
                __html: actionVizNode.unit?.htmlShort,
              }}
            />
            )
          </ActionGraphHeader>
          <NodePlot
            metric={actionVizNode.metric}
            impactMetric={actionVizNode.impactMetric}
            startYear={yearRange[0]}
            endYear={yearRange[1]}
            color={action.color}
            isAction={action.__typename === 'ActionNode'}
            targetYearGoal={action.targetYearGoal}
          />
        </>
      )
    : undefined;

  // show causal nodes only for selected subaction, filter out node used for visualisation
  const causalNodes =
    activeSubAction === undefined
      ? action.downstreamNodes.filter((node) => node.id !== actionVizNode.id)
      : action.subactions.find((subAction) => subAction.id === activeSubAction)
          ?.downstreamNodes;

  return (
    <>
      <Head>
        <title>
          {site.title} | {action.name}
        </title>
      </Head>
      <HeaderSection>
        <Container fluid="lg">
          <PageHeader>
            <HeaderCard>
              <Breadcrumb aria-label="breadcrumb">
                <ol className="breadcrumb">
                  <li className="breadcrumb-item">
                    <ActionListLink>
                      <a>{t('actions')}</a>
                    </ActionListLink>
                  </li>
                  {action.group && (
                    <li className="breadcrumb-item">{action.group.name}</li>
                  )}
                </ol>
              </Breadcrumb>
              <h1>{` ${action.name}`}</h1>
              <div>
                {action.decisionLevel === 'NATION' && (
                  <ActionCategory>
                    <Badge color="neutralLight">{t('decision-national')}</Badge>
                  </ActionCategory>
                )}
              </div>
              <Row>
                <Col xs={12} md={7} className="mb-4">
                  <ActionDescription>
                    <div
                      dangerouslySetInnerHTML={{
                        __html: action.shortDescription,
                      }}
                    />
                    <NodeLink node={action}>
                      <a>
                        {t('read-more')} <Icon name="arrowRight" />
                      </a>
                    </NodeLink>
                  </ActionDescription>
                </Col>
                <Col xs={12} md={5} className="mb-md-4">
                  <ActionMetrics>
                    <MetricsParameters>
                      <ActionParameters parameters={action.parameters} />
                    </MetricsParameters>
                  </ActionMetrics>
                </Col>
              </Row>
            </HeaderCard>
          </PageHeader>
        </Container>
      </HeaderSection>
      <Container fluid="lg" style={{ position: 'relative' }}>
        {loading && <Loader />}
        <ActionPlotCard>{actionPlot}</ActionPlotCard>
      </Container>
      {subActions.length > 0 && (
        <Container fluid="lg">
          <SubActions
            actions={subActions}
            activeSubAction={activeSubAction}
            setActiveSubAction={setActiveSubAction}
          />
        </Container>
      )}
      {causalNodes.length > 0 && !theme.settings.hideActionGrid && (
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
