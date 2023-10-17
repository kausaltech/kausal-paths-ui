import { useState } from 'react';

import styled from 'styled-components';

import WatchActionCard from './WatchActionCard';
import { SubActionCardFragment } from 'common/__generated__/graphql';
import { useTranslation } from 'common/i18n';

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

const WatchActionList = styled.div`
  display: flex;
  max-width: 100%;
  flex-wrap: wrap;
`;

type ActionContentProps = {
  action: SubActionCardFragment;
};

const ActionContent = (props: ActionContentProps) => {
  const { action } = props;
  const { t } = useTranslation();

  // Create test subsubaction data for one particular action
  // TODO: Get this data from the API
  const watchActions =
    action.id === 'fossil_fuel_heater_to_district_heat'
      ? [
          {
            id: '1',
            name: 'Restwertentschädigung und Förderprogramm für den Heizungsersatz',
            description:
              'Die Stadt unterstützt den Heizungsersatz durch die Förderprogramme Heizungsersatz und Restwertentschädigung',
            link: '',
            image:
              'https://api.watch.kausal.tech/media/images/geran-de-klerk-qzgN45hseN0-un.2e16d0ba.fill-1600x600-c50_MMrreyB.jpg',
          },
          {
            id: '2',
            name: 'Informationsangebot über Energis',
            description:
              'Die Stadt stellt im Energis online relevante Informationen zum Heizungsersatz zur Verfügung',
            link: 'https://draft-cap.watch-test.kausal.tech/actions/43',
            image:
              'https://api.watch.kausal.tech/media/images/geran-de-klerk-qzgN45hseN0-un.2e16d0ba.fill-1600x600-c50_MMrreyB.jpg',
          },
          {
            id: '3',
            name: 'Informationsangebot über Energis',
            description:
              'Die Stadt stellt im Energis online relevante Informationen zum Heizungsersatz zur Verfügung',
            link: 'https://draft-cap.watch-test.kausal.tech/actions/43',
            image: '',
          },
        ]
      : [];

  return (
    <ActionContentCard
      id={`action-content-${action.id}`}
      role="tabpanel"
      tabIndex={0}
      aria-labelledby={`action-tab-${action.id}`}
    >
      <ActionDescription>
        {action.shortDescription || action.description ? (
          <div
            dangerouslySetInnerHTML={{
              __html: action.shortDescription || action.description,
            }}
          />
        ) : null}
      </ActionDescription>
      {watchActions.length > 0 && (
        <>
          <h5>{t('watch-action-list-title')}</h5>
          <WatchActionList>
            {watchActions.map((watchAction: any) => (
              <WatchActionCard key={watchAction.id} action={watchAction} />
            ))}
            <WatchActionCard />
            <WatchActionCard />
          </WatchActionList>
        </>
      )}
    </ActionContentCard>
  );
};

type SubActionsProps = {
  actions: SubActionCardFragment[];
  activeSubAction?: string;
  setActiveSubAction: (subAction?: string) => void;
};

const SubActions = (props: SubActionsProps) => {
  const { actions, activeSubAction, setActiveSubAction } = props;
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
        {actions.map((action: any) =>
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
            <DisabledActionTab disabled>
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
