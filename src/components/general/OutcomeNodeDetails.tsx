import { useMemo } from 'react';

import styled from '@emotion/styled';
import { Typography } from '@mui/material';
import { ActionLink, NodeLink } from '@/common/links';

const ActionsList = styled.ul`
  font-size: 0.9rem;
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
`;

const ActionGroup = styled.p`
  margin: 0;
  font-size: 0.8rem;
`;

const ActionsListCard = styled.li<{ active: boolean; $groupColor: string }>`
  position: relative;
  flex: 1 1 320px;
  min-height: 3rem;
  padding: 0.25rem 0.5rem;
  margin: 0.5rem;
  border: 1px solid ${(props) => props.theme.graphColors.grey010};
  border-left: 4px solid ${(props) => props.$groupColor};
  border-radius: 0.25rem;

  &:hover {
    background-color: ${(props) => props.theme.graphColors.grey010};
  }

  a {
    display: block;
    text-decoration: none;
    width: 100%;
    height: 100%;
  }

  a,
  a > .action-title {
    color: ${(props) =>
      props.active ? props.theme.graphColors.grey090 : props.theme.graphColors.grey050};
  }

  a > .action-title { 
    display: block; 
    font-size: 0.875rem; 
    font-weight: 600; 
    line-height: 1.2; 
    margin: 0.1rem 0 0; }
`;

const ActionListItem = (props) => {
  const { action } = props;
  const isActive = action.parameters.find(
    (param) => param.id == `${param.node.id}.enabled`
  )?.boolValue;
  const color = action.group?.color || '#000000';

  // console.log("ActionListItem", props, isActive)
  return (
    <ActionsListCard active={isActive} $groupColor={color}>
      <ActionLink action={action}>
        <a>
          {action.group && <ActionGroup>{action.group.name}</ActionGroup>}
          <span className="action-title">{action.name}</span>
        </a>
      </ActionLink>
    </ActionsListCard>
  );
};

const OutcomeNodeDetails = (props) => {
  const { node, t } = props;
  //console.log("OutcomeNodeDetails", props)

  const actions = useMemo(() => {
    const upstreamActions = [].concat(node.upstreamActions);
    upstreamActions.sort((a, b) => (a.group?.id > b.group?.id ? 1 : -1));
    return upstreamActions;
  }, [node.upstreamActions]);

  return (
    <div>
      {node.shortDescription && <div dangerouslySetInnerHTML={{ __html: node.shortDescription }} />}
      {actions.length > 0 && (
        <Typography variant="h5" component="h3" sx={{ mt: 1, mb: 1 }}>
          {t('actions-influencing-this', { sector: node.name })} ({actions.length})
        </Typography>
      )}
      <ActionsList>
        {actions.map((action) => (
          <ActionListItem key={action.id} action={action} />
        ))}
      </ActionsList>
      <p>
        <NodeLink node={node}>
          <a>{t('read-more')}</a>
        </NodeLink>
      </p>
    </div>
  );
};

export default OutcomeNodeDetails;
