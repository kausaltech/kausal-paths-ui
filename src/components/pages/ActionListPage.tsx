import { useState, useEffect, useMemo } from 'react';
import {
  useQuery,
  useReactiveVar,
  NetworkStatus,
  useSuspenseQuery_experimental,
} from '@apollo/client';
import styled from 'styled-components';
import { summarizeYearlyValuesBetween } from 'common/preprocess';
import { activeGoalVar, activeScenarioVar, yearRangeVar } from 'common/cache';
import {
  Container,
  Row,
  Col,
  ButtonGroup,
  Button,
  FormGroup,
  Input,
  Label,
  Alert,
} from 'reactstrap';
import {
  SortUp,
  SortDown,
  Grid3x2GapFill,
  BarChartLineFill,
} from 'react-bootstrap-icons';
import { useTranslation } from 'next-i18next';
import { GET_ACTION_LIST } from 'queries/getActionList';

import GraphQLError from 'components/common/GraphQLError';
import SettingsPanelFull from 'components/general/SettingsPanelFull';
import ActionsMac from 'components/general/ActionsMac';
import ActionsComparison from 'components/general/ActionsComparison';
import ContentLoader from 'components/common/ContentLoader';
import ActionsList from 'components/general/ActionsList';
import { useSite } from 'context/site';
import {
  GetActionListQuery,
  GetActionListQueryVariables,
  GetPageQuery,
} from 'common/__generated__/graphql';
import ScenarioBadge from 'components/common/ScenarioBadge';

const HeaderSection = styled.div`
  padding: 4rem 0 2rem;
  background-color: ${(props) => props.theme.graphColors.blue070};
`;

const PageHeader = styled.div`
  h1 {
    margin-bottom: 2rem;
    font-size: 2rem;
    color: ${(props) => props.theme.themeColors.white};
  }
`;

const SettingsForm = styled.form`
  display: block;
  margin: 1.5rem 0;
  padding: 0.5rem 0;
  border-top: 1px solid ${(props) => props.theme.graphColors.blue030};
  border-bottom: 1px solid ${(props) => props.theme.graphColors.blue030};
`;

const ActionCount = styled.div`
  margin: ${({ theme }) => theme.spaces.s100} 0;
  color: ${({ theme }) => theme.themeColors.white};

  span {
    margin-left: 1rem;
  }
`;

const HeaderCard = styled.div`
  margin: ${({ theme }) => theme.spaces.s200} 0;
  padding: ${({ theme }) => theme.spaces.s100}
    ${({ theme }) => theme.spaces.s200};
  border-radius: 0;
  background-color: ${(props) => props.theme.themeColors.white};
`;

const Description = styled.div``;

const ActionsViewTabs = styled.div`
  background-color: ${(props) => props.theme.graphColors.blue070};
  margin-bottom: ${(props) => props.theme.spaces.s400};
`;

const Tab = styled.button`
  background: ${(props) => props.theme.graphColors.blue070};
  color: ${(props) => props.theme.themeColors.white};
  display: inline-block;
  border: none;
  margin: 0;
  padding: ${(props) =>
    `${props.theme.spaces.s050} ${props.theme.spaces.s150} ${props.theme.spaces.s100}`};
  text-decoration: none;
  cursor: pointer;
  text-align: center;

  &:hover,
  &:focus {
    color: ${(props) => props.theme.brandLight};
  }
  &.active {
    color: ${(props) => props.theme.graphColors.blue070};
    background: ${(props) => props.theme.graphColors.grey030};
    &:hover {
      color: ${(props) => props.theme.themeColors.black};
    }
  }
`;

export type ActionWithEfficiency = GetActionListQuery['actions'][0] & {
  cumulativeImpact?: number;
  cumulativeImpactUnit?: string;
  cumulativeImpactName?: string;
  efficiencyDivisor?: number;
  cumulativeEfficiency?: number;
  cumulativeEfficiencyUnit?: string;
  cumulativeEfficiencyName?: string;
  cumulativeCost?: number;
  cumulativeCostUnit?: string;
  cumulativeCostName?: string;
  efficiencyCap?: number;
};

type ActionListPageProps = {
  page: NonNullable<GetPageQuery['page']> & {
    __typename: 'ActionListPage';
  };
};

function ActionListPage(props: ActionListPageProps) {
  const { t } = useTranslation();
  const { page } = props;
  const activeGoal = useReactiveVar(activeGoalVar);
  const queryResp = useQuery<GetActionListQuery, GetActionListQueryVariables>(
    GET_ACTION_LIST,
    {
      variables: {
        goal: activeGoal?.id,
      },
      fetchPolicy: 'cache-and-network',
      notifyOnNetworkStatusChange: true,
    }
  );
  const { error, loading, networkStatus, previousData } = queryResp;
  const activeScenario = useReactiveVar(activeScenarioVar);
  const yearRange = useReactiveVar(yearRangeVar);
  const site = useSite();

  const [listType, setListType] = useState('list');
  const [ascending, setAscending] = useState(true);
  const [sortBy, setSortBy] = useState('impact');
  const [activeEfficiency, setActiveEfficiency] = useState<number>(0);
  const [actionGroup, setActionGroup] = useState('undefined');

  const data = queryResp.data ?? previousData;
  const hasEfficiency = data ? data.actionEfficiencyPairs.length > 0 : false;

  // Different default view if we have action efficiency pairs
  useEffect(() => {
    if (loading === false && data) {
      if (hasEfficiency) {
        setListType('mac');
        setSortBy('cumulativeEfficiency');
      }
    }
  }, [loading, data]);

  // If we have action efficiency pairs, we augment the actions with the cumulative values
  const reductionText = `(${t('reduction')}, ${t('accumulated-between')} ${
    yearRange[0]
  }-${yearRange[1]})`;
  const usableActions: ActionWithEfficiency[] = useMemo(
    () =>
      (data?.actions || [])
        .map((act) => {
          const out: ActionWithEfficiency = {
            ...act,
          };
          const efficiencyType = data?.actionEfficiencyPairs[activeEfficiency];
          const efficiencyAction = efficiencyType?.actions.find(
            (a) => a.action.id === act.id
          );
          if (!efficiencyType || !efficiencyAction) return out;

          out.cumulativeImpact =
            (efficiencyType.invertImpact ? -1 : 1) *
            summarizeYearlyValuesBetween(
              efficiencyAction.impactValues,
              yearRange[0],
              yearRange[1]
            );
          out.cumulativeCost =
            (efficiencyType.invertCost ? -1 : 1) *
            summarizeYearlyValuesBetween(
              efficiencyAction.costValues,
              yearRange[0],
              yearRange[1]
            );
          out.efficiencyDivisor =
            efficiencyAction.efficiencyDivisor ?? undefined;
          if (out.efficiencyDivisor !== undefined)
            out.cumulativeEfficiency =
              out.cumulativeCost /
              Math.abs(out.cumulativeImpact) /
              out.efficiencyDivisor;

          const efficiencyProps: Partial<ActionWithEfficiency> = {
            cumulativeImpactUnit: efficiencyType?.impactUnit.htmlShort,
            cumulativeImpactName: `${efficiencyType?.impactNode?.name} ${
              data.actionEfficiencyPairs[activeEfficiency]?.invertImpact
                ? reductionText
                : ''
            }`,
            cumulativeCostUnit: efficiencyType?.costUnit.htmlShort,
            cumulativeCostName: efficiencyType?.costNode?.name,
            cumulativeEfficiencyUnit: efficiencyType?.efficiencyUnit.htmlShort,
            cumulativeEfficiencyName: efficiencyType?.label,
            efficiencyCap: efficiencyType?.plotLimitEfficiency ?? undefined,
          };
          Object.assign(out, efficiencyProps);
          return out;
        })
        .filter(
          (action) =>
            actionGroup === 'undefined' || actionGroup === action.group?.id
        ),
    [data, actionGroup, activeEfficiency, yearRange]
  );

  const refetching = networkStatus === NetworkStatus.refetch;

  if (error) {
    return (
      <Container className="pt-5">
        <GraphQLError errors={error} />
      </Container>
    );
  }

  if (!data) {
    return <ContentLoader />;
  }

  return (
    <>
      <HeaderSection>
        <Container fluid="lg">
          <PageHeader>
            <h1>{t('actions')}</h1>
          </PageHeader>
          {(page.actionListLeadParagraph || page.actionListLeadTitle) && (
            <Row>
              <Col md={{ size: 10, offset: 1 }}>
                <PageHeader>
                  <HeaderCard>
                    <h2>{page.actionListLeadTitle}</h2>
                    <Description
                      dangerouslySetInnerHTML={{
                        __html: page.actionListLeadParagraph,
                      }}
                    />
                  </HeaderCard>
                </PageHeader>
              </Col>
            </Row>
          )}
        </Container>
        <Container fluid="lg">
          <SettingsForm className="text-light mt-4">
            <Row>
              {hasEfficiency && (
                <Col md={4} className="d-flex">
                  <FormGroup>
                    <Label for="impact">{t('actions-impact-on')}</Label>
                    <Input
                      id="impact"
                      name="select"
                      type="select"
                      onChange={(e) =>
                        setActiveEfficiency(Number(e.target.value))
                      }
                    >
                      {data.actionEfficiencyPairs.map((impactGroup, indx) => (
                        <option value={indx} key={indx}>
                          {impactGroup.label}
                        </option>
                      ))}
                    </Input>
                  </FormGroup>
                </Col>
              )}
              {data.instance.actionGroups.length > 1 && (
                <Col md={4} className="d-flex">
                  <FormGroup>
                    <Label for="type">{t('actions-group-type')}</Label>
                    <Input
                      id="type"
                      name="select"
                      type="select"
                      onChange={(e) => setActionGroup(e.target.value)}
                    >
                      <option value="undefined" default>
                        {t('action-groups-all')}
                      </option>
                      {data.instance.actionGroups.map((actionGroup, indx) => (
                        <option value={actionGroup.id} key={actionGroup.id}>
                          {actionGroup.name}
                        </option>
                      ))}
                    </Input>
                  </FormGroup>
                </Col>
              )}
              <Col md={4} className="d-flex">
                <div className="d-flex align-items-end me-3">
                  <FormGroup>
                    <Label for="sort">{t('actions-sort-by')}</Label>
                    <Input
                      id="sort"
                      name="select"
                      type="select"
                      onChange={(e) => setSortBy(e.target.value)}
                    >
                      <option value="default" selected={sortBy === 'default'}>
                        {t('actions-sort-default')}
                      </option>
                      {hasEfficiency && (
                        <option
                          value="cumulativeEfficiency"
                          selected={sortBy === 'cumulativeEfficiency'}
                        >
                          {t('actions-sort-efficiency')}
                        </option>
                      )}
                      <option
                        value="cumulativeImpact"
                        selected={sortBy === 'cumulativeImpact'}
                      >
                        {t('actions-sort-cumulative-impact')}
                      </option>
                      <option value="impact" selected={sortBy === 'impact'}>
                        {t('actions-sort-impact')}
                      </option>
                      {hasEfficiency && (
                        <option
                          value="cumulativeCost"
                          selected={sortBy === 'cumulativeCost'}
                        >
                          {t('actions-sort-cost')}
                        </option>
                      )}
                    </Input>
                  </FormGroup>
                </div>
                <div className="d-flex align-items-end">
                  <FormGroup>
                    <ButtonGroup>
                      <Button
                        color="white"
                        outline
                        onClick={(e) => setAscending(true)}
                        active={ascending === true}
                      >
                        <SortDown />
                      </Button>
                      <Button
                        color="white"
                        outline
                        onClick={(e) => setAscending(false)}
                        active={ascending === false}
                      >
                        <SortUp />
                      </Button>
                    </ButtonGroup>
                  </FormGroup>
                </div>
              </Col>
            </Row>
          </SettingsForm>
          <ActionCount>
            {t('actions-count', { count: usableActions.length })}
            <ScenarioBadge type="activeScenario">
              {t('scenario')}: {activeScenario?.name}
            </ScenarioBadge>
          </ActionCount>
        </Container>
      </HeaderSection>
      <ActionsViewTabs>
        <Container>
          <div role="tablist">
            <Tab
              className={`nav-link ${listType === 'list' ? 'active' : ''}`}
              onClick={() => setListType('list')}
              role="tab"
              tabIndex={0}
              aria-selected={listType === 'list'}
              aria-controls="list-view"
              id="list-tab"
            >
              <Grid3x2GapFill /> {t('actions-as-list')}
            </Tab>
            {hasEfficiency ? (
              <Tab
                className={`nav-link ${listType === 'mac' ? 'active' : ''}`}
                onClick={() => setListType('mac')}
                role="tab"
                tabIndex={0}
                aria-selected={listType === 'mac'}
                aria-controls="list-view"
                id="list-tab"
              >
                <BarChartLineFill /> {t('actions-as-efficiency')}
              </Tab>
            ) : (
              <Tab
                className={`nav-link ${
                  listType === 'comparison' ? 'active' : ''
                }`}
                onClick={() => setListType('comparison')}
                role="tab"
                tabIndex={0}
                aria-selected={listType === 'comparison'}
                aria-controls="list-view"
                id="list-tab"
              >
                <BarChartLineFill /> {t('actions-as-comparison')}
              </Tab>
            )}
          </div>
        </Container>
      </ActionsViewTabs>
      <Container fluid="lg" className="mb-5">
        <Row>
          <Col>
            {listType === 'list' && (
              <ActionsList
                actions={usableActions}
                displayType="displayTypeYearly"
                yearRange={yearRange}
                sortBy={sortBy}
                sortAscending={ascending}
                refetching={refetching}
              />
            )}
            {listType === 'mac' && (
              <ActionsMac
                actions={usableActions}
                actionEfficiencyPairs={
                  data.actionEfficiencyPairs[activeEfficiency]
                }
                t={t}
                actionGroups={data.instance.actionGroups}
                sortBy={sortBy}
                sortAscending={ascending}
                refetching={refetching}
              />
            )}
            {listType === 'comparison' && (
              <ActionsComparison
                actions={usableActions}
                t={t}
                actionGroups={data.instance.actionGroups}
                sortBy={sortBy}
                sortAscending={ascending}
                refetching={refetching}
                displayYears={yearRange}
              />
            )}
          </Col>
        </Row>
      </Container>
      <SettingsPanelFull />
    </>
  );
}

export default ActionListPage;
