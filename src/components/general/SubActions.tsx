import { useState } from 'react';
import * as Icon from 'react-bootstrap-icons';
import styled from 'styled-components';
import { NodeLink } from 'common/links';
import ActionParameters from './ActionParameters';

const ActionTabs = styled.div`
  display: flex;
`;

const ActionTab = styled.button<{isEnabled: boolean}>`
  display: inline-flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-direction: column;
  flex: 1 1 90px;
  margin-right: 5px;
  border: 1px solid ${(props) => props.theme.graphColors.grey020};
  border-top: 2px solid
              ${(props) => props.theme.graphColors.blue070 };
  border-bottom: 1px solid
    ${(props) => props.theme.graphColors.grey000 };
  padding: .5rem;
  text-align: left;
  background-color: ${(props) => props.theme.graphColors.grey000 };
  color: ${(props) => props.isEnabled ? props.theme.themeColors.dark : props.theme.graphColors.grey050};

  &:last-child {
    margin-right: 0;
  }

  &:hover {
    border-top: 2px solid ${(props) => props.theme.graphColors.blue070};
  }
`;

const TabType = styled.div`
  font-size: 0.8rem;
  color: ${(props) => props.theme.graphColors.grey050};
`;

const TabTitle = styled.div`
  display: flex;
  font-weight: 700;
  line-height: 1.2;
  margin-bottom: 1rem;

  div {
    margin-right: 6px;
  }
`;

const TabImpact = styled.div`
  align-self: flex-end;
`;

const ActionContentCard = styled.div`
  border: 1px solid ${(props) => props.theme.graphColors.grey020};
  border-top: none;
  padding: 2rem 1rem;
  background-color: ${(props) => props.theme.graphColors.grey000};
`;

const ActionMetrics = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 1rem;
`;

const ActionContent = (props: any) => {
  const { action } = props;
  // console.log("action", action)
  return (
    <ActionContentCard>
      <ActionMetrics>
        <ActionParameters
          parameters={action.parameters}
        />
      </ActionMetrics>
      <p>
        {action.description}
      </p>
    </ActionContentCard>
  );
};

type SubActionsProps = {
  actions: any[];
}

const SubActions = (props: SubActionsProps) => {
  const { actions } = props;

  return (
    <div className="mt-4">
      <h3>Subactions</h3>
      <ActionTabs>
      {actions.map((action: any) => (
        <ActionTab
          key={action.id}
          isEnabled={action.isEnabled}
        >
          <div>
            <TabType>Subaction</TabType>
            <TabTitle>
              <div>
                { action.isEnabled ? <Icon.CheckCircleFill color="green" /> : <Icon.XCircleFill color="grey" />}
              </div>
              <NodeLink node={{id: action.id}}><a>
                { action.name }
              </a></NodeLink>
            </TabTitle>
          </div>
        </ActionTab>
      ))}
      </ActionTabs>
    </div>
    
  );
};

export default SubActions;
