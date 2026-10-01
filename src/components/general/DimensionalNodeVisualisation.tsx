import {
  type RefObject,
  type SetStateAction,
  useCallback,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  Alert,
  Box,
  IconButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Menu,
  MenuItem,
  Radio,
  Snackbar,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  radioClasses,
  toggleButtonClasses,
  toggleButtonGroupClasses,
} from '@mui/material';

import { useReactiveVar } from '@apollo/client/react';
import { kebabCase } from 'lodash-es';
import {
  CheckLg,
  ChevronDown,
  ChevronRight,
  FiletypeCsv,
  FiletypePng,
  FiletypeXls,
  ThreeDotsVertical,
} from 'react-bootstrap-icons';

import { type ChartHandle } from '@common/components/Chart';
import NodeGraph, { type NodeGraphLabels } from '@common/components/paths/NodeGraph';
import { useTheme } from '@common/themes';
import styled from '@common/themes/styled';

import type { DimensionalNodeMetricFragment } from '@/common/__generated__/graphql';
import { activeGoalVar } from '@/common/cache';
import { genColorsFromTheme, setUniqueColors } from '@/common/colors';
import { type TFunction, useTranslations } from '@/common/i18n';
import { type InstanceContextType, useInstance } from '@/common/instance';
import { useAxisLabelFormatter, useNumberFormatter } from '@/common/numbers';
import PopoverTip from '@/components/common/PopoverTip';
import { useSiteWithSetter } from '@/context/site';
import {
  DimensionalMetric,
  type DimensionalMetric as DimensionalMetricType,
  type MetricCategoryValues,
  type MetricSlice,
  type SliceConfig,
} from '@/data/metric';
import {
  getProgressTrackingScenario,
  metricHasProgressTrackingScenario,
} from '@/utils/progress-tracking';

const Tools = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  text-align: right;
  .btn-link {
    text-decoration: none;
  }
  .icon {
    width: 1.25rem !important;
    height: 1.25rem !important;
    vertical-align: -0.2rem;
  }
`;

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

type CategoryOption = { id: string; label: string; selected: boolean; hasData: boolean };

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

type ControlDimension = { id: string; label: string; helpText?: string | null };

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
                      // Empty when unselected, a check mark when selected, like a large checkbox
                      icon={<span />}
                      checkedIcon={<CheckLg size={14} />}
                      slotProps={{ input: { 'aria-describedby': breakdownLabelId } }}
                      sx={{
                        flexShrink: 0,
                        width: '1.25rem',
                        height: '1.25rem',
                        padding: 0,
                        border: `${theme.inputBorderWidth} solid ${theme.themeColors.dark}`,
                        borderRadius: theme.inputBorderRadius,
                        color: theme.themeColors.dark,
                        backgroundColor: theme.themeColors.white,
                        '&:hover': { backgroundColor: theme.graphColors.grey010 },
                        [`&.${radioClasses.checked}, &.${radioClasses.checked}:hover`]: {
                          color: theme.themeColors.white,
                          backgroundColor: theme.themeColors.dark,
                        },
                      }}
                    />
                    {dim.label}
                  </ColumnLabel>
                ) : (
                  <ColumnLabel>{dim.label}</ColumnLabel>
                )}
                {dim.helpText && <PopoverTip content={dim.helpText} />}
              </DimensionHeader>
              <div>
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
              </div>
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

type BaselineForecast = { year: number; value: number };

const getLongUnit = (cube: DimensionalMetricType, unit: string, t: TFunction) => {
  let longUnit = unit;
  // FIXME: Nasty hack to show 'CO2e' where it might be applicable until
  // the backend gets proper support for unit specifiers.
  if (cube.hasDimension('emission_scope') && !cube.hasDimension('greenhouse_gases')) {
    if (unit === 't/Einw./a') {
      longUnit = t('tco2-e-inhabitant');
    } else if (unit === 'kt/a') {
      longUnit = t('ktco2-e');
    }
  }

  return longUnit;
};

const getFilteredYears = (
  slice: MetricSlice,
  metric: NonNullable<DimensionalNodeMetricFragment['metricDim']>,
  instance: InstanceContextType,
  startYear: number,
  endYear: number
) => {
  // Create an array of visualizable years that takes into account the user selected range and the reference year
  const lastMetricYear = metric.years.slice(-1)[0];
  const usableEndYear = lastMetricYear && endYear > lastMetricYear ? lastMetricYear : endYear;

  // Check if forecast range overlaps with visible range [startYear, usableEndYear]
  const forecastStart = slice.forecastYears[0];
  const forecastEnd = slice.forecastYears[slice.forecastYears.length - 1];
  const hasOverlap = forecastStart <= usableEndYear && startYear <= forecastEnd;

  // Define visible forecast range (intersection of forecast range and visible range)
  const visibleForecastRange: [number, number] | null = hasOverlap
    ? [Math.max(forecastStart, startYear), Math.min(forecastEnd, usableEndYear)]
    : null;

  // Let's check if there is a gap between the minimum historical year and the reference year
  // And double check if we actually want to show the reference year (plan setting)
  // And user has selected the reference year as the start year of the chart
  const showReferenceYear =
    !!instance?.referenceYear &&
    startYear === instance.referenceYear &&
    instance.referenceYear !== instance.minimumHistoricalYear;
  const referenceYear = showReferenceYear ? instance.referenceYear : undefined;

  // Filter years to only include those between startYear and usableEndYear
  // Make sure the years between referenceYear and minimumHistoricalYear are not included
  const filteredHistoricalYears = slice.historicalYears.filter(
    (year) => year >= startYear && year <= usableEndYear && year >= instance.minimumHistoricalYear
  );
  const filteredForecastYears = slice.forecastYears.filter(
    (year) => year >= startYear && year <= usableEndYear && year >= instance.minimumHistoricalYear
  );
  const allYears = [...slice.historicalYears, ...slice.forecastYears];
  const filteredYears = [...filteredHistoricalYears, ...filteredForecastYears];

  // If we are showing the reference year, add it to the beginning of the filtered years
  if (referenceYear) {
    filteredYears.unshift(referenceYear);
  }
  // Create indices for filtering values
  const yearIndices = filteredYears.map((year) => allYears.indexOf(year));
  return { filteredYears, yearIndices, referenceYear, visibleForecastRange };
};

const downloadChartAsPng = (dataUrl: string, filename: string) => {
  const safeName = kebabCase(filename) || 'chart';
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = `${safeName}.png`;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const ToolsMenu = ({
  cube,
  sliceConfig,
  chartRef,
  pngFilename,
}: {
  cube: DimensionalMetricType;
  sliceConfig: SliceConfig;
  chartRef: RefObject<ChartHandle | null>;
  pngFilename: string;
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const t = useTranslations();

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleDownloadPng = () => {
    const dataUrl = chartRef.current?.getDataURL({
      type: 'png',
      pixelRatio: 2,
      backgroundColor: '#fff',
    });
    if (dataUrl) {
      downloadChartAsPng(dataUrl, pngFilename);
    } else {
      setErrorMessage(t('errors.download-error'));
    }
    handleClose();
  };

  return (
    <Tools>
      <IconButton
        id="tools-button"
        aria-controls={open ? 'tools-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        onClick={handleClick}
        aria-label={t('common.download-data')}
      >
        <ThreeDotsVertical />
      </IconButton>
      <Menu
        id="tools-menu"
        anchorEl={anchorEl}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        open={open}
        onClose={handleClose}
        slotProps={{
          list: {
            'aria-labelledby': 'tools-button',
          },
        }}
      >
        <ListSubheader> {` ${t('common.download-data')}`}</ListSubheader>
        <MenuItem onClick={() => void cube.downloadData(sliceConfig, 'xlsx')}>
          <ListItemIcon>
            <FiletypeXls />
          </ListItemIcon>
          <ListItemText>XLS</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => void cube.downloadData(sliceConfig, 'csv')}>
          <ListItemIcon>
            <FiletypeCsv />
          </ListItemIcon>
          <ListItemText>CSV</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDownloadPng}>
          <ListItemIcon>
            <FiletypePng />
          </ListItemIcon>
          <ListItemText>PNG</ListItemText>
        </MenuItem>
      </Menu>
      <Snackbar
        open={errorMessage !== null}
        autoHideDuration={4000}
        onClose={() => setErrorMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="error" onClose={() => setErrorMessage(null)}>
          {errorMessage}
        </Alert>
      </Snackbar>
    </Tools>
  );
};

type DimensionalNodeVisualisationProps = {
  title: string;
  baselineForecast?: BaselineForecast[];
  metric: NonNullable<DimensionalNodeMetricFragment['metricDim']>;
  startYear: number;
  endYear: number;
  withControls?: boolean;
  withTools?: boolean;
  color?: string | null;
  onClickMeasuredEmissions?: (year: number) => void;
  forecastTitle?: string;
};

export default function DimensionalNodeVisualisation({
  title,
  metric,
  startYear,
  withControls = true,
  withTools = true,
  endYear,
  baselineForecast,
  color,
  onClickMeasuredEmissions,
  forecastTitle,
}: DimensionalNodeVisualisationProps) {
  const t = useTranslations();
  const activeGoal = useReactiveVar(activeGoalVar);
  const theme = useTheme();
  const [site] = useSiteWithSetter();
  const instance = useInstance();
  const formatValue = useNumberFormatter();
  const formatAxisValue = useAxisLabelFormatter();
  const scenarios = site?.scenarios ?? [];
  const hasProgressTracking = metricHasProgressTrackingScenario(metric, scenarios);
  const metrics = useMemo(() => {
    // Create DimensionalMetric class instances for the default and progress tracking
    const defaultMetric = new DimensionalMetric(metric);

    return {
      default: defaultMetric,
      progress: hasProgressTracking ? new DimensionalMetric(metric, 'progress_tracking') : null,
    };
  }, [metric, hasProgressTracking]);

  // Slice config defines the dimension (dimensionId) and categories (categories[]) we are currently visualizing
  // Slice config is affected by the active goal and user selections
  const sliceConfigKey = `${metric.id}:${activeGoal?.id ?? ''}`;
  const defaultConfig = useMemo(
    () => metrics.default.getDefaultSliceConfig(activeGoal),
    [activeGoal, metrics.default]
  );
  const [storedSliceConfig, setStoredSliceConfig] = useState<{
    key: string;
    config: SliceConfig;
  }>(() => ({ key: sliceConfigKey, config: defaultConfig }));
  const sliceConfig =
    storedSliceConfig.key === sliceConfigKey ? storedSliceConfig.config : defaultConfig;
  const setSliceConfig = useCallback(
    (update: SetStateAction<SliceConfig>) => {
      setStoredSliceConfig((current) => {
        const currentConfig = current.key === sliceConfigKey ? current.config : defaultConfig;
        const config = typeof update === 'function' ? update(currentConfig) : update;
        return { key: sliceConfigKey, config };
      });
    },
    [defaultConfig, sliceConfigKey]
  );

  const activeDimensionLabel = metrics.default.getDimensionLabel(sliceConfig.dimensionId);

  // If we have category filters active, let's add them to the viz subtitle.
  // For grouped dimensions, show the selected groups rather than their expanded categories.
  const activeCategoryLabels: { dimension: string; categories: string[] }[] = [];
  for (const [key, value] of Object.entries(sliceConfig.categories)) {
    if (value?.categories?.length && value.categories.length > 0) {
      activeCategoryLabels.push({
        dimension: metrics.default.getDimensionLabel(key) ?? '',
        categories: value.groups?.length
          ? value.groups.map((grp) => metrics.default.getGroupLabel(key, grp) ?? '')
          : value.categories.map((cat) => metrics.default.getCategoryLabel(cat) ?? ''),
      });
    }
  }
  const subtitle = activeCategoryLabels
    .map((dim) => `${dim.dimension}: ${dim.categories.join(' & ')}`)
    .join(', ')
    .trim();

  // Get the dimension that is currently sliced by
  const slicedDim = metrics.default.dimensions.find((dim) => dim.id === sliceConfig.dimensionId);

  const slice: MetricSlice = slicedDim
    ? metrics.default.sliceBy(slicedDim.id, true, sliceConfig.categories)
    : metrics.default.flatten(sliceConfig.categories);

  const goals = metrics.default.getGoalsForChoice(sliceConfig.categories);
  const showBaseline =
    baselineForecast && site?.baselineName && instance.features?.baselineVisibleInGraphs;

  // Define current year setup
  const { filteredYears, yearIndices, referenceYear, visibleForecastRange } = getFilteredYears(
    slice,
    metric,
    instance,
    startYear,
    endYear
  );

  const filteredProgressValues: number[] = [];
  const filteredProgressYears: number[] = [];

  // Create filtered data for progress tracking
  // Only show progress data for years where the metric has actual measured data
  const measureDatapointYears = metric.measureDatapointYears ?? [];
  const hasMeasuredYearsBeyondBaseline = measureDatapointYears.some(
    (year) => year !== instance.referenceYear && year !== site?.minYear
  );

  if (hasProgressTracking && metrics.progress && slicedDim && hasMeasuredYearsBeyondBaseline) {
    const progressScenario = getProgressTrackingScenario(site.scenarios);
    const progressSlice = metrics.progress.sliceBy(slicedDim.id, true, sliceConfig.categories);
    // Filter progress years to only include years where this specific metric has measured data
    const progressYears =
      progressScenario?.actualHistoricalYears?.filter(
        (year) =>
          year !== instance.referenceYear &&
          measureDatapointYears.includes(year) &&
          year !== site?.minYear
      ) ?? [];

    const referenceYearIndex = slice.historicalYears.findIndex(
      (year) => year === instance.referenceYear
    );

    const historicalYears =
      referenceYearIndex !== -1
        ? progressSlice.historicalYears.slice(referenceYearIndex + 1)
        : progressSlice.historicalYears;

    const historicalValues =
      referenceYearIndex !== -1
        ? (progressSlice?.totalValues?.historicalValues.slice(referenceYearIndex + 1) ?? [])
        : (progressSlice?.totalValues?.historicalValues ?? []);

    if (progressSlice.totalValues && progressYears?.length) {
      const lastHist = slice.historicalYears.length - 1;
      const totalSumX = [site.minYear, ...historicalYears, ...progressSlice.forecastYears];
      const totalSumY = [
        slice?.totalValues?.historicalValues?.[lastHist] ?? 0,
        ...historicalValues,
        ...progressSlice.totalValues.forecastValues,
      ];

      /**
       * Filter out data for years that are not in the progress scenario.
       * Include the reference year in order to draw a line from the total reference
       * year emissions to the first observed year emissions.
       */
      const { x: filteredX, y: filteredY } = totalSumX.reduce<{
        x: number[];
        y: (number | null)[];
      }>(
        (acc, x, index) =>
          [instance.referenceYear, ...progressYears].includes(x)
            ? { x: [...acc.x, x], y: [...acc.y, totalSumY[index]] }
            : acc,
        { x: [] as number[], y: [] as number[] }
      );

      filteredProgressYears.push(...filteredX);
      filteredProgressValues.push(...filteredY.filter((y): y is number => y !== null));
    }
  }

  // Collect full data for each category in the chart

  const dataCategories: { name: string; values: (number | null)[]; color: string | null }[] =
    slice.categoryValues.map((cv: MetricCategoryValues) => {
      return {
        name: cv.category.label,
        values: [...cv.historicalValues, ...cv.forecastValues],
        color: cv.color,
      };
    });

  // Create simple tables for category data, goal data, baseline data, progress data, and total data
  // Using the filtered years
  const headerRow = ['Category', ...filteredYears];
  const datasetTable = [
    headerRow,
    ...dataCategories.map((row) => [row.name, ...yearIndices.map((idx) => row.values[idx])]),
  ].filter((row) => row.length > 0);

  const goalTable =
    goals !== null
      ? [
          headerRow,
          [
            'Goal',
            ...filteredYears.map((year) => goals?.find((goal) => goal.year === year)?.value),
          ],
        ]
      : null;

  const baselineTable = showBaseline
    ? [
        headerRow,
        [
          'Baseline',
          ...filteredYears.map(
            (year) => baselineForecast?.find((forecast) => forecast.year === year)?.value
          ),
        ],
      ]
    : null;

  const progressTable =
    filteredProgressValues.length > 0 && filteredProgressYears.length > 0
      ? [
          headerRow,
          [
            'Progress',
            ...filteredYears.map(
              (year) => filteredProgressValues[filteredProgressYears.indexOf(year)] ?? null
            ),
          ],
        ]
      : null;

  const totalTable =
    slice.totalValues && metric.stackable
      ? [
          headerRow,
          [
            'Total',
            ...yearIndices.map(
              (idx) =>
                [...slice.totalValues!.historicalValues, ...slice.totalValues!.forecastValues][idx]
            ),
          ],
        ]
      : null;

  // Define colors for the categories
  const defaultColor = color || theme.graphColors.blue050;
  // Colors are assigned over the *unfiltered* series of the sliced dimension, so that
  // a category keeps its color regardless of which categories are filtered out
  const colorSlice = slicedDim ? metrics.default.sliceBy(slicedDim.id, true, {}) : slice;
  const seriesColors = new Map<string, string>();

  if (colorSlice.categoryValues.length > 1) {
    // If we were asked to use a specific color, we generate the color scheme around it.
    // But always use category set color if available
    if (color || colorSlice.categoryValues.some((cv) => cv.color)) {
      // This mutates the colorSlice.categoryValues array!!
      setUniqueColors(
        colorSlice.categoryValues,
        (cv) => cv.color,
        (cv, color) => {
          cv.color = color;
        },
        defaultColor
      );
      colorSlice.categoryValues.forEach((cv) => {
        seriesColors.set(cv.category.id, cv.color ?? defaultColor);
      });
    } else {
      // If no specific color was provided, we generate a color scheme from the theme
      const themeColors = genColorsFromTheme(theme, colorSlice.categoryValues.length);
      colorSlice.categoryValues.forEach((cv, idx) => {
        seriesColors.set(cv.category.id, themeColors[idx]);
      });
    }
  }
  // If there is only one series in total, we use the default color
  const categoryColors = slice.categoryValues.map(
    (cv) => seriesColors.get(cv.category.id) ?? defaultColor
  );
  // Colors of the series visible in the chart, for the category buttons of the sliced dimension
  const visibleSeriesColors = new Map(
    slice.categoryValues.map((cv, idx) => [cv.category.id, categoryColors[idx]])
  );

  // Check if the data has any negative values, in order to decide if we want to show the total line
  // We could use the user selected year range here only, but let's show the total line even if negative values are filtered out
  const hasNegativeValues = slice.categoryValues.some(
    (cv) =>
      cv.historicalValues.some((value) => Number(value) < 0) ||
      cv.forecastValues.some((value) => Number(value) < 0)
  );

  // Let's create UI for selecting dimensions and categories
  // Dimensions with fewer than two categories with data can't change the chart, so they're left out
  const controlDims = metrics.default.getSelectableDimensions();
  const hasGroups = controlDims.some((dim) => dim.groups.length); // Typically direct & indirect emissions

  const dimensionOptions = controlDims.map((dim) =>
    metrics.default.getOptionsForDimension(dim.id, sliceConfig.categories)
  );

  const controls =
    withControls && (controlDims.length > 1 || hasGroups) ? (
      <DimensionControls
        dimensions={controlDims}
        options={dimensionOptions}
        withBreakdown={controlDims.length > 1}
        slicedDimensionId={slicedDim?.id}
        seriesColors={visibleSeriesColors}
        onSliceChange={(dimensionId) => {
          setSliceConfig((old) => ({ ...old, dimensionId }));
        }}
        onFilterChange={(dim, selected) => {
          setSliceConfig((old) => metrics.default.updateChoice(dim, old, selected));
        }}
      />
    ) : null;

  const chartRef = useRef<ChartHandle | null>(null);
  const chartTitle =
    `${title}` + (subtitle && activeDimensionLabel ? `: ${activeDimensionLabel}` : '');

  // Naughtily use showRefreshPrompt to determine if this is a NZP instance
  const predictionLabel = instance.features.showRefreshPrompt
    ? t('common.planned')
    : t('common.pred');
  // The common NodeGraph reads bare keys against a flat message namespace; this
  // app's messages are namespaced, so inject the already-translated strings.
  const labels: NodeGraphLabels = {
    total: t('common.plot-total'),
    goal: t('common.target'),
    baseline: t('common.plot-baseline'),
    progress: t('common.calculated-emissions'),
    measured: t('common.plot-measured'),
    comparisonYear: t('common.comparison-year'),
    forecast: t('common.table-scenario-forecast'),
  };

  return (
    <>
      {controls}
      <Box sx={{ position: 'relative' }}>
        <NodeGraph
          title={chartTitle}
          subtitle={subtitle}
          dataTable={datasetTable}
          goalTable={goalTable}
          baselineTable={baselineTable}
          progressTable={progressTable}
          totalTable={totalTable}
          unit={{
            // getLongUnit applies the CO2e correction (see its FIXME). The shared
            // NodeGraph uses htmlShort for tooltip rows, so apply it there too or
            // tooltips regress to the raw unit while the axis shows CO2e.
            htmlLong: getLongUnit(metrics.default, metric.unit.htmlShort, t),
            htmlShort: getLongUnit(metrics.default, metric.unit.htmlShort, t),
          }}
          referenceYear={referenceYear}
          forecastRange={visibleForecastRange}
          categoryColors={categoryColors}
          theme={theme}
          formatValue={formatValue}
          formatAxisValue={formatAxisValue}
          maximumFractionDigits={instance.features?.maximumFractionDigits ?? undefined}
          predictionLabel={predictionLabel}
          labels={labels}
          baselineLabel={site?.baselineName}
          showTotalLine={hasNegativeValues && metric.stackable && dataCategories.length > 1}
          onClickMeasuredEmissions={onClickMeasuredEmissions}
          forecastTitle={forecastTitle}
          stackable={metric.stackable}
          chartRef={chartRef}
        />
        {withTools && (
          <ToolsMenu
            cube={metrics.default}
            sliceConfig={sliceConfig}
            chartRef={chartRef}
            pngFilename={chartTitle}
          />
        )}
      </Box>
    </>
  );
}
