import { useTranslation } from 'next-i18next';

import { formatNumber } from '@/common/preprocess';
import HighlightValue from '@/components/general/HighlightValue';

import {
  StyledDisplayHeader,
  StyledDisplayItem,
  StyledDisplayWrapper,
  StyledItemsWrapper,
} from './ImpactDisplay';

type EfficiencyDisplayProps = {
  showImpact?: boolean;
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
    showImpact,
    impactCumulative,
    impactCumulativeUnit,
    impactCumulativeLabel,
    costCumulative,
    costCumulativeUnit,
    costCumulativeLabel,
    efficiencyCumulative,
    efficiencyCumulativeUnit,
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
    <StyledDisplayWrapper>
      <StyledDisplayHeader $muted={!!muted}>{t('financial-impact')}</StyledDisplayHeader>
      <StyledItemsWrapper>
        <StyledDisplayItem>
          <HighlightValue
            displayValue={`${formatNumber(costCumulative || 0, i18n.language)}`}
            header={`${costCumulativeLabel} ${yearRange[0]}-${yearRange[1]}`}
            unit={costCumulativeUnit}
            muted={muted}
            size="sm"
          />
        </StyledDisplayItem>
        <StyledDisplayItem>
          <HighlightValue
            displayValue={displayEfficiency}
            header={t('cost-efficiency')}
            unit={efficiencyCumulativeUnit}
            muted={muted}
            size="sm"
          />
        </StyledDisplayItem>
        {showImpact && (
          <StyledDisplayItem>
            <HighlightValue
              displayValue={displayImpact}
              header={impactCumulativeLabel}
              unit={impactCumulativeUnit}
              muted={muted}
              size="sm"
            />
          </StyledDisplayItem>
        )}
      </StyledItemsWrapper>
    </StyledDisplayWrapper>
  );
};

export default EfficiencyDisplay;
