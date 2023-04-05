import { useState } from 'react';
import * as Icon from 'react-bootstrap-icons';
import styled from 'styled-components';
import ImpactDisplay from './ImpactDisplay';
import ActionParameters from './ActionParameters';

const ActionTabs = styled.div`
  display: flex;
`;

const ActionTab = styled.button<{isActive : boolean, isEnabled: boolean}>`
  display: inline-flex;
  align-items: flex-start;
  flex-direction: column;
  flex: 1 1 90px;
  margin-right: 5px;
  border: 1px solid ${(props) => props.theme.graphColors.grey020};
  border-top: 1px solid
              ${(props) => props.isActive ? props.theme.graphColors.blue070 : props.theme.graphColors.grey020};
  border-bottom: 1px solid
    ${(props) => props.isActive ? props.theme.graphColors.grey000 : props.theme.graphColors.grey010};
  padding: .5rem;
  text-align: left;
  background-color: ${(props) => props.isActive ? props.theme.graphColors.grey000 : props.theme.graphColors.grey010};

  &:last-child {
    margin-right: 0;
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

  div {
    margin-right: 6px;
  }
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
        <ImpactDisplay
          effectCumulative="555"
          effectYearly="1111"
          yearRange={[2020, 2030]}
          unitCumulative="kt"
          unitYearly="kt"
          muted={!action.isEnabled}
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
  const [activeTab, setActiveTab] = useState("1");

  return (
    <div className="mt-4">
      <h3>Subactions</h3>
      <ActionTabs>
      {actions.map((action: any) => (
        <ActionTab
          key={action.id}
          onClick={()=>setActiveTab(action.id)}
          isActive={action.id === activeTab}
          isEnabled={action.isEnabled}
        >
          <TabType>Subaction</TabType>
          <TabTitle>
            <div>
              { action.isEnabled ? <Icon.CheckCircleFill color="green" /> : <Icon.XCircleFill color="red" />}
            </div>
            <div>
              { action.name }
            </div>
          </TabTitle>
        </ActionTab>
      ))}
      </ActionTabs>
      <ActionContent action={actions.find((action) => action.id === activeTab)} />
    </div>
    
  );
};

export default SubActions;
