import { useEffect, useState } from 'react';
import { gql, useMutation, useQuery, NetworkStatus, useReactiveVar } from '@apollo/client';
import styled from 'styled-components';
import { Input } from 'reactstrap';
import { activeGoalVar, activeScenarioVar } from 'common/cache';
import ContentLoader from 'components/common/ContentLoader';
import { GET_ACTION_LIST } from 'queries/getActionList';
import { GetActionListQuery, GetActionListQueryVariables } from 'common/__generated__/graphql';

import { useTranslation } from 'react-i18next';

const GlobalParametersPanel = styled.div`
  max-height: 400px;
  overflow-y: auto;
  padding: 2rem 0;
  background-color: ${(props) => props.theme.themeColors.white};
  border-top: 1px solid ${(props) => props.theme.graphColors.grey050};
  border-bottom: 1px solid ${(props) => props.theme.graphColors.grey050};
`;

const ActionsList = styled.div`
  display: flex;
  flex-flow: row wrap;
  gap: .5rem 1rem;
`;

const ActionsListItem = styled.div`
  flex: 1 1 320px;
`;

const ActionCard = styled.div<{active: boolean, groupColor: string}>`
  position: relative;
  flex: 1 1 320px;
  min-height: 3rem;
  height: 100%;
  padding: 0.25rem 0.5rem 0.25rem 1rem;
  border: 1px solid ${(props) => props.theme.graphColors.grey010};
  border-left: 4px solid ${(props) => props.groupColor};
  border-radius: 0.25rem;
  background-color: ${(props) => props.active ? props.theme.themeColors.white : props.theme.graphColors.grey010};

  &:hover {
    background-color: ${(props) => props.theme.graphColors.grey010};
  }

  a {
    display: block;
    text-decoration: none;
    width: 100%;
    height: 100%;
  }

  a, a > h6 {
    color: ${(props) => props.active ? props.theme.graphColors.grey090 : props.theme.graphColors.grey050};
  }
`;

const WidgetWrapper = styled.div`
  font-size: 0.8rem;

  .form-check-input {
    &:checked {
      background-color: ${(props) =>props.theme.brandDark};
      border-color: ${(props) =>props.theme.brandDark};
    }
  }

  .form-check-label {
    margin-left: 0.5rem;
    line-height: 1;
  }
`;

type StyledInputProps = {
  customized: boolean,
}

const SET_PARAMETER = gql`
  mutation SetGlobalParameterFromActionSummary($parameterId: ID!, $boolValue: Boolean, $numberValue: Float, $stringValue: String) {
    setParameter(id: $parameterId, boolValue: $boolValue, numberValue: $numberValue, stringValue: $stringValue) {
      ok
      parameter {
        isCustomized
        isCustomizable
        ... on BoolParameterType {
        boolValue: value
        boolDefaultValue: defaultValue
      }
      }
    }
  }
`;

const BoolWidget = (props) => {
  const { id, toggled, handleChange, loading, isCustomized, description } = props;
  const { t } = useTranslation();

  const label = description || t('will_be_implemented');

  return (
    <WidgetWrapper className="form-check form-switch">
      <input
        className="form-check-input"
        type="checkbox"
        role="switch" 
        id={id}
        name={id}
        checked={toggled}
        onChange={() => handleChange({ parameterId: id, boolValue: !toggled })}
        disabled={loading}
        style={{transform: 'scale(1.5)'}}
      />
      <label
        className="form-check-label"
        htmlFor={id}
      >
        {label}
        {isCustomized ? '*' : ''}
      </label>
    </WidgetWrapper>
  );
};


const ParameterWidget = (props) => {
  const { refetch, refetching, param } = props;
  const {
    __typename,
    numberValue,
    boolValue,
    stringValue,
  } = props.param;
  const [parameterValue, setParameterValue] = useState(numberValue || boolValue || stringValue);
  
  const activeScenario = useReactiveVar(activeScenarioVar);

  const [SetParameter, { loading: mutationLoading, error: mutationError }] = useMutation(SET_PARAMETER, {
    refetchQueries: 'active',
    onCompleted: () => {
      activeScenarioVar({ ...activeScenario });
    },
  });

  const handleUserSelection = (evt) => {
    SetParameter({ variables: evt });
  };

  switch(param.__typename) { 
    case 'BoolParameterType': return (
      <BoolWidget
        id={param.id}
        toggled={param.boolValue}
        handleChange={handleUserSelection}
        loading={mutationLoading}
        isCustomized={param.isCustomized}
        description={param.description}
      />);
    default: return null;
  };
}


const ActionListCard = (props) => {
  const { action, refetching } = props;
  const isActive = !refetching && action.parameters.find((param) => param.id == `${param.node.id}.enabled`)?.boolValue;

  const actionParameterSwitch = action.parameters.find((param) => param.id === `${param.node.id}.enabled`);

  return (
    <ActionCard
      active={isActive}
      groupColor={action.group?.color}
    >
      <small>{action.group?.name}</small>
      <h5>{ action.name }</h5>
      { actionParameterSwitch && (
        <ParameterWidget
          key={actionParameterSwitch.id}
          param={actionParameterSwitch}
          parameterType={actionParameterSwitch?.__typename}
        />
      )}
    </ActionCard>
  );
};

const ActionsSummary = (props) => {

  const activeGoal = useReactiveVar(activeGoalVar);
  const { t } = useTranslation();
  const queryResp = (
    useQuery<GetActionListQuery, GetActionListQueryVariables>(GET_ACTION_LIST, {
      variables: {
        goal: activeGoal?.id,
      },
      fetchPolicy: 'cache-and-network',
      notifyOnNetworkStatusChange: true,
    })
  );

  const { error, loading, networkStatus, previousData } = queryResp;
  const data = queryResp.data ?? previousData;
  const refetching = (networkStatus === NetworkStatus.refetch);

  if ((loading && !previousData)) {
    return <><ContentLoader /></>;
  } if (error) {
    return <><div>{ t('error-loading-data') }</div></>;
  }

  const { actions } = data;

  const activeActions = actions.filter((action) => {
    return action.parameters.find((param) => param.id === `${param.node.id}.enabled`).boolValue;
  });

  return (
    <GlobalParametersPanel>
      <p>{ activeActions.length}/{ actions.length } active { t('actions') }</p>
      <ActionsList>
        {actions.map((action) => {
          return (
            <ActionsListItem key={action.id}>
              <ActionListCard
                action={action}
                refetching={refetching}
              />
            </ActionsListItem>
          );
        })}
      </ActionsList>
    </GlobalParametersPanel>
  )
}

export default ActionsSummary;
