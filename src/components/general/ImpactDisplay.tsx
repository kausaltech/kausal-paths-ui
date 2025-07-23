import styled from 'styled-components';
import { useTranslation } from 'next-i18next';
import { useInstance } from '@/common/instance';
import { formatNumber } from '@/common/preprocess';
import HighlightValue from './HighlightValue';

export const StyledDisplayWrapper = styled.div`
  border-radius: 0;
  border-top: 1px solid ${({ theme }) => theme.graphColors.grey030};

  &:not(:first-child) {
    border-top: none;
  }
`;

export const StyledDisplayHeader = styled.div<{ $muted: boolean }>`
  flex: 0 0 100%;
  padding: ${(props) => props.theme.spaces.s050};
  line-height: 1;
  font-size: 0.75rem;
  font-weight: 700;
  color: ${({ theme, $muted }) => ($muted ? theme.textColor.tertiary : theme.textColor.secondary)};
  border: 1px solid ${({ theme }) => theme.graphColors.grey030};
  border-top: none;
`;

export const StyledItemsWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  border-left: 1px solid ${({ theme }) => theme.graphColors.grey030};
`;

export const StyledDisplayItem = styled.div`
  flex: 1;
  text-align: left;
  padding: ${(props) => props.theme.spaces.s050};
  border-right: 1px solid ${({ theme }) => theme.graphColors.grey030};
  border-bottom: 1px solid ${({ theme }) => theme.graphColors.grey030};
`;

type ImpactDisplayProps = {
  effectCumulative: number | undefined;
  effectYearly: number;
  yearRange: [number, number];
  unitCumulative: string | undefined;
  unitYearly: string | undefined;
  muted?: boolean | undefined;
  size?: 'sm' | 'md' | 'lg';
  impactName?: string;
  children?: React.ReactNode;
} & typeof ImpactDisplayDefaultProps;

const ImpactDisplayDefaultProps = {
  muted: false,
  size: 'md',
};

const ImpactDisplay = (props: ImpactDisplayProps) => {
  const {
    effectCumulative,
    effectYearly,
    yearRange,
    unitCumulative,
    unitYearly,
    muted,
    size,
    impactName,
  } = props;
  const { t, i18n } = useTranslation();

  const cumulativePrefix = effectCumulative !== undefined ? (effectCumulative > 0 ? '+' : '') : '';
  const yearlyPrefix = effectYearly > 0 ? '+' : '';

  const instance = useInstance();

  return (
    <StyledDisplayWrapper>
      <StyledDisplayHeader $muted={muted}>
        {t('emissions-impact')}
        {impactName && ` (${impactName})`}
      </StyledDisplayHeader>
      <StyledItemsWrapper>
        {effectCumulative !== undefined && instance.features.showAccumulatedEffects && (
          <StyledDisplayItem>
            <HighlightValue
              displayValue={`${cumulativePrefix}${formatNumber(
                effectCumulative || 0,
                i18n.language
              )}`}
              header={`${t('impact-total')} ${yearRange[0]}–${yearRange[1]}`}
              unit={unitCumulative}
              muted={muted}
              size={size}
            />
          </StyledDisplayItem>
        )}
        <StyledDisplayItem>
          <HighlightValue
            displayValue={`${yearlyPrefix}${formatNumber(effectYearly || 0, i18n.language)}`}
            header={`${t('impact-on-year')} ${yearRange[1]}`}
            unit={unitYearly}
            muted={muted}
            size={size}
          />
        </StyledDisplayItem>
      </StyledItemsWrapper>
    </StyledDisplayWrapper>
  );
};

ImpactDisplay.defaultProps = ImpactDisplayDefaultProps;

export default ImpactDisplay;
