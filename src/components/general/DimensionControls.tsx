import { useId, useState } from 'react';

import {
  Radio,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  radioClasses,
  toggleButtonClasses,
  toggleButtonGroupClasses,
} from '@mui/material';

import { ChevronDown, ChevronRight } from 'react-bootstrap-icons';

import { useTheme } from '@common/themes';
import styled from '@common/themes/styled';

import { useTranslations } from '@/common/i18n';
import PopoverTip from '@/components/common/PopoverTip';

// Render as separate, wrapping buttons instead of a joined segmented control,
// so that long (translated) labels can wrap onto multiple rows.
const ChoiceButtons = styled(ToggleButtonGroup)`
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spaces.s050};

  && .${toggleButtonGroupClasses.grouped} {
    margin: 0;
    border: ${({ theme }) => theme.inputBorderWidth} solid ${({ theme }) => theme.themeColors.dark};
    /* Every button reserves the series color bar, so nothing shifts when the
       breakdown dimension changes; buttons without a chart series show it greyed out */
    border-left: 0.625rem solid ${({ theme }) => theme.graphColors.grey030};
    border-radius: ${({ theme }) => theme.inputBorderRadius};
    padding: ${({ theme }) => `${theme.spaces.s025} ${theme.spaces.s100}`};
    font-size: ${({ theme }) => theme.fontSizeSm};
    line-height: ${({ theme }) => theme.lineHeightMd};
    text-transform: none;
    color: ${({ theme }) => theme.themeColors.black};
  }

  /* "All" isn't a chart series, so it doesn't get the color bar */
  && .${toggleButtonGroupClasses.grouped}.all-categories {
    border-left: ${({ theme }) => theme.inputBorderWidth} solid
      ${({ theme }) => theme.themeColors.dark};
  }

  && .${toggleButtonGroupClasses.grouped}.${toggleButtonClasses.selected} {
    background-color: ${({ theme }) => theme.themeColors.dark};
    color: ${({ theme }) => theme.themeColors.white};
  }

  /* MUI removes the left border between adjacent selected buttons, as it assumes
     they're joined together; ours are separate, so restore the color bar */
  &&
    .${toggleButtonGroupClasses.grouped}.${toggleButtonClasses.selected}
    + .${toggleButtonGroupClasses.grouped}.${toggleButtonClasses.selected} {
    margin-left: 0;
    border-left: 0.625rem solid ${({ theme }) => theme.graphColors.grey030};
  }

  && .${toggleButtonGroupClasses.grouped}.${toggleButtonClasses.disabled} {
    border-color: ${({ theme }) => theme.graphColors.grey030};
    color: ${({ theme }) => theme.graphColors.grey050};
  }
`;

/**
 * Dimension headers side by side (wrapping on narrow screens), with one shared
 * panel for the categories of the dimension whose filter is open. On desktop the
 * panel spans the full width below all the headers; on narrow screens it's placed
 * right after its own dimension, using flex `order`.
 */
const DimensionRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  column-gap: ${({ theme }) => theme.spaces.s300};
  row-gap: ${({ theme }) => theme.spaces.s100};
`;

// Separates the controls from the chart below them
const ControlsContainer = styled.div`
  padding-bottom: ${({ theme }) => theme.spaces.s200};
  margin-bottom: ${({ theme }) => theme.spaces.s200};
  border-bottom: 1px solid ${({ theme }) => theme.graphColors.grey030};
`;

const ControlsLabel = styled.div`
  font-size: ${({ theme }) => theme.fontSizeSm};
  font-weight: ${({ theme }) => theme.fontWeightBold};
  line-height: ${({ theme }) => theme.lineHeightMd};
  margin-bottom: ${({ theme }) => theme.spaces.s050};
`;

const DimensionItem = styled.div<{ $order: number }>`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spaces.s050};
  order: ${({ $order }) => $order};
`;

const DimensionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spaces.s050};
`;

const FilterPanel = styled.div<{ $mobileOrder: number; $desktopOrder: number }>`
  flex-basis: 100%;
  order: ${({ $mobileOrder }) => $mobileOrder};
  padding: ${({ theme }) => theme.spaces.s100};
  background-color: ${({ theme }) => theme.themeColors.white};

  @media (min-width: ${({ theme }) => theme.breakpoints.values.md}px) {
    order: ${({ $desktopOrder }) => $desktopOrder};
  }
`;

const FilterPanelTitle = styled.div`
  font-size: ${({ theme }) => theme.fontSizeSm};
  font-weight: ${({ theme }) => theme.fontWeightBold};
  line-height: ${({ theme }) => theme.lineHeightMd};
  margin-bottom: ${({ theme }) => theme.spaces.s050};
`;

const ColumnLabel = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spaces.s050};
  font-size: ${({ theme }) => theme.fontSizeBase};
  font-weight: ${({ theme }) => theme.fontWeightBold};
  line-height: ${({ theme }) => theme.lineHeightMd};
  margin: 0;

  &:is(label) {
    cursor: pointer;
  }
`;

// Size of the breakdown radio button
const RADIO_SIZE = '1.25rem';

// When the breakdown radios are shown, indent the filter button to line up with the label text
const FilterToggleWrapper = styled.div<{ $indented: boolean }>`
  padding-left: ${({ $indented, theme }) =>
    $indented ? `calc(${RADIO_SIZE} + ${theme.spaces.s050})` : 0};
`;

const ALL_CATEGORIES = '__all__';

// Shown as selected (like a selected category button) when the dimension has an active filter
const FilterToggle = styled.button<{ $active: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spaces.s050};
  border: ${({ theme }) => theme.inputBorderWidth} solid ${({ theme }) => theme.themeColors.dark};
  border-radius: ${({ theme }) => theme.inputBorderRadius};
  padding: ${({ theme }) => `${theme.spaces.s025} ${theme.spaces.s100}`};
  font-size: ${({ theme }) => theme.fontSizeSm};
  line-height: ${({ theme }) => theme.lineHeightMd};
  color: ${({ $active, theme }) => ($active ? theme.themeColors.white : theme.themeColors.black)};
  background-color: ${({ $active, theme }) => ($active ? theme.themeColors.dark : 'transparent')};
  cursor: pointer;

  &:hover {
    background-color: ${({ $active, theme }) =>
      $active ? theme.themeColors.dark : theme.graphColors.grey010};
  }
`;

export type CategoryOption = { id: string; label: string; selected: boolean; hasData: boolean };

const CategoryButtons = ({
  label,
  options,
  seriesColors,
  onChange,
}: {
  label: string;
  options: CategoryOption[];
  /** Chart colors by category id, set only for the dimension the chart is broken down by */
  seriesColors?: Map<string, string>;
  onChange: (selected: { id: string }[]) => void;
}) => {
  const t = useTranslations();
  const selectedIds = options.filter((opt) => opt.selected).map((opt) => opt.id);

  return (
    <ChoiceButtons
      size="small"
      // With nothing selected, nothing is filtered out, so "All" is shown as active
      value={selectedIds.length ? selectedIds : [ALL_CATEGORIES]}
      aria-label={label}
      onChange={(_event, values: string[]) => {
        // Clicking "All" while categories are selected clears the filter
        const ids =
          values.includes(ALL_CATEGORIES) && selectedIds.length
            ? []
            : values.filter((id) => id !== ALL_CATEGORIES);
        onChange(ids.map((id) => ({ id })));
      }}
    >
      <ToggleButton value={ALL_CATEGORIES} className="all-categories">
        {t('common.plot-filter-all')}
      </ToggleButton>
      {options.map((opt) =>
        // Keep selected options enabled even without data, so they can be deselected
        opt.hasData || opt.selected ? (
          <ToggleButton
            key={opt.id}
            value={opt.id}
            // Inline style, so it wins over the grey color bar set in ChoiceButtons
            style={
              seriesColors?.has(opt.id) ? { borderLeftColor: seriesColors.get(opt.id) } : undefined
            }
          >
            {opt.label}
          </ToggleButton>
        ) : (
          // Disabled buttons don't fire pointer events, so the tooltip needs a wrapper
          <Tooltip key={opt.id} title={t('common.plot-filter-no-data')}>
            <span>
              <ToggleButton value={opt.id} disabled>
                {opt.label}
              </ToggleButton>
            </span>
          </Tooltip>
        )
      )}
    </ChoiceButtons>
  );
};

export type ControlDimension = { id: string; label: string; helpText?: string | null };

const DimensionControls = <D extends ControlDimension>({
  dimensions,
  options,
  withBreakdown,
  slicedDimensionId,
  seriesColors,
  onSliceChange,
  onFilterChange,
}: {
  dimensions: D[];
  /** Category options for each dimension, in the same order as `dimensions` */
  options: CategoryOption[][];
  withBreakdown: boolean;
  slicedDimensionId: string | undefined;
  /** Chart colors by category id for the sliced dimension */
  seriesColors: Map<string, string>;
  onSliceChange: (dimensionId: string) => void;
  onFilterChange: (dim: D, selected: { id: string }[]) => void;
}) => {
  const t = useTranslations();
  const theme = useTheme();
  const breakdownName = useId();
  const breakdownLabelId = useId();
  const panelId = useId();
  // Only one dimension's categories are shown at a time
  const [openDimId, setOpenDimId] = useState<string | null>(null);
  const openIdx = dimensions.findIndex((dim) => dim.id === openDimId);
  const openDim = openIdx >= 0 ? dimensions[openIdx] : null;

  return (
    <ControlsContainer>
      {withBreakdown && (
        <ControlsLabel id={breakdownLabelId}>{t('common.plot-break-down-by')}</ControlsLabel>
      )}
      <DimensionRow>
        {dimensions.map((dim, idx) => {
          const selectedCount = options[idx].filter((opt) => opt.selected).length;
          const isOpen = dim.id === openDimId;
          return (
            <DimensionItem key={dim.id} $order={idx * 2}>
              <DimensionHeader>
                {withBreakdown ? (
                  <ColumnLabel as="label">
                    {/* A radio (only one dimension can be the breakdown), styled as a large checkbox */}
                    <Radio
                      name={breakdownName}
                      value={dim.id}
                      checked={dim.id === slicedDimensionId}
                      onChange={() => onSliceChange(dim.id)}
                      // A round outline with a filled dot when selected; kept large to
                      // match the filter buttons, but round so it isn't mistaken for a checkbox
                      icon={<span />}
                      checkedIcon={
                        <span
                          style={{
                            width: '0.625rem',
                            height: '0.625rem',
                            borderRadius: '50%',
                            backgroundColor: 'currentColor',
                          }}
                        />
                      }
                      slotProps={{ input: { 'aria-describedby': breakdownLabelId } }}
                      sx={{
                        flexShrink: 0,
                        width: RADIO_SIZE,
                        height: RADIO_SIZE,
                        padding: 0,
                        border: `${theme.inputBorderWidth} solid ${theme.themeColors.dark}`,
                        borderRadius: '50%',
                        color: theme.themeColors.dark,
                        backgroundColor: theme.themeColors.white,
                        '&:hover': { backgroundColor: theme.graphColors.grey010 },
                        [`&.${radioClasses.checked}`]: { color: theme.themeColors.dark },
                      }}
                    />
                    {dim.label}
                  </ColumnLabel>
                ) : (
                  <ColumnLabel>{dim.label}</ColumnLabel>
                )}
                {dim.helpText && <PopoverTip content={dim.helpText} />}
              </DimensionHeader>
              <FilterToggleWrapper $indented={withBreakdown}>
                <FilterToggle
                  type="button"
                  $active={selectedCount > 0}
                  aria-expanded={isOpen}
                  aria-controls={isOpen ? panelId : undefined}
                  // The visible label doesn't say which dimension the button filters
                  aria-label={`${t('common.plot-filter')}: ${dim.label}${selectedCount > 0 ? ` (${selectedCount})` : ''}`}
                  onClick={() => setOpenDimId(isOpen ? null : dim.id)}
                >
                  {t('common.plot-filter')}
                  {selectedCount > 0 && ` (${selectedCount})`}
                  {isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                </FilterToggle>
              </FilterToggleWrapper>
            </DimensionItem>
          );
        })}
        {openDim && (
          <FilterPanel
            id={panelId}
            $mobileOrder={openIdx * 2 + 1}
            $desktopOrder={dimensions.length * 2}
          >
            <FilterPanelTitle>{openDim.label}</FilterPanelTitle>
            <CategoryButtons
              label={openDim.label}
              options={options[openIdx]}
              seriesColors={openDim.id === slicedDimensionId ? seriesColors : undefined}
              onChange={(selected) => onFilterChange(openDim, selected)}
            />
          </FilterPanel>
        )}
      </DimensionRow>
    </ControlsContainer>
  );
};

export default DimensionControls;
