import styled from 'styled-components';
import { useTranslation } from 'next-i18next';
import HighlightValue from 'components/general/HighlightValue';
import { formatNumber } from 'common/preprocess';

const EfficiencyDisplayWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  border-radius: 0;
`;

const EfficiencyDisplayHeader = styled.div<{ muted?: boolean }>`
  flex: 0 0 100%;
  padding: ${(props) => props.theme.spaces.s050};
  border: 1px solid ${(props) => props.theme.graphColors.grey030};
  line-height: 1;
  font-size: 0.75rem;
  font-weight: 700;
  color: ${(props) =>
    props.muted
      ? props.theme.graphColors.grey050
      : props.theme.graphColors.grey090};
`;

const EfficiencyDisplayItem = styled.div`
  flex: 1 1 90px;
  text-align: left;
  padding: ${(props) => props.theme.spaces.s050};
  border: 1px solid ${(props) => props.theme.graphColors.grey030};
  border-top: 0;
`;

type EfficiencyDisplayProps = {
  impactCumulative: number;
  impactCumulativeUnit: string;
  impactCumulativeLabel: string;
  costCumulative: number;
  costCumulativeUnit: string;
  costCumulativeLabel: string;
  efficiencyCumulative: number;
  efficiencyCumulativeUnit: string;
  efficiencyCumulativeLabel: string;
  efficiencyCap: number;
  yearRange: [number, number];
  muted?: boolean;
};

const EfficiencyDisplay = (props: EfficiencyDisplayProps) => {
  const {
    impactCumulative,
    impactCumulativeUnit,
    impactCumulativeLabel,
    costCumulative,
    costCumulativeUnit,
    costCumulativeLabel,
    efficiencyCumulative,
    efficiencyCumulativeUnit,
    efficiencyCumulativeLabel,
    efficiencyCap,
    yearRange,
    muted,
  } = props;
  const { t, i18n } = useTranslation();

  const displayEfficiency =
    Math.abs(efficiencyCumulative) < efficiencyCap
      ? formatNumber(efficiencyCumulative || 0, i18n.language)
      : '-';
  const displayImpact =
    Math.abs(efficiencyCumulative) < efficiencyCap
      ? formatNumber(impactCumulative || 0, i18n.language)
      : '0';

  return (
    <EfficiencyDisplayWrapper>
      <EfficiencyDisplayHeader muted={muted}>
        {`${efficiencyCumulativeLabel} ${yearRange[0]}–${yearRange[1]}`}
      </EfficiencyDisplayHeader>
      <EfficiencyDisplayItem>
        <HighlightValue
          displayValue={displayImpact}
          header={impactCumulativeLabel}
          unit={impactCumulativeUnit}
          muted={muted}
          size="sm"
        />
      </EfficiencyDisplayItem>
      <EfficiencyDisplayItem>
        <HighlightValue
          displayValue={`${formatNumber(costCumulative || 0, i18n.language)}`}
          header={costCumulativeLabel}
          unit={costCumulativeUnit}
          muted={muted}
          size="sm"
        />
      </EfficiencyDisplayItem>
      <EfficiencyDisplayItem>
        <HighlightValue
          displayValue={displayEfficiency}
          header={t('efficiency')}
          unit={efficiencyCumulativeUnit}
          muted={muted}
        />
      </EfficiencyDisplayItem>
    </EfficiencyDisplayWrapper>
  );
};

export default EfficiencyDisplay;
