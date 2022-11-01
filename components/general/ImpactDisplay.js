import styled from 'styled-components';
import HighlightValue from 'components/general/HighlightValue';
import { beautifyValue } from 'common/preprocess';
import { useTranslation } from 'next-i18next';

const ImpactDisplayWrapper = styled.div`
display: flex;
flex-wrap: wrap;
border: 1px solid ${(props) => props.theme.graphColors.grey030};
border-radius:  calc(${(props) => props.theme.cardBorderRadius}/2);
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

  const cumulativePrefix = effectCumulative > 0 ? '+' : '';
  const yearlyPrefix = effectYearly > 0 ? '+' : '';

  return (
    <ImpactDisplayWrapper>
      <ImpactDisplayHeader muted={muted}>
        { t('impact') }
      </ImpactDisplayHeader>
      { effectCumulative !== undefined && (
      <ImpactDisplayItem>
        <HighlightValue
          displayValue={`${cumulativePrefix}${beautifyValue(effectCumulative || 0)}`}
          header={`${t('impact-total')} ${yearRange[0]}–${yearRange[1]}`}
          unit={unitCumulative}
          muted={muted}
        />
      </ImpactDisplayItem>
      )}
      <ImpactDisplayItem>
        <HighlightValue
          displayValue={`${yearlyPrefix}${beautifyValue(effectYearly || 0)}`}
          header={`${t('impact-on-year')} ${yearRange[1]}`}
          unit={unitYearly}
          muted={muted}
        />
      </ImpactDisplayItem>
    </ImpactDisplayWrapper>
  );
};

export default ImpactDisplay;
