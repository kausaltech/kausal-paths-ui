import { useEffect, useMemo, useState } from 'react';

import { useReactiveVar } from '@apollo/client';
import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import { isEqual } from 'lodash';
import { type TFunction, useTranslation } from 'next-i18next';
import {
  Col,
  DropdownItem,
  DropdownMenu,
  DropdownToggle,
  Row,
  UncontrolledDropdown,
} from 'reactstrap';

import type { DimensionalNodeMetricFragment } from '@/common/__generated__/graphql';
import { activeGoalVar } from '@/common/cache';
import { genColorsFromTheme, setUniqueColors } from '@/common/colors';
import { useFeatures, useInstance } from '@/common/instance';
import SelectDropdown from '@/components/common/SelectDropdown';
import Icon from '@/components/common/icon';
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
  padding: 0 1rem 0.5rem;
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
    const defaultMetric = new DimensionalMetric(metric);

    return {
      default: defaultMetric,
      progress: hasProgressTracking ? new DimensionalMetric(metric, 'progress_tracking') : null,
    };
  }, [metric, hasProgressTracking]);

  const cube = metrics.default;

  const defaultConfig = cube.getDefaultSliceConfig(activeGoal);
  const [sliceConfig, setSliceConfig] = useState<SliceConfig>(defaultConfig);

  useEffect(() => {
    /**
     * If the active goal changes, we will reset the grouping + filtering
     * to be compatible with the new choices (if the new goal has common
     * dimensions with our metric).
     */
    if (!activeGoal) return;
    const newDefault = cube.getDefaultSliceConfig(activeGoal);
    if (!newDefault || isEqual(sliceConfig, newDefault)) return;
    setSliceConfig(newDefault);
  }, [activeGoal, cube, sliceConfig]);

  const sliceableDims = cube.dimensions.filter((dim) => !sliceConfig.categories[dim.id]);
  const slicedDim = cube.dimensions.find((dim) => dim.id === sliceConfig.dimensionId);

  let slice: MetricSlice;

  if (slicedDim) {
    slice = cube.sliceBy(slicedDim.id, true, sliceConfig.categories);
  } else {
    slice = cube.flatten(sliceConfig.categories);
  }

  const goals = cube.getGoalsForChoice(sliceConfig.categories);
  const showBaseline =
    baselineForecast && site?.baselineName && instance.features?.baselineVisibleInGraphs;

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

  const totalTable = slice.totalValues
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

  const defaultColor = color || theme.graphColors.blue070;
  const categoryColors: string[] = [];
  const nrCats = slice.categoryValues.length;

  if (nrCats > 1) {
    // If we were asked to use a specific color, we generate the color scheme around it.
    if (color) {
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
      categoryColors.push(...genColorsFromTheme(theme, slice.categoryValues.length));
    }
  } else {
    categoryColors[0] = defaultColor;
  }

  // Check if the data has any negative values, in order to decide if we want to show the total line
  // We could use the user selected year range here only, but let's show the total line even if negative values are filtered out
  const hasNegativeValues = slice.categoryValues.some(
    (cv) =>
      cv.historicalValues.some((value) => Number(value) < 0) ||
      cv.forecastValues.some((value) => Number(value) < 0)
  );

  // Let's create UI for selecting dimensions and categories
  const hasGroups = cube.dimensions.some((dim) => dim.groups.length); // Typically direct & indirect emissions

  const controls =
    withControls && (metric.dimensions.length > 1 || hasGroups) ? (
      <>
        <Row>
          {metric.dimensions.length > 1 && (
            <Col md={3} className="d-flex" key="dimension">
              <SelectDropdown
                id="dimension"
                className="flex-grow-1"
                label={t('plot-choose-dimension')}
                onChange={(val) =>
                  setSliceConfig((old) => ({
                    ...old,
                    dimensionId: val?.id || undefined,
                  }))
                }
                options={sliceableDims}
                value={sliceableDims.find((dim) => sliceConfig.dimensionId === dim.id) || null}
                isMulti={false}
                isClearable={false}
              />
            </Col>
          )}
          {cube.dimensions.map((dim) => {
            const options = cube.getOptionsForDimension(dim.id, sliceConfig.categories);
            return (
              <Col md={4} className="d-flex" key={dim.id}>
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
                      return cube.updateChoice(dim, old, newValues);
                    });
                  }}
                />
              </Col>
            );
          })}
        </Row>
      </>
    ) : null;

  return (
    <>
      {controls}

      <div>
        <NodeGraph
          title={title}
          dataTable={datasetTable}
          goalTable={goalTable}
          baselineTable={baselineTable}
          progressTable={progressTable}
          totalTable={totalTable}
          unit={getLongUnit(cube, metric.unit.htmlShort, t)}
          referenceYear={referenceYear}
          forecastRange={visibleForecastRange}
          categoryColors={categoryColors}
          maximumFractionDigits={useFeatures().maximumFractionDigits ?? undefined}
          baselineLabel={site?.baselineName}
          showTotalLine={hasNegativeValues}
          onClickMeasuredEmissions={onClickMeasuredEmissions}
          forecastTitle={forecastTitle}
        />
      </div>

      {withTools && (
        <Tools>
          <UncontrolledDropdown size="sm">
            <DropdownToggle caret color="link">
              <Icon name="download" />
              {` ${t('download-data')}`}
            </DropdownToggle>
            <DropdownMenu>
              <DropdownItem onClick={() => void cube.downloadData(sliceConfig, 'xlsx')}>
                <Icon name="file" /> XLS
              </DropdownItem>
              <DropdownItem onClick={() => void cube.downloadData(sliceConfig, 'csv')}>
                <Icon name="file" /> CSV
              </DropdownItem>
            </DropdownMenu>
          </UncontrolledDropdown>
        </Tools>
      )}
    </>
  );
}
