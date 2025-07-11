import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

import { useLazyQuery, useQuery, useReactiveVar } from '@apollo/client';
import type {
  GetActionContentQuery,
  GetActionContentQueryVariables,
  GetCausalChainQuery,
  GetCausalChainQueryVariables,
} from 'common/__generated__/graphql';
import { activeGoalVar, activeScenarioVar, yearRangeVar } from 'common/cache';
import { ActionListLink, NodeLink } from 'common/links';
import { logApolloError } from 'common/log';
import Badge from 'components/common/Badge';
import ContentLoader from 'components/common/ContentLoader';
import ErrorMessage from 'components/common/ErrorMessage';
import GraphQLError from 'components/common/GraphQLError';
import Icon from 'components/common/icon';
import Loader from 'components/common/Loader';
import { StreamField } from 'components/common/StreamField';
import { ActionGoal } from 'components/general/ActionGoal';
import ActionParameters from 'components/general/ActionParameters';
import CausalGrid, { type CausalGridNode } from 'components/general/CausalGrid';
import NodePlot from 'components/general/NodePlot';
import SettingsPanelFull from 'components/general/SettingsPanelFull';
import DimensionalPlot from 'components/graphs/DimensionalFlow';
import { useSite } from 'context/site';
import { useTranslation } from 'next-i18next';
import { GET_ACTION_CONTENT, GET_CAUSAL_CHAIN } from 'queries/getActionContent';
import { Col, Container, Row } from 'reactstrap';
import styled, { useTheme } from 'styled-components';

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

const ActionBodyContainer = styled.div`
  background-color: ${({ theme }) => theme.cardBackground.primary};
  padding: ${({ theme }) => theme.spaces.s200};
`;

function getOutcomeCards(outcomeNodes: CausalGridNode[]) {
  return [...outcomeNodes]
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((node) => ({ title: node.name, id: node.id }));
}

export default function ActionPage() {
  const router = useRouter();
  const { slug } = router.query;
  const { t } = useTranslation();
  const yearRange = useReactiveVar(yearRangeVar);
  const activeScenario = useReactiveVar(activeScenarioVar);
  const activeGoal = useReactiveVar(activeGoalVar);
  const site = useSite();
  const [activeDownstreamNode, setActiveDownstreamNode] = useState<string | undefined>(undefined);
  const theme = useTheme();

  const queryResp = useQuery<GetActionContentQuery, GetActionContentQueryVariables>(
    GET_ACTION_CONTENT,
    {
      fetchPolicy: 'cache-and-network',
      variables: {
        node: slug as string,
        goal: activeGoal?.id ?? null,
        downstreamDepth: theme.settings.hideActionGrid ? 1 : null,
      },
    }
  );

  // Fetch the full causal chain only upon clicking the expand grid button
  const [getCausalChain, causalChainResp] = useLazyQuery<
    GetCausalChainQuery,
    GetCausalChainQueryVariables
  >(GET_CAUSAL_CHAIN);

  const { loading, error, previousData, refetch } = queryResp;

  const data = queryResp.data ?? previousData;

  useEffect(() => {
    refetch();
  }, [activeScenario, refetch]);

  useEffect(() => {
    if (!activeDownstreamNode && data?.action?.downstreamNodes?.length) {
      setActiveDownstreamNode(data.action.downstreamNodes[0].id);
    }
  }, [activeDownstreamNode, data]);

  if (!data) {
    return <ContentLoader fullPage />;
  }

  if (error) {
    logApolloError(error, { query: GET_ACTION_CONTENT });
    return (
      <Container className="pt-5">
        <GraphQLError error={error} />
      </Container>
    );
  }

  if (!data || !data.action) {
    return <ErrorMessage message={t('page-not-found')} />;
  }

  const action = data.action;
  const outcomeNodes = action.downstreamNodes; // Non-outcome nodes are filtered out
  const selectedOutcomeNode = outcomeNodes.find((node) => node.id === activeDownstreamNode);
  const allNodes = (
    causalChainResp.data?.action?.downstreamNodes
      ? causalChainResp.data.action.downstreamNodes
      : [selectedOutcomeNode]
  ).filter((node): node is CausalGridNode => !!node);

  // style differently if not active
  const isActive = action.parameters.find(
    (param) => param.id == `${param.node.id}.enabled`
  )?.boolValue;

  // use flowplot if action has dimensional flow
  const flowPlot = action.dimensionalFlow && <DimensionalPlot flow={action.dimensionalFlow} />;

  const actionPlot = action.metric
    ? flowPlot || (
        <>
          <ActionGraphHeader>
            {t('impact')}: {action.name}
          </ActionGraphHeader>
          <NodePlot
            metric={action.metric}
            impactMetric={action.impactMetric}
            startYear={yearRange[0]}
            endYear={yearRange[1]}
            color={action.color}
            isAction={action.__typename === 'ActionNode'}
            targetYearGoal={action.targetYearGoal ?? undefined}
          />
        </>
      )
    : undefined;

  function handleExpandGrid() {
    if (!activeDownstreamNode) {
      return;
    }

    getCausalChain({
      variables: {
        node: slug as string,
        goal: activeGoal?.id ?? null,
        untilNode: activeDownstreamNode,
      },
    });
  }

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
                  {action.group && <li className="breadcrumb-item">{action.group.name}</li>}
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
                  {!!action.goal && (
                    <ActionGoal
                      dangerouslySetInnerHTML={{
                        __html: action.goal,
                      }}
                    />
                  )}
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
        {!!actionPlot && <ActionPlotCard>{actionPlot}</ActionPlotCard>}
      </Container>

      {!!action.body?.length && (
        <Container fluid="lg">
          <ActionBodyContainer>
            {action.body.map((block, i) => (
              <StreamField key={i} block={block} />
            ))}
          </ActionBodyContainer>
        </Container>
      )}

      {selectedOutcomeNode && !theme.settings.hideActionGrid && (
        <CausalGrid
          nodes={allNodes}
          lastNode={selectedOutcomeNode}
          yearRange={yearRange}
          actionIsOff={!isActive}
          action={action}
          nodeOutcomeCards={getOutcomeCards(outcomeNodes)}
          selectedOutcomeNode={activeDownstreamNode}
          onClickOutcomeNodeCard={(id) => setActiveDownstreamNode(id)}
          onClickExpandGrid={handleExpandGrid}
          expandedGridLoading={causalChainResp.loading}
        />
      )}
      <SettingsPanelFull />
    </>
  );
}
