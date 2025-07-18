import { NetworkStatus, useQuery, useReactiveVar } from '@apollo/client';
import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import {
  Box,
  Card,
  CardActionArea,
  CardActions,
  CardContent,
  Skeleton,
  Typography,
  alpha,
  lighten,
} from '@mui/material';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';

import type { DecisionLevel } from '@/common/__generated__/graphql';
import type {
  GetActionListQuery,
  GetActionListQueryVariables,
} from '@/common/__generated__/graphql';
import { activeGoalVar } from '@/common/cache';
import { findActionEnabledParam } from '@/common/preprocess';
import { GET_ACTION_LIST } from '@/queries/getActionList';

import ParameterWidget from '../general/ParameterWidget';

const ActionsList = styled.div`
  display: flex;
  flex-flow: row wrap;
  gap: 0.5rem 1rem;
`;

const ActionsListItem = styled.div`
  flex: 1 1 320px;
`;

const WidgetWrapper = styled.div`
  font-size: 0.8rem;

  .form-check-input {
    &:checked {
      background-color: ${(props) => props.theme.brandDark};
      border-color: ${(props) => props.theme.brandDark};
    }
  }

  .form-check-label {
    margin-left: 0.5rem;
    line-height: 1;
  }
`;

type ActionListCardProps = {
  action: ActionsSummaryAction;
  refetching: boolean;
};

/* Nice mock skeleton loader */
const LoaderSkeleton = ({ t }: { t: TFunction }) => {
  return (
    <Box>
      <Typography variant="caption" component="p" sx={{ mb: 1, color: 'text.disabled' }}>
        {t('active-actions', {
          count: 0,
          total: 0,
        })}
      </Typography>
      <ActionsList>
        <ActionsListItem>
          <Skeleton variant="rounded" height={100} />
        </ActionsListItem>
        <ActionsListItem>
          <Skeleton variant="rounded" height={100} sx={{ opacity: 0.75 }} />
        </ActionsListItem>
        <ActionsListItem>
          <Skeleton variant="rounded" height={100} sx={{ opacity: 0.5 }} />
        </ActionsListItem>
        <ActionsListItem>
          <Skeleton variant="rounded" height={100} sx={{ opacity: 0.25 }} />
        </ActionsListItem>
      </ActionsList>
    </Box>
  );
};

const ActionListCard = (props: ActionListCardProps) => {
  const { action, refetching } = props;
  const actionParameterSwitch = findActionEnabledParam(action.parameters);
  const isActive = !refetching && (actionParameterSwitch?.boolValue ?? false);
  const theme = useTheme();

  const categoryColor = action.group?.color ?? theme.actionColor;
  const categoryColorLight = lighten(categoryColor, 0.5);

  return (
    <Card
      sx={{
        borderLeft: `7px solid ${isActive ? categoryColor : categoryColorLight}`,
        backgroundColor: alpha(theme.palette.background.paper, 0.7),
        color: 'text.disabled',
        '&[data-active]': {
          backgroundColor: 'background.paper',
          color: 'text.primary',
        },
      }}
      elevation={isActive ? 2 : 0}
      data-active={isActive ? '' : undefined}
    >
      <CardActionArea sx={{ height: '100%' }}>
        <CardContent sx={{ py: 1 }}>
          <Typography variant="caption" component="p" sx={{ mb: 0.5 }}>
            {action.group?.name}
          </Typography>
          <Typography
            variant="h6"
            component="h3"
            sx={{ color: isActive ? 'text.primary' : 'text.disabled' }}
          >
            {action.name}
          </Typography>
        </CardContent>
      </CardActionArea>

      <CardActions sx={{ pt: 0 }}>
        {actionParameterSwitch && (
          <ParameterWidget
            key={actionParameterSwitch.id}
            parameter={actionParameterSwitch}
            WidgetWrapper={WidgetWrapper}
          />
        )}
      </CardActions>
    </Card>
  );
};

type ActionsSummaryAction = GetActionListQuery['actions'][0];

const ActionsChooser = () => {
  const activeGoal = useReactiveVar(activeGoalVar);
  const { t } = useTranslation();
  const queryResp = useQuery<GetActionListQuery, GetActionListQueryVariables>(GET_ACTION_LIST, {
    variables: {
      goal: activeGoal?.id ?? null,
    },
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true,
  });

  const { error, loading, networkStatus, previousData } = queryResp;
  const data = queryResp.data ?? previousData;
  const refetching = networkStatus === NetworkStatus.refetch;

  if (loading && !previousData) {
    return <LoaderSkeleton t={t} />;
  }
  if (error) {
    return (
      <>
        <div>{t('error-loading-data')}</div>
      </>
    );
  }

  const actions = (data?.actions ?? []).filter(
    (action) => action.decisionLevel === ('MUNICIPALITY' as DecisionLevel)
  );
  const activeActions = actions.filter((action) => {
    const { parameters } = action;
    const enabledParam = parameters.find(
      (param) => param.node && param.id === `${param.node.id}.enabled`
    ) as ((typeof parameters)[0] & { __typename: 'BoolParameterType' }) | null;
    if (!enabledParam) return false;
    return enabledParam.boolValue;
  });

  return (
    <Box>
      <Typography variant="caption" component="p" sx={{ mb: 1 }}>
        {t('active-actions', {
          count: activeActions.length,
          total: actions.length,
        })}
      </Typography>
      <ActionsList>
        {actions.map((action) => {
          return (
            <ActionsListItem key={action.id}>
              <ActionListCard action={action} refetching={refetching} />
            </ActionsListItem>
          );
        })}
        <ActionsListItem />
        <ActionsListItem />
      </ActionsList>
    </Box>
  );
};

export default ActionsChooser;
