import { useEffect, useMemo, useState } from 'react';

import { useReactiveVar } from '@apollo/client';
import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import {
  Box,
  Grid,
  IconButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Menu,
  MenuItem,
} from '@mui/material';
import { type TFunction, useTranslation } from 'next-i18next';
import { FiletypeCsv, FiletypeXls, ThreeDotsVertical } from 'react-bootstrap-icons';

import type { DimensionalNodeMetricFragment } from '@/common/__generated__/graphql';
import { activeGoalVar } from '@/common/cache';
import { genColorsFromTheme, setUniqueColors } from '@/common/colors';
import { type InstanceContextType, useFeatures, useInstance } from '@/common/instance';
import SelectDropdown from '@/components/common/SelectDropdown';
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

import NodeGraph from './NodeGraph';

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

const ToolsMenu = ({
  cube,
  sliceConfig,
}: {
  cube: DimensionalMetricType;
  sliceConfig: SliceConfig;
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const { t } = useTranslation();

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <Tools>
      <IconButton
        id="tools-button"
        aria-controls={open ? 'tools-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        onClick={handleClick}
        aria-label={t('download-data')}
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
        <ListSubheader> {` ${t('download-data')}`}</ListSubheader>
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
      </Menu>
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
  const { t } = useTranslation();
  const activeGoal = useReactiveVar(activeGoalVar);
  const theme = useTheme();
  const [site] = useSiteWithSetter();
  const instance = useInstance();
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
  const defaultConfig = metrics.default.getDefaultSliceConfig(activeGoal);
  const [sliceConfig, setSliceConfig] = useState<SliceConfig>(defaultConfig);

  useEffect(() => {
    /**
     * If the active goal changes, we will reset the grouping + filtering
     * to be compatible with the new choices (if the new goal has common
     * dimensions with our metric).
     */
    if (!activeGoal) return;
    const newDefault = metrics.default.getDefaultSliceConfig(activeGoal);
    setSliceConfig(newDefault);
  }, [activeGoal, metrics.default]);

  const activeDimensionLabel = metrics.default.getDimensionLabel(sliceConfig.dimensionId);

  // If we have category filters active, let's add them to the viz subtitle
  const activeCategoryLabels: { dimension: string; categories: string[] }[] = [];
  for (const [key, value] of Object.entries(sliceConfig.categories)) {
    if (value?.categories?.length && value.categories.length > 0) {
      activeCategoryLabels.push({
        dimension: metrics.default.getDimensionLabel(key) ?? '',
        categories:
          value?.categories?.map((cat) => metrics.default.getCategoryLabel(cat) ?? '') ?? [],
      });
    }
  }
  const subtitle = activeCategoryLabels
    .map((dim) => `${dim.dimension}: ${dim.categories.join(' & ')}`)
    .join(', ')
    .trim();

  /* DO WE NEED THE UseEffect HERE? REMOVED FOR NOW */

  // Get all sliceable dimensions for the current slice config
  const sliceableDims = metrics.default.dimensions.filter((dim) => !sliceConfig.categories[dim.id]);
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
  if (hasProgressTracking && metrics.progress && slicedDim) {
    const progressScenario = getProgressTrackingScenario(site.scenarios);
    const progressSlice = metrics.progress.sliceBy(slicedDim.id, true, sliceConfig.categories);
    const progressYears =
      progressScenario?.actualHistoricalYears?.filter((year) => year !== instance.referenceYear) ??
      [];

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
      const { x: filteredX, y: filteredY } = totalSumX.reduce(
        (acc, x, index) =>
          [instance.referenceYear, ...progressYears].includes(x)
            ? { x: [...acc.x, x], y: [...acc.y, totalSumY[index]] }
            : acc,
        { x: [] as number[], y: [] as number[] }
      );

      filteredProgressYears.push(...filteredX);
      filteredProgressValues.push(...filteredY.filter((y) => y !== null));
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
  const categoryColors: string[] = [];
  const someCategoriesHaveColorSet = slice.categoryValues.some((cv) => cv.color);

  if (dataCategories.length > 1) {
    // If we were asked to use a specific color, we generate the color scheme around it.
    // But always use category set color if available
    if (color || someCategoriesHaveColorSet) {
      // This mutates the slice.categoryValues array!!
      setUniqueColors(
        slice.categoryValues,
        (cv) => cv.color,
        (cv, color) => {
          cv.color = color;
        },
        defaultColor
      );
      categoryColors.push(...slice.categoryValues.map((cv) => cv.color ?? defaultColor));
    } else {
      // If no specific color was provided, we generate a color scheme from the theme
      categoryColors.push(...genColorsFromTheme(theme, dataCategories.length));
    }
  } else {
    // If there is only one category, we use the default color
    categoryColors.push(defaultColor);
  }

  // Check if the data has any negative values, in order to decide if we want to show the total line
  // We could use the user selected year range here only, but let's show the total line even if negative values are filtered out
  const hasNegativeValues = slice.categoryValues.some(
    (cv) =>
      cv.historicalValues.some((value) => Number(value) < 0) ||
      cv.forecastValues.some((value) => Number(value) < 0)
  );

  // Let's create UI for selecting dimensions and categories
  const hasGroups = metrics.default.dimensions.some((dim) => dim.groups.length); // Typically direct & indirect emissions

  const controls =
    withControls && (metric.dimensions.length > 1 || hasGroups) ? (
      <Grid container spacing={1} sx={{ marginBottom: 2 }}>
        {metric.dimensions.length > 1 && (
          <Grid size={{ md: 3 }} sx={{ display: 'flex' }} key="dimension">
            <SelectDropdown
              id="dimension"
              className="flex-grow-1"
              label={t('plot-choose-dimension')}
              onChange={(val) => {
                setSliceConfig((old) => ({
                  ...old,
                  dimensionId: val?.id || undefined,
                }));
              }}
              options={sliceableDims}
              value={sliceableDims.find((dim) => sliceConfig.dimensionId === dim.id) || null}
              isMulti={false}
              isClearable={false}
            />
          </Grid>
        )}

        {metrics.default.dimensions.map((dim) => {
          const options = metrics.default.getOptionsForDimension(dim.id, sliceConfig.categories);
          return (
            <Grid size={{ md: 4 }} sx={{ display: 'flex' }} key={dim.id}>
              <SelectDropdown
                id={`dim-${dim.id.replaceAll(':', '-')}`}
                className="flex-grow-1"
                helpText={dim.helpText ?? undefined}
                label={dim.label}
                options={options}
                value={options.filter((opt) => opt.selected)}
                isMulti={true}
                isClearable={true}
                onChange={(newValues) => {
                  setSliceConfig((old) => {
                    return metrics.default.updateChoice(dim, old, newValues);
                  });
                }}
              />
            </Grid>
          );
        })}
      </Grid>
    ) : null;

  return (
    <>
      {controls}
      <Box sx={{ position: 'relative' }}>
        <NodeGraph
          title={
            `${title}` + (subtitle && activeDimensionLabel ? ` per ${activeDimensionLabel}` : '')
          }
          subtitle={subtitle}
          dataTable={datasetTable}
          goalTable={goalTable}
          baselineTable={baselineTable}
          progressTable={progressTable}
          totalTable={totalTable}
          unit={getLongUnit(metrics.default, metric.unit.htmlShort, t)}
          referenceYear={referenceYear}
          forecastRange={visibleForecastRange}
          categoryColors={categoryColors}
          maximumFractionDigits={useFeatures().maximumFractionDigits ?? undefined}
          baselineLabel={site?.baselineName}
          showTotalLine={hasNegativeValues && metric.stackable && dataCategories.length > 1}
          onClickMeasuredEmissions={onClickMeasuredEmissions}
          forecastTitle={forecastTitle}
          stackable={metric.stackable}
        />
        {withTools && <ToolsMenu cube={metrics.default} sliceConfig={sliceConfig} />}
      </Box>
    </>
  );
}
