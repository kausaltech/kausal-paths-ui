import styled from 'styled-components';
import { useTranslation } from 'next-i18next';
import ActionListCard from 'components/general/ActionListCard';

const ActionCount = styled.div`
  margin: 0 0 ${({ theme }) => theme.spaces.s100};
  color: ${({ theme }) => theme.themeColors.white};
`;

const ActionListList = styled.ul`
  margin: -8rem 0 2rem;
  padding: 0;
  list-style: none;
`;

const ActionsList = (props) => {
  const { actions, displayType, yearRange } = props;
  const { t } = useTranslation();

  return (
    <ActionListList>
      <ActionCount>
        {t('actions-count', { count: actions.length})}
      </ActionCount>
      { actions?.map((action) => (
        <ActionListCard
          key={action.id}
          action={action}
          displayType={displayType}
          displayYears={yearRange}
          level={action.decisionLevel}
        />
      ))}
    </ActionListList>
  )
};

export default ActionsList;