import { useLocale, useTranslations } from 'next-intl';

import { beautifyValue } from '@common/utils/format';

import { useInstance } from '@/common/instance';
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
  const t = useTranslations('common');
  const locale = useLocale();
  const instance = useInstance();
  const significantDigits = instance?.features?.showSignificantDigits || undefined;

  const displayEfficiency =
    Math.abs(efficiencyCumulative) < efficiencyCap
      ? beautifyValue(efficiencyCumulative || 0, locale, significantDigits)
      : '-';

  const displayImpact =
    Math.abs(efficiencyCumulative) < efficiencyCap
      ? beautifyValue(impactCumulative || 0, locale, significantDigits)
      : '0';

  return (
    <StyledDisplayWrapper>
      <StyledDisplayHeader $muted={!!muted}>{t('financial-impact')}</StyledDisplayHeader>
      <StyledItemsWrapper>
        <StyledDisplayItem>
          <HighlightValue
            displayValue={beautifyValue(costCumulative || 0, locale, significantDigits)}
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
