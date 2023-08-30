import { useContext, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useTranslation } from 'next-i18next';
import { tint } from 'polished';
import styled from 'styled-components';
import { useReactiveVar } from '@apollo/client';
import { genColorsFromTheme } from 'common/colors';
import SiteContext from 'context/site';
import type { DimensionalNodeMetricFragment } from 'common/__generated__/graphql';
import {
  Col,
  Nav,
  NavItem,
  NavLink,
  TabContent,
  Row,
  UncontrolledDropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
} from 'reactstrap';
import {
  GraphDown as GraphIcon,
  CloudArrowDown as DowloadIcon,
  FiletypeCsv as CsvIcon,
  FiletypeXls as XlsIcon,
} from 'react-bootstrap-icons';
import SelectDropdown from 'components/common/SelectDropdown';
import { activeGoalVar } from 'common/cache';
import {
  DimensionalMetric,
  MetricCategoryValues,
  MetricSlice,
  SliceConfig,
} from 'data/metric';
import { useTheme } from 'common/theme';

const Plot = dynamic(() => import('components/graphs/Plot'), { ssr: false });

const Tools = styled.div`
  padding: 0 1rem 0.5rem;
  text-align: right;
  .btn-link {
    text-decoration: none;
  }
`;

const DisplayTab = styled(NavItem)`
  font-size: 0.9rem;
`;

function formatHover(
  name: string,
  color: string,
  unit: string,
  predLabel: string | null,
  fontFamily?: string
) {
  //const predText = predLabel ? ` <i>(${predLabel})</i>` : '';
  const out: Partial<Plotly.PlotData> = {
    /*
    hovertemplate: `${name}<br />` +
                   `%{x|%Y}: <b>%{y:,.3r}</b> ` +
                   `${unit}` +
                   `${predText}` + 
                   `<extra></extra>`,
    */
    hovertemplate:
      `${name}: ` +
      `<b>%{y:,.3r}</b> ` +
      `${unit}` +
      //`${predText}` +
      `<extra></extra>`,
    hoverlabel: {
      bgcolor: color,
      font: {
        family: fontFamily,
      },
    },
  };
  return out;
}

type DimensionalNodePlotProps = {
  node: { id: string };
  metric: NonNullable<DimensionalNodeMetricFragment['metricDim']>;
  startYear: number;
  endYear: number;
  color?: string | null;
};

export default function DimensionalNodePlot(props: DimensionalNodePlotProps) {
  const { metric, startYear, color } = props;
  let { endYear } = props;

  const { t } = useTranslation();
  const activeGoal = useReactiveVar(activeGoalVar);
  const [activeTabId, setActiveTabId] = useState('graph');
  const cube = useMemo(() => new DimensionalMetric(metric), [metric]);

  const lastMetricYear = metric.years.slice(-1)[0];
  if (lastMetricYear && endYear > lastMetricYear) endYear = lastMetricYear;

  let defaultChoice = {};
  let defaultSliceDim: string | undefined = metric.dimensions[0]?.id;

  let goalAffectsPlot = false;
  if (activeGoal) {
    defaultChoice = cube.getChoicesForGoal(activeGoal);
    if (defaultSliceDim && Object.hasOwn(defaultChoice, defaultSliceDim)) {
      defaultSliceDim = metric.dimensions.find((dim) => !defaultChoice[dim.id])
        ?.id;
      goalAffectsPlot = true;
    }
  }

  const [sliceConfig, setSliceConfig] = useState<SliceConfig>({
    dimensionId: defaultSliceDim,
    categories: defaultChoice,
  });

  useEffect(() => {
    if (!goalAffectsPlot) return;
    if (
      sliceConfig.dimensionId != defaultSliceDim ||
      sliceConfig.categories != defaultChoice
    ) {
      setSliceConfig({
        dimensionId: defaultSliceDim,
        categories: defaultChoice,
      });
    }
  }, [activeGoal]);

  const sliceableDims = cube.dimensions.filter(
    (dim) => !sliceConfig.categories[dim.id]
  );
  const slicedDim = cube.dimensions.find(
    (dim) => dim.id === sliceConfig.dimensionId
  );

  let slice: MetricSlice;
  if (slicedDim) {
    slice = cube.sliceBy(slicedDim.id, true, sliceConfig.categories);
  } else {
    slice = cube.flatten(sliceConfig.categories);
  }
  const theme = useTheme();
  const site = useContext(SiteContext);

  const defaultColor = color || theme.graphColors.blue070;
  const shapes = [];
  const plotData: Partial<Plotly.PlotData>[] = [];
  const rangeMode = metric.stackable ? 'tozero' : 'normal';
  const filled = metric.stackable;

  const filledStyles = (stackGroup: string) => {
    if (!filled) return {};
    const out: Partial<Plotly.PlotData> = {
      stackgroup: stackGroup,
      //marker: { opacity: 0 },
      line: {
        color: 'white',
        width: 1,
        dash: 'solid',
        shape: 'spline',
        smoothing: 1.0,
      },
    };
    return out;
  };

  let colors: string[];
  const nrCats = slice.categoryValues.length;
  if (nrCats > 1) {
    colors = genColorsFromTheme(theme, slice.categoryValues.length);
  } else {
    colors = [defaultColor];
  }
  const hasHistorical = slice.historicalYears.length > 0;
  const hasForecast = slice.forecastYears.length > 0;
  const predLabel = t('pred');
  const unit = metric.unit.htmlShort;

  const genTraces = (cv: MetricCategoryValues, idx: number) => {
    const stackGroup = cv.isNegative ? 'neg' : 'pos';
    const color = cv.category.color || colors[idx];
    const traceConfig: Partial<Plotly.PlotData> = {
      name: cv.category.label,
      type: 'scatter',
      line: {
        color,
        shape: 'spline',
        width: 3,
      },
      fillcolor: color,
    };

    if (hasHistorical) {
      plotData.push({
        ...traceConfig,
        x: slice.historicalYears,
        y: cv.historicalValues,
        ...filledStyles(`${stackGroup}-hist`),
        ...formatHover(cv.category.label, color, unit, null, theme.fontFamily),
      });
    }
    if (hasHistorical && hasForecast) {
      const lastHist = slice.historicalYears.length - 1;
      // Short trace to join historical and forecast series together
      plotData.push({
        ...traceConfig,
        ...filledStyles(`${stackGroup}-join`),
        x: [slice.historicalYears[lastHist], slice.forecastYears[0]],
        y: [cv.historicalValues[lastHist], cv.forecastValues[0]],
        hoverinfo: 'skip',
        showlegend: false,
        fillcolor: tint(0.3, color),
      });
    }
    if (hasForecast) {
      plotData.push({
        ...traceConfig,
        ...filledStyles(`${stackGroup}-forecast`),
        ...formatHover(
          cv.category.label,
          color,
          unit,
          predLabel,
          theme.fontFamily
        ),
        x: slice.forecastYears,
        y: cv.forecastValues,
        showlegend: false,
        fillcolor: tint(0.3, color),
      });
    }
  };

  slice.categoryValues.forEach((cv, idx) => genTraces(cv, idx));

  const goals = cube.getGoalsForChoice(sliceConfig.categories);
  if (goals) {
    const name = t('target');
    plotData.push({
      type: 'scatter',
      name,
      line: {
        color: theme.graphColors.red070,
        width: 2,
        dash: 'dot',
      },
      marker: {
        size: 8,
      },
      x: goals.map((v) => v.year),
      y: goals.map((v) => v.value),
      hovertemplate: `<b>${name} %{x}: %{y:,.3r} ${unit}</b><extra></extra>`,
    });
  }

  if (metric.stackable && slice.totalValues) {
    const label = t('plot-total')!;
    plotData.push({
      type: 'scatter',
      name: label,
      mode: 'lines',
      line: {
        color: theme.graphColors.grey080,
        width: 0,
      },
      x: [...slice.historicalYears, ...slice.forecastYears],
      y: [
        ...slice.totalValues.historicalValues,
        ...slice.totalValues.forecastValues,
      ],
      ...formatHover(
        label,
        theme.graphColors.grey080,
        unit,
        null,
        theme.fontFamily
      ),
      showlegend: false,
    });
  }

  const nrYears = endYear - startYear;
  const layout: Partial<Plotly.Layout> = {
    height: 300,
    margin: {
      t: 24,
      r: 24,
      b: 48,
      l: 12,
    },
    hovermode: 'x unified',
    hoverdistance: 10,
    yaxis: {
      domain: [0, 1],
      anchor: 'x',
      ticklen: 10,
      gridcolor: theme.graphColors.grey005,
      tickcolor: theme.graphColors.grey030,
      tickformat: ',',
      title: {
        font: {
          family: theme.fontFamily,
        },
        text: metric.unit?.htmlShort || undefined,
      },
      rangemode: rangeMode,
    },
    xaxis: {
      domain: [0.075, 1],
      ticklen: 10,
      type: 'date',
      dtick: nrYears > 30 ? 'M60' : nrYears > 15 ? 'M24' : 'M12',
      range: [`${startYear - 1}-11-01`, `${endYear}-02-01`],
      gridcolor: theme.graphColors.grey005,
      tickcolor: theme.graphColors.grey030,
      hoverformat: '%Y',
    },
    autosize: true,
    font: {
      family: theme.fontFamily,
    },
    paper_bgcolor: 'rgba(0,0,0,0)',
    showlegend: true,
    legend: {
      orientation: 'h',
      yanchor: 'top',
      y: -0.2,
      xanchor: 'right',
      x: 1,
      itemclick: false,
      itemdoubleclick: false,
    },
    grid: { rows: 1, columns: 2, pattern: 'independent' },
    shapes,
  };

  const hasGroups = cube.dimensions.some((dim) => dim.groups.length);

  let controls =
    metric.dimensions.length > 1 || hasGroups ? (
      <>
        <Row>
          {metric.dimensions.length > 1 && (
            <Col md={3} className="d-flex" key="dimension">
              <SelectDropdown
                id="dimension"
                className="flex-grow-1"
                label={t('plot-choose-dimension')!}
                onChange={(val) =>
                  setSliceConfig((old) => ({
                    ...old,
                    dimensionId: val?.id || undefined,
                  }))
                }
                options={sliceableDims}
                value={
                  sliceableDims.find(
                    (dim) => sliceConfig.dimensionId === dim.id
                  ) || null
                }
                isMulti={false}
                isClearable={false}
              />
            </Col>
          )}
          {cube.dimensions.map((dim) => {
            const options = cube.getOptionsForDimension(
              dim.id,
              sliceConfig.categories
            );
            return (
              <Col md={4} className="d-flex" key={dim.id}>
                <SelectDropdown
                  id={`dim-${dim.id}`}
                  className="flex-grow-1"
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
      <Nav tabs className="justify-content-end">
        <DisplayTab>
          <NavLink
            href="#"
            onClick={() => setActiveTabId('graph')}
            active={activeTabId === 'graph'}
          >
            <GraphIcon /> {t('time-series')}
          </NavLink>
        </DisplayTab>
        {/*
        <DisplayTab>
          <NavLink
            href="#" onClick={() => setActiveTabId('table')}
            active={activeTabId === 'table'}
          >
            <TableIcon /> {t('table')}
          </NavLink>
        </DisplayTab>
        */}
      </Nav>
      <TabContent activeTab={activeTabId} className="mt-3">
        {activeTabId === 'graph' && (
          <Plot
            data={plotData}
            layout={layout}
            useResizeHandler
            style={{ width: '100%' }}
            config={{ displayModeBar: false }}
            noValidate
          />
        )}
        {/* activeTabId === 'table' && (
        <div>
          <DataTable
            node={tableNode}
            subNodes={tableSubNodes}
            startYear={startYear}
            endYear={endYear}
          />
        </div>
      ) */}
      </TabContent>

      <Tools>
        <UncontrolledDropdown size="sm">
          <DropdownToggle caret color="link">
            <DowloadIcon />
            {` ${t('download-data')}`}
          </DropdownToggle>
          <DropdownMenu>
            <DropdownItem
              onClick={async (ev) =>
                await cube.downloadData(sliceConfig, 'xlsx')
              }
            >
              <XlsIcon /> XLS
            </DropdownItem>
            <DropdownItem
              onClick={async (ev) =>
                await cube.downloadData(sliceConfig, 'csv')
              }
            >
              <CsvIcon /> CSV
            </DropdownItem>
          </DropdownMenu>
        </UncontrolledDropdown>
      </Tools>
    </>
  );
}
