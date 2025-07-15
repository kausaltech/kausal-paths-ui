import { useEffect, useMemo, useState } from 'react';

import { useReactiveVar } from '@apollo/client';
import { isEqual } from 'lodash';
import { useTranslation } from 'next-i18next';
import {
  Col,
  DropdownItem,
  DropdownMenu,
  DropdownToggle,
  Row,
  UncontrolledDropdown,
} from 'reactstrap';
import styled, { useTheme } from 'styled-components';

import type { DimensionalNodeMetricFragment } from '@/common/__generated__/graphql';
import { activeGoalVar } from '@/common/cache';
import { useFeatures, useInstance } from '@/common/instance';
import SelectDropdown from '@/components/common/SelectDropdown';
import Icon from '@/components/common/icon';
import { useSite } from '@/context/site';
import {
  DimensionalMetric,
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

const getLongUnit = (cube: DimensionalMetric, unit: string, t: (key: string) => string) => {
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
  withReferenceYear?: boolean;
  baselineForecast?: BaselineForecast[];
  metric: NonNullable<DimensionalNodeMetricFragment['metricDim']>;
  startYear: number;
  endYear: number;
  withControls?: boolean;
  withTools?: boolean;
  onClickMeasuredEmissions?: (year: number) => void;
};

export default function DimensionalNodeVisualisation({
  withReferenceYear = false,
  metric,
  startYear,
  withControls = true,
  withTools = true,
  endYear,
  baselineForecast,
}: DimensionalNodeVisualisationProps) {
  const { t } = useTranslation();
  const activeGoal = useReactiveVar(activeGoalVar);
  const theme = useTheme();
  const site = useSite();
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

  const lastMetricYear = metric.years.slice(-1)[0];
  const usableEndYear = lastMetricYear && endYear > lastMetricYear ? lastMetricYear : endYear;

  const defaultConfig = cube.getDefaultSliceConfig(activeGoal);
  const [sliceConfig, setSliceConfig] = useState<SliceConfig>(defaultConfig);

  const maximumFractionDigits = useFeatures().maximumFractionDigits ?? undefined;

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
  }, [activeGoal, cube]);

  const sliceableDims = cube.dimensions.filter((dim) => !sliceConfig.categories[dim.id]);
  const slicedDim = cube.dimensions.find((dim) => dim.id === sliceConfig.dimensionId);

  let slice: MetricSlice;

  if (slicedDim) {
    slice = cube.sliceBy(slicedDim.id, true, sliceConfig.categories);
  } else {
    slice = cube.flatten(sliceConfig.categories);
  }

  const showReferenceYear =
    withReferenceYear &&
    !!instance?.referenceYear &&
    instance.minimumHistoricalYear !== instance.referenceYear;
  const referenceYear = showReferenceYear ? instance.referenceYear : undefined;

  const goals = cube.getGoalsForChoice(sliceConfig.categories);

  const generateRow = (cv: MetricCategoryValues, idx: number) => {
    return {
      name: cv.category.label,
      values: [...cv.historicalValues, ...cv.forecastValues],
      type: 'historical',
      color: cv.color,
    };
  };

  const rows = slice.categoryValues.map((cv, idx) => generateRow(cv, idx));

  const showBaseline =
    baselineForecast && site?.baselineName && instance.features?.baselineVisibleInGraphs;

  // Filter years to only include those between startYear and usableEndYear
  const filteredHistoricalYears = slice.historicalYears.filter(
    (year) => year >= startYear && year <= usableEndYear
  );
  const filteredForecastYears = slice.forecastYears.filter(
    (year) => year >= startYear && year <= usableEndYear
  );
  const allYears = [...slice.historicalYears, ...slice.forecastYears];
  const filteredYears = [...filteredHistoricalYears, ...filteredForecastYears];

  // Create indices for filtering values
  const yearIndices = filteredYears.map((year) => allYears.indexOf(year));

  const datasetTable = {
    source: [
      ['Category', 'Type', ...filteredYears],
      ...rows.map((row) => [row.name, 'historical', ...yearIndices.map((idx) => row.values[idx])]),
      ...(slice.totalValues
        ? [
            [
              'Total',
              'total',
              ...yearIndices.map(
                (idx) =>
                  [...slice.totalValues!.historicalValues, ...slice.totalValues!.forecastValues][
                    idx
                  ]
              ),
            ],
          ]
        : []),
      [
        'Goal',
        'goal',
        ...filteredYears.map((year) => goals?.find((goal) => goal.year === year)?.value),
      ],
      showBaseline
        ? [
            'Baseline',
            'baseline',
            ...filteredYears.map(
              (year) => baselineForecast?.find((forecast) => forecast.year === year)?.value
            ),
          ]
        : ['Baseline', 'baseline', ...filteredYears.map(() => undefined)],
    ].filter((row) => row.length > 0),
  };

  const categoryColors = [...rows.map((row) => row.color ?? theme.graphColors.blue070)];

  // TODO: Progress tracking

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

      <div className="mt-3">
        <NodeGraph
          plotData={datasetTable}
          unit={getLongUnit(cube, metric.unit.htmlShort, t)}
          stackable={metric.stackable}
          endYear={usableEndYear}
          startYear={startYear}
          referenceYear={referenceYear}
          forecastRange={[
            slice.forecastYears[0],
            slice.forecastYears[slice.forecastYears.length - 1],
          ]}
          categoryColors={categoryColors}
          maximumFractionDigits={maximumFractionDigits}
          baselineLabel={site?.baselineName}
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
              <DropdownItem onClick={async (ev) => await cube.downloadData(sliceConfig, 'xlsx')}>
                <Icon name="file" /> XLS
              </DropdownItem>
              <DropdownItem onClick={async (ev) => await cube.downloadData(sliceConfig, 'csv')}>
                <Icon name="file" /> CSV
              </DropdownItem>
            </DropdownMenu>
          </UncontrolledDropdown>
        </Tools>
      )}
    </>
  );
}
