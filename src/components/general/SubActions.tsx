import { useState } from 'react';
import * as Icon from 'react-bootstrap-icons';
import styled from 'styled-components';
import ImpactDisplay from './ImpactDisplay';
import ActionParameters from './ActionParameters';
import WatchActionCard from './WatchActionCard';
import { gql } from '@apollo/client';
import { SubActionCardFragment } from 'common/__generated__/graphql';

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
  padding: 0.75rem 0.75rem 1.25rem 0.75rem;
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

const ActionDescription = styled.div`
  margin-bottom: 1rem;
`;

const ActionMetrics = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 1rem;
`;

const WatchActionList = styled.div`
  display: flex;
`;

const ActionContent = (props: any) => {
  const { action } = props;
  // console.log("action", action)

  const watchActions = [
    {
      id: "1",
      name: "Restwertentschädigung und Förderprogramm für den Heizungsersatz",
      description: "Die Stadt unterstützt den Heizungsersatz durch die Förderprogramme Heizungsersatz und Restwertentschädigung",
      link: "https://draft-cap.watch-test.kausal.tech/actions/44",
      image: "https://api.watch.kausal.tech/media/images/geran-de-klerk-qzgN45hseN0-un.2e16d0ba.fill-1600x600-c50_MMrreyB.jpg",
    },
    {
      id: "2",
      name: "Informationsangebot über Energis",
      description: "Die Stadt stellt im Energis online relevante Informationen zum Heizungsersatz zur Verfügung",
      link: "https://draft-cap.watch-test.kausal.tech/actions/43",
      image: "https://api.watch.kausal.tech/media/images/geran-de-klerk-qzgN45hseN0-un.2e16d0ba.fill-1600x600-c50_MMrreyB.jpg",
    },
  ];

  return (
    <ActionContentCard>
      <ActionDescription>
        {action?.description}
      </ActionDescription>
      <h5>How do we make this happen?</h5>
      <WatchActionList>
        {watchActions.map((watchAction: any) => (
          <WatchActionCard
            key={watchAction.id}
            action={watchAction}
          />
        ))}
      </WatchActionList>
    </ActionContentCard>
  );
};

type SubActionsProps = {
  actions: SubActionCardFragment[];
}

const SubActions = (props: SubActionsProps) => {
  const { actions, activeSubAction, setActiveSubAction } = props;
  const [activeTab, setActiveTab] = useState("null");

  const handleClick = (id: string) => {
    if (activeTab === id) {
      setActiveTab("null");
      setActiveSubAction(undefined);
    } else {
      setActiveTab(id);
      setActiveSubAction(id);
    };
  };

  return (
    <div className="mt-4">
      <h3>Ziele und Massnahmen</h3>
      <ActionTabs>
      {actions.map((action: any) => (
        <ActionTab
          key={action.id}
          onClick={()=>handleClick(action.id)}
          isActive={action.id === activeTab}
          isEnabled={action.isEnabled}
        >
          <TabTitle>
            <div>
              { action.name }
            </div>
          </TabTitle>
        </ActionTab>
      ))}
      </ActionTabs>
      { activeTab !== "null" &&
      <ActionContent action={actions.find((action) => action.id === activeTab)} /> }
    </div>
    
  );
};

export const SUBACTIONS_FRAGMENT = gql`
  fragment SubActionCard on ActionNode {
    id
    name
    description
    shortDescription
    isEnabled
    parameters {
      id
    }
  }
`;

export default SubActions;
