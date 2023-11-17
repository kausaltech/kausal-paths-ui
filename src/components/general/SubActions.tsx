import { useState } from 'react';

import styled from 'styled-components';

import { GetActionContentQuery } from 'common/__generated__/graphql';
import { ActionGoal } from './ActionGoal';
import { StreamField } from 'components/common/StreamField';

type SubAction = NonNullable<GetActionContentQuery['action']>['subactions'][0];

const SubactionsHeader = styled.h2`
  font-size: ${({ theme }) => theme.fontSizeLg};
`;

const ActionTabs = styled.div`
  display: flex;
  max-width: 100%;
  overflow-x: auto;
`;

const ActionTab = styled.button<{
  $isActive: boolean;
  $isEnabled: boolean;
}>`
  display: inline-flex;
  align-items: flex-start;
  flex-direction: column;
  flex: 1 1 90px;
  margin-right: 5px;
  border: 1px solid ${(props) => props.theme.graphColors.grey020};
  border-top: 1px solid
    ${(props) =>
      props.$isActive
        ? props.theme.graphColors.blue070
        : props.theme.graphColors.grey020};
  border-bottom: 1px solid
    ${(props) =>
      props.$isActive
        ? props.theme.graphColors.grey000
        : props.theme.graphColors.grey010};
  padding: 0.75rem 0.75rem 1.25rem 0.75rem;
  text-align: left;
  background-color: ${({ theme, $isActive }) =>
    $isActive ? theme.cardBackground.primary : theme.cardBackground.secondary};

  &:last-child {
    margin-right: 0;
  }

  &:hover {
    background-color: ${({ theme }) => theme.cardBackground.primary};
    border-top: 1px solid ${({ theme }) => theme.graphColors.blue070};
  }
`;

const DisabledActionTab = styled.button`
  display: inline-flex;
  align-items: flex-start;
  flex-direction: column;
  flex: 1 1 90px;
  margin-right: 5px;
  padding: 0.75rem 0.75rem 1.25rem 0.75rem;
  text-align: left;
  border: 0;
  color: ${({ theme }) => theme.textColor.primary};
`;

const TabTitle = styled.h3`
  display: flex;
  font-size: ${({ theme }) => theme.fontSizeBase};
  font-weight: 700;
  line-height: 1.2;

  div {
    margin-right: 6px;
  }
`;

const ActionContentCard = styled.div`
  margin-top: -1px;
  border: 1px solid ${(props) => props.theme.graphColors.grey020};
  padding: 2rem 1rem;
  background-color: ${({ theme }) => theme.cardBackground.primary};
`;

const ActionDescription = styled.div`
  max-width: ${({ theme }) => theme.breakpointSm};
  margin-bottom: 1rem;
`;

const SubActionsContainer = styled.div`
  background-color: ${({ theme }) => theme.cardBackground.secondary};
  padding: ${({ theme }) => theme.spaces.s100};
`;

type ActionContentProps = {
  action: NonNullable<GetActionContentQuery['action']>['subactions'][0];
};

const ActionContent = ({ action }: ActionContentProps) => {
  return (
    <ActionContentCard
      id={`action-content-${action.id}`}
      role="tabpanel"
      tabIndex={0}
      aria-labelledby={`action-tab-${action.id}`}
    >
      <ActionDescription>
        {!!action.goal && (
          <ActionGoal dangerouslySetInnerHTML={{ __html: action.goal }} />
        )}
        {action.shortDescription || action.description ? (
          <div
            dangerouslySetInnerHTML={{
              __html: action.shortDescription || action.description,
            }}
          />
        ) : null}
      </ActionDescription>

      {action.body?.map((block, i) => <StreamField key={i} block={block} />)}
    </ActionContentCard>
  );
};

type SubActionsProps = {
  actions: NonNullable<GetActionContentQuery['action']>['subactions'];
  activeSubAction?: string;
  setActiveSubAction: (subAction?: string) => void;
};

const SubActions = (props: SubActionsProps) => {
  const { actions, setActiveSubAction } = props;
  const [activeTab, setActiveTab] = useState('null');

  const handleClick = (id: string) => {
    if (activeTab === id) {
      setActiveTab('null');
      setActiveSubAction(undefined);
    } else {
      setActiveTab(id);
      setActiveSubAction(id);
    }
  };

  return (
    <SubActionsContainer>
      <SubactionsHeader id="subactions">Ziele und Massnahmen</SubactionsHeader>
      <ActionTabs role="tablist" aria-labelledby="subactions">
        {actions.map((action: SubAction) =>
          action.goal ||
          action.shortDescription ||
          action.description ||
          action.downstreamNodes.length > 0 ? (
            <ActionTab
              role="tab"
              aria-selected={action.id === activeTab}
              aria-controls={`action-content-${action.id}`}
              id={`action-tab-${action.id}`}
              tabIndex={0}
              key={action.id}
              onClick={() => handleClick(action.id)}
              $isActive={action.id === activeTab}
              $isEnabled={action.isEnabled}
            >
              <TabTitle>
                <div>{action.name}</div>
              </TabTitle>
            </ActionTab>
          ) : (
            <DisabledActionTab key={action.id} disabled>
              <TabTitle>
                <div>{action.name}</div>
              </TabTitle>
            </DisabledActionTab>
          )
        )}
      </ActionTabs>
      {activeTab !== 'null' && (
        <ActionContent
          action={actions.find((action) => action.id === activeTab)}
        />
      )}
    </SubActionsContainer>
  );
};

export default SubActions;
