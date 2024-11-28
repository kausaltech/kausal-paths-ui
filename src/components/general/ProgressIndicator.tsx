import { useTranslation } from '@/common/i18n';
import type { Theme } from '@kausal/themes/types';
import type { TFunction } from 'i18next';
import React, { useState, useMemo } from 'react';
import {
  Modal,
  ModalBody,
  ModalHeader,
  Dropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
  Fade,
} from 'reactstrap';
import styled, { useTheme, createGlobalStyle } from 'styled-components';
import { Chart } from '../charts/Chart';
import type { EChartsOption } from 'echarts';
import type { DimensionalNodeMetricFragment } from '@/common/__generated__/graphql';
import {
  metricHasProgressTrackingScenario,
  getProgressTrackingScenario,
} from '@/utils/progress-tracking';
import { useSite } from '@/context/site';
import { DimensionalMetric } from '@/data/metric';
import { getDefaultSliceConfig } from '@/components/general/DimensionalNodePlot';
import { useReactiveVar } from '@apollo/client';
import { activeGoalVar } from '@/common/cache';
import { setUniqueColors } from '@/common/colors';
import type { TopLevelFormatterParams } from 'echarts/types/dist/shared';
import Icon, { useSVGIconPath } from '../common/icon';

type DrillDownState = {
  categoryId: string;
  label: string;
} | null;

const StyledContainer = styled.div<{ $size?: string; $muted?: boolean }>`
  padding: 0;
  color: ${({ theme }) => theme.textColor.secondary};
`;

const StyledViewDetails = styled.button`
  color: ${({ theme }) => theme.graphColors.blue050};
  font-size: ${({ theme }) => theme.fontSizeSm};
  padding: 0;
  background: transparent;
  margin: 0;
  outline: none;
  border: none;
  text-decoration: underline;
  margin-top: ${({ theme }) => theme.spaces.s025};

  &:hover {
    color: ${({ theme }) => theme.graphColors.blue070};
  }
`;

const StyledIndicator = styled.span`
  width: 16px;
  height: 16px;
  border-radius: 8px;
`;

const StyledStatusBadge = styled.div<{
  $backgroundColor: string;
  $color: string;
  $iconColor?: string;
}>`
  margin: 0;
  display: inline-flex;
  gap: ${({ theme }) => theme.spaces.s050};
  color: ${(props) => props.$color};
  background-color: ${(props) => props.$backgroundColor};
  padding: ${({ theme }) => `${theme.spaces.s025} ${theme.spaces.s050}`};
  border-radius: ${({ theme }) => theme.badgeBorderRadius};
  align-items: center;
  font-size: ${({ theme }) => theme.fontSizeSm};
  margin-top: ${({ theme }) => theme.spaces.s050};

  > ${StyledIndicator} {
    background-color: ${(props) => props.$iconColor};
  }
`;

const StyledStatusBadgeButton = styled(StyledStatusBadge).attrs({ as: 'button' })`
  border: none;
  outline: none;
  cursor: pointer;
  padding: ${({ theme }) => theme.spaces.s050};
  margin-top: ${({ theme }) => theme.spaces.s025};
`;

const StyledSpan = styled.span`
  line-height: 100%;
`;

const StyledTitle = styled.p`
  font-size: 0.75rem;
  line-height: 1.2;
  font-weight: 700;
  margin: 0;
  margin-bottom: ${({ theme }) => theme.spaces.s025};
`;

const StyledSubtitle = styled.p`
  font-size: ${({ theme }) => theme.fontSizeSm};
  line-height: 1.2;
  color: ${({ theme }) => theme.textColor.tertiary};
  margin: 0;
  margin-bottom: ${({ theme }) => theme.spaces.s025};
`;

const StyledBackButton = styled.button`
  color: ${({ theme }) => theme.graphColors.blue050};
  font-size: ${({ theme }) => theme.fontSizeSm};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spaces.s025};
  background: none;
  border: none;
  padding: 0px;
  cursor: pointer;
`;

const StyledChart = styled(Chart)`
  canvas {
    cursor: pointer;
  }
`;

export type ProgressIndicatorProps = {
  color?: string;
  metric: NonNullable<DimensionalNodeMetricFragment['metricDim']>;
  isModalOpen: boolean;
  onModalOpenChange: (isOpen: boolean) => void;
  selectedYear: number;
  onSelectedYearChange: (year: number) => void;
};

type ProgressData = {
  year: number;
  unit: string;
  totalExpected: number | null;
  expected: {
    id: string;
    color: string;
    label: string;
    value: number;
  }[];
  totalObserved: number | null;
  observed: {
    id: string;
    color: string;
    label: string;
    value: number;
  }[];
};

const StyledCard = styled.div`
  border-radius: ${(props) => props.theme.cardBorderRadius};
  background-color: ${(props) => props.theme.cardBackground.secondary};
  padding: ${(props) => props.theme.spaces.s100};
  flex: 1;
`;

const StyledChartWrapper = styled.div`
  height: 400px;
`;

type EmissionsCardProps = {
  title: string;
  value: number;
  unit: string;
  deltaPercentage?: number;
};

const StyledEmissionsCardValue = styled.p`
  font-size: ${({ theme }) => theme.fontSizeLg};
  margin: 0;
  line-height: 1;
`;

const StyledEmissionsCardUnit = styled.span`
  font-size: ${({ theme }) => theme.fontSizeSm};
`;

const StyledEmissionsCardTitle = styled.h5`
  font-size: ${({ theme }) => theme.fontSizeSm};
  color: ${({ theme }) => theme.textColor.secondary};
`;

const StyledFlexContainer = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spaces.s050};
  margin-bottom: ${({ theme }) => theme.spaces.s100};
`;

const StyledYearSelector = styled.div`
  margin-bottom: ${({ theme }) => theme.spaces.s100};
`;

// Style modal as a drawer to the right
const StyledModal = styled(Modal)`
  height: 100%;
  margin-top: 0;
  margin-right: 0;
  margin-bottom: 0;

  .modal-content {
    border-radius: ${({ theme }) => theme.cardBorderRadius};
    border-top-right-radius: 0;
    height: 100%;
    border-bottom-right-radius: 0;
  }
`;

// Slide the modal in from the right
const GlobalModalStyle = createGlobalStyle`
  .progress-tracking-modal {
    .modal.fade .modal-dialog {
      transform: translate(50px, 0);
    }
      
    .modal.show .modal-dialog {
      transform: none;
    }
  }
`;

function EmissionsCard({ title, value, unit, deltaPercentage }: EmissionsCardProps) {
  const theme = useTheme();
  const { t } = useTranslation();

  const status = deltaPercentage ? getStatus(deltaPercentage, t, theme) : undefined;

  return (
    <StyledCard>
      <StyledEmissionsCardTitle>{title}</StyledEmissionsCardTitle>
      <StyledEmissionsCardValue>
        {value.toLocaleString(undefined, { maximumFractionDigits: 0 })}{' '}
        <StyledEmissionsCardUnit>{unit}</StyledEmissionsCardUnit>
      </StyledEmissionsCardValue>
      {status?.subLabel && (
        <StyledStatusBadge $backgroundColor={status.backgroundColor} $color={status.color}>
          {status.subLabel}
        </StyledStatusBadge>
      )}
    </StyledCard>
  );
}

function useProgressData(metric: ProgressIndicatorProps['metric'], color?: string): ProgressData[] {
  const site = useSite();
  const activeGoal = useReactiveVar(activeGoalVar);
  const theme = useTheme();
  const defaultColor = color || theme.graphColors.blue070;

  return useMemo(() => {
    const defaultMetric = new DimensionalMetric(metric);
    const hasProgressTracking = metricHasProgressTrackingScenario(metric, site.scenarios);

    if (!hasProgressTracking) return [];

    const metrics = {
      default: defaultMetric,
      progress: new DimensionalMetric(metric, 'progress_tracking'),
    };

    const defaultConfig = getDefaultSliceConfig(metrics.default, activeGoal);
    const defaultSlice = metrics.default.sliceBy(
      defaultConfig.dimensionId!,
      true,
      defaultConfig.categories
    );

    const progressSlice = metrics.progress.sliceBy(
      defaultConfig.dimensionId!,
      true,
      defaultConfig.categories
    );

    /**
     * Generate colours for nodes missing colours using the same
     * logic as DimensionalNodePlot for node colour consistency.
     * Note that the setUniqueColors function mutates the categoryValues.
     */
    if (defaultSlice.categoryValues.length > 1) {
      setUniqueColors(
        defaultSlice.categoryValues,
        (cv) => cv.color,
        (cv, color) => {
          cv.color = color;
        },
        defaultColor
      );

      setUniqueColors(
        progressSlice.categoryValues,
        (cv) => cv.color,
        (cv, color) => {
          cv.color = color;
        },
        defaultColor
      );
    }

    const progressScenario = getProgressTrackingScenario(site.scenarios);
    const progressYears = progressScenario?.actualHistoricalYears ?? [];

    return progressYears.map((year) => {
      const yearIndex = [...defaultSlice.historicalYears, ...defaultSlice.forecastYears].indexOf(
        year
      );
      const progressIndex = [
        ...progressSlice.historicalYears,
        ...progressSlice.forecastYears,
      ].indexOf(year);

      return {
        year,
        unit: defaultSlice.unit,
        totalExpected:
          [
            ...(defaultSlice.totalValues?.historicalValues ?? []),
            ...(defaultSlice.totalValues?.forecastValues ?? []),
          ][yearIndex] || 0,
        expected: defaultSlice.categoryValues.map((cv) => ({
          id: cv.category.originalId!,
          color: cv.color || '',
          label: cv.category.label,
          value: [...cv.historicalValues, ...cv.forecastValues][yearIndex] || 0,
        })),
        totalObserved:
          [
            ...(progressSlice.totalValues?.historicalValues ?? []),
            ...(progressSlice.totalValues?.forecastValues ?? []),
          ][yearIndex] || 0,
        observed: progressSlice.categoryValues.map((cv) => ({
          id: cv.category.originalId!,
          color: cv.color || '',
          label: cv.category.label,
          value: [...cv.historicalValues, ...cv.forecastValues][progressIndex] || 0,
        })),
      };
    });
  }, [metric, site.scenarios, activeGoal, defaultColor]);
}

function getDeltaPercentage({ totalExpected, totalObserved }: ProgressData) {
  if (totalObserved == null || totalExpected == null || totalExpected === 0) {
    return 0;
  }

  const delta = ((totalObserved - totalExpected) / totalExpected) * 100;

  return Math.round(delta);
}

type Status = {
  key: 'ON_TRACK' | 'OFF_TRACK' | 'DEVIATING';
  label: string;
  subLabel?: string;
  color: string;
  iconColor: string;
  backgroundColor: string;
};

function getStripeGradient(color?: string) {
  return `background-image: linear-gradient(-45deg, ${color} 25%,
            rgba(255,255,255,0.4) 25%, rgba(255,255,255,0.4) 50%,
            ${color} 50%, ${color} 75%,
            rgba(255,255,255,0.4) 75%);background-size: 8px 8px;`;
}

const getTooltipRow = (
  style: string,
  seriesName: string,
  value: string | null,
  color: string,
  unit: string
) => {
  const styles = [
    'display: inline-block',
    'margin-right: 5px',
    'width: 10px',
    'height:10px',
    `border: 1px solid ${color}`,
    style,
  ];

  return `<span style="${styles.join(';')}"></span>${seriesName}: ${value ?? ''} ${unit}`;
};

function getStatus(deltaPercentage: number, t: TFunction, theme: Theme): Status {
  if (deltaPercentage === 0 || deltaPercentage < 0) {
    return {
      key: 'ON_TRACK',
      label: t('on-track'),
      color: theme.graphColors.green070,
      iconColor: theme.graphColors.green050,
      backgroundColor: theme.graphColors.green010,
      subLabel: t('lower-than-expected', { percentage: Math.abs(deltaPercentage) }),
    };
  }

  if (deltaPercentage > 10) {
    return {
      key: 'OFF_TRACK',
      label: t('off-track'),
      color: theme.graphColors.red070,
      iconColor: theme.graphColors.red050,
      backgroundColor: theme.graphColors.red010,
      subLabel: t('higher-than-expected', { percentage: deltaPercentage }),
    };
  }

  return {
    key: 'DEVIATING',
    label: t('deviating'),
    color: theme.graphColors.yellow070,
    iconColor: theme.graphColors.yellow050,
    backgroundColor: theme.graphColors.yellow010,
    subLabel: t('higher-than-expected', { percentage: deltaPercentage }),
  };
}

function getChartConfig(
  measuredEmissionsData: ProgressData,
  t: TFunction,
  theme: Theme,
  iconPath: string
): EChartsOption {
  return {
    title: {
      show: false,
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
      formatter: (params: TopLevelFormatterParams) => {
        const firstParam = params[0];
        const label = firstParam.axisValue.split('\n')[0];

        if (!Array.isArray(params)) {
          return '';
        }

        const colorBlocks = params
          .map((param) => {
            const style =
              param.seriesName === t('observed-emissions')
                ? getStripeGradient(param.color as string)
                : `background-color: ${param.color};`;

            const roundedValue =
              typeof param.value === 'number'
                ? param.value.toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                  })
                : null;

            return getTooltipRow(
              style,
              param.seriesName ?? '',
              roundedValue,
              (param.color as string) ?? '',
              measuredEmissionsData.unit
            );
          })
          .join('<br/>');

        return `${label}<br/>${colorBlocks}`;
      },
    },
    legend: {
      data: [t('expected-emissions'), t('observed-emissions')],
      top: '0',
      itemStyle: {
        color: '#111',
      },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '10%',
      containLabel: true,
      tooltip: {
        trigger: 'axis',
      },
    },
    xAxis: {
      type: 'value',
      name: measuredEmissionsData.unit,
    },
    yAxis: [
      {
        type: 'category',
        data: measuredEmissionsData.observed.map((observed, i) => {
          const expected = measuredEmissionsData.expected[i];
          const isOnTrack = observed.value <= expected.value;
          const status = isOnTrack
            ? `{statusOnTrack|${t('on-track')}}`
            : `{statusOffTrack|${t('off-track')}}`;

          return `${observed.label}\n${status}`;
        }),
        axisLabel: {
          formatter: '{value}',
          lineHeight: 18,
          rich: {
            statusOnTrack: {
              fontSize: 10,
              backgroundColor: theme.graphColors.green010,
              borderRadius: 4,
              padding: [2, 6],
              color: theme.graphColors.green070,
            },
            statusOffTrack: {
              fontSize: 10,
              backgroundColor: theme.graphColors.red010,
              borderRadius: 4,
              padding: [2, 6],
              color: theme.graphColors.red070,
            },
          },
        },
        triggerEvent: true,
      },
      {
        type: 'category',
        data: measuredEmissionsData.expected.map(() => '{chevron|}'),
        axisLine: {
          show: false,
        },
        axisTick: {
          show: false,
        },
        triggerEvent: true,
        axisLabel: {
          fontSize: 16,
          rich: {
            chevron: {
              backgroundColor: {
                image: iconPath,
              },
              opacity: 0.5,
              width: 24,
              height: 24,
              padding: 0,
            },
          },
        },
      },
    ],
    series: [
      {
        name: t('expected-emissions'),
        type: 'bar',
        data: measuredEmissionsData.expected.map((f) => f.value),
        itemStyle: {
          color: (params) => {
            const expected = measuredEmissionsData.expected[params.dataIndex];
            return expected.color;
          },
        },
      },
      {
        name: t('observed-emissions'),
        type: 'bar',
        data: measuredEmissionsData.observed.map((m) => m.value),
        itemStyle: {
          color: (params) => {
            const observed = measuredEmissionsData.observed[params.dataIndex];
            return observed.color;
          },
          decal: {
            rotation: -Math.PI / 4,
            dashArrayX: [1, 0],
            dashArrayY: 2,
            color: 'rgba(255, 255, 255, 0.4)',
          },
        },
      },
    ],
  };
}

export const ProgressIndicator = ({
  color,
  metric,
  isModalOpen,
  onModalOpenChange,
  selectedYear,
  onSelectedYearChange,
}: ProgressIndicatorProps) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [drillDownState, setDrillDownState] = useState<DrillDownState>(null);
  const site = useSite();

  const drillDownIconPath = useSVGIconPath('angleRight');

  const progressData = useProgressData(metric, color);

  const observedYears = progressData
    .sort((a, b) => b.year - a.year)
    .filter((data) => data.observed.length > 0 && data.year !== site.minYear);

  const latestProgressData = observedYears[0];
  const selectedEmissions = observedYears.find((d) => d.year === selectedYear);

  const latestDeltaPercentage = getDeltaPercentage(latestProgressData);
  const totalExpected = selectedEmissions?.totalExpected ?? null;
  const totalObserved = selectedEmissions?.totalObserved ?? null;

  const status = getStatus(latestDeltaPercentage, t, theme);

  function handleOpenModal() {
    onModalOpenChange(true);
  }

  function handleCloseModal() {
    onModalOpenChange(false);

    // Wait for the modal to close before resetting anything that changes the layout
    setTimeout(() => {
      onSelectedYearChange(latestProgressData.year);
      setDrillDownState(null);
      setDropdownOpen(false);
    }, 400);
  }

  function toggleDropdown() {
    setDropdownOpen((isOpen) => !isOpen);
  }

  function handleYearSelect(year: number) {
    onSelectedYearChange(year);
  }

  function handleChartClick(dataIndex: number) {
    const clickedCategory = selectedEmissions?.expected[dataIndex];

    if (clickedCategory) {
      setDrillDownState({ categoryId: clickedCategory.id, label: clickedCategory.label });
    }
  }

  const chartConfig = selectedEmissions
    ? getChartConfig(selectedEmissions, t, theme, drillDownIconPath)
    : undefined;

  return (
    <>
      <GlobalModalStyle />
      <StyledContainer>
        <StyledTitle>
          {t('observed-emissions')} ({latestProgressData.year})
        </StyledTitle>

        {latestDeltaPercentage !== 0 && (
          <StyledSubtitle>
            {t(latestDeltaPercentage > 0 ? 'higher-than-expected' : 'lower-than-expected', {
              percentage: Math.abs(latestDeltaPercentage),
            })}
          </StyledSubtitle>
        )}

        <div>
          <StyledStatusBadgeButton
            onClick={handleOpenModal}
            $backgroundColor={status.backgroundColor}
            $color={status.color}
            $iconColor={status.iconColor}
          >
            <StyledIndicator />
            <StyledSpan>{status.label}</StyledSpan>
          </StyledStatusBadgeButton>
        </div>

        <StyledViewDetails onClick={handleOpenModal}>{t('view-details')}</StyledViewDetails>
      </StyledContainer>

      <StyledModal
        isOpen={isModalOpen}
        toggle={handleCloseModal}
        role="dialog"
        aria-modal="true"
        size="lg"
        centered
        wrapClassName="progress-tracking-modal"
      >
        <ModalHeader toggle={() => onModalOpenChange(false)}>
          {drillDownState
            ? drillDownState.label
            : `${t('observed-emissions')} (${selectedEmissions?.year})`}
        </ModalHeader>
        <ModalBody>
          <Fade key={drillDownState?.categoryId ?? 'default'}>
            <div>
              {drillDownState ? (
                <div>
                  <StyledBackButton onClick={() => setDrillDownState(null)}>
                    <Icon width="20px" height="20px" name="arrowLeft" />
                    <StyledSpan>Back to emissions by sector</StyledSpan>
                  </StyledBackButton>

                  {/* Placeholder for drill-down view */}
                  <p>Detailed view for {drillDownState.label}</p>
                </div>
              ) : (
                <>
                  {observedYears.length > 1 && (
                    <StyledYearSelector>
                      <Dropdown isOpen={dropdownOpen} toggle={toggleDropdown}>
                        <DropdownToggle caret>{selectedYear}</DropdownToggle>
                        <DropdownMenu>
                          {observedYears.map(({ year }) => (
                            <DropdownItem key={year} onClick={() => handleYearSelect(year)}>
                              {year}
                            </DropdownItem>
                          ))}
                        </DropdownMenu>
                      </Dropdown>
                    </StyledYearSelector>
                  )}
                  {!!selectedEmissions && (
                    <StyledFlexContainer>
                      {totalExpected != null && (
                        <EmissionsCard
                          title={`${t('expected-emissions')} (${selectedEmissions.year})`}
                          value={totalExpected}
                          unit={selectedEmissions.unit}
                        />
                      )}
                      {totalObserved != null && (
                        <EmissionsCard
                          title={`${t('observed-emissions')} (${selectedEmissions.year})`}
                          value={totalObserved}
                          unit={selectedEmissions.unit}
                          deltaPercentage={getDeltaPercentage(selectedEmissions)}
                        />
                      )}
                    </StyledFlexContainer>
                  )}
                  <h5>{t('emissions-by-sector', { year: selectedEmissions?.year })}</h5>
                  <StyledCard>
                    <StyledChartWrapper>
                      {chartConfig && (
                        <StyledChart
                          isLoading={false}
                          data={chartConfig}
                          onZrClick={handleChartClick}
                        />
                      )}
                    </StyledChartWrapper>
                  </StyledCard>
                </>
              )}
            </div>
          </Fade>
        </ModalBody>
      </StyledModal>
    </>
  );
};
