import styled from 'styled-components';
import HighlightValue from 'components/general/HighlightValue';
import { useTranslation } from 'react-i18next';

const ImpactDisplayWrapper = styled.div`
display: flex;
flex-wrap: wrap;
border: 1px solid ${(props) => props.theme.graphColors.grey030};
border-radius: 6px;
`;

const ImpactDisplayHeader = styled.div`
flex: 0 0 100%;
padding: 0.5rem;
border-bottom: 1px solid ${(props) => props.theme.graphColors.grey030};
line-height: 1;
font-size: 0.75rem;
font-weight: 700;
color: ${(props) => (props.muted ? props.theme.graphColors.grey050 : props.theme.graphColors.grey090)};
`;

const ImpactDisplayItem = styled.div`
flex: 1 1 90px;
text-align: left;
padding: .5rem;

&:not(:nth-child(2)) {
  border-left: 1px solid ${(props) => props.theme.graphColors.grey030};
}
`;

const ImpactDisplay = (props) => {
  const { effectCumulative, effectYearly, yearRange, unitCumulative, unitYearly, muted } = props;
  const { t } = useTranslation();

  return (
    <ImpactDisplayWrapper>
      <ImpactDisplayHeader muted={muted}>
        { t('impact') }
      </ImpactDisplayHeader>
      { effectCumulative && (
      <ImpactDisplayItem>
        <HighlightValue
          displayValue={effectCumulative}
          header={`${t('impact-total')} ${yearRange[0]} - ${yearRange[1]}`}
          unit={unitCumulative}
          muted={muted}
        />
      </ImpactDisplayItem>
      )}
      <ImpactDisplayItem>
        <HighlightValue
          displayValue={effectYearly}
          header={`${t('impact-on-year')} ${yearRange[1]}`}
          unit={unitYearly}
          muted={muted}
        />
      </ImpactDisplayItem>
    </ImpactDisplayWrapper>
  );
};

export default ImpactDisplay;
