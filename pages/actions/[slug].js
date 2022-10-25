import { useEffect } from 'react';
import Head from 'next/head';
import { useQuery, useReactiveVar } from '@apollo/client';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { Container } from 'reactstrap';
import styled from 'styled-components';

import { GET_ACTION_CONTENT } from 'common/queries/getActionContent';
import { yearRangeVar, activeScenarioVar, settingsVar } from 'common/cache';
import { useSite } from 'context/site';
import { logError } from 'common/log';
import SettingsPanel from 'components/general/SettingsPanel';
import CausalGrid from 'components/general/CausalGrid';
import NodePlot from 'components/general/NodePlot';
import ActionParameters from 'components/general/ActionParameters';
import ContentLoader from 'components/common/ContentLoader';
import { ActionListLink, NodeLink } from 'common/links';
import Badge from 'components/common/Badge';

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

const PageHeader = styled.div` 
  margin-bottom: 2rem;

  h1 {
    margin-bottom: 2rem;
    font-size: 1.5rem;
    color: ${(props) => props.theme.themeColors.dark};
  }
`;

const ContentWrapper = styled.div`
  padding: 1rem;
  margin: .5rem 0;
  background-color: ${(props) => props.theme.graphColors.grey005};
  border-radius:  ${(props) => props.theme.cardBorderRadius};

  .x2sstick text, .xtick text {
    text-anchor: end !important;
  }
`;

export default function ActionPage() {
  const router = useRouter();
  const { slug } = router.query;
  const { t } = useTranslation();
  const yearRange = useReactiveVar(yearRangeVar);
  const activeScenario = useReactiveVar(activeScenarioVar);
  const site = useSite();

  const { loading, error, data, refetch } = useQuery(GET_ACTION_CONTENT, {
    fetchPolicy: 'no-cache',
    variables: {
      node: slug,
    },
  });

  useEffect(() => {
    refetch();
  }, [activeScenario]);

  if (loading) {
    return <ContentLoader />;
  }
  if (error) {
    logError(error, {query: GET_ACTION_CONTENT});
    return <Container><h2 className="p-5">{t('error-loading-data')}</h2></Container>;
  }

  const action = data.node;
  const causalNodes = action.downstreamNodes;
  const isActive = action.parameters.find((param) => param.id == `${param.node.id}.enabled`)?.boolValue;
  // actionTree.filter((node) => node.inputNodes.find((input) => input.id === parentId));

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
        <Container>
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
              <ActionParameters
                parameters={action.parameters}
              />
                </ActionDescription>
              { action.metric && (
              <ContentWrapper>
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
              </ContentWrapper>
              )}
            </HeaderCard>
          </PageHeader>
        </Container>
      </HeaderSection>
      <CausalGrid
        nodes={causalNodes}
        yearRange={yearRange}
        actionIsOff={!isActive}
        actionId={action.id}
      />
      <SettingsPanel
        defaultYearRange={[settingsVar().latestMetricYear, settingsVar().maxYear]}
      />
    </>
  );
}
