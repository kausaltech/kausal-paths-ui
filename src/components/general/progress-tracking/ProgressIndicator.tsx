import React, { useMemo, useState } from 'react';

import { Global, css, useTheme } from '@emotion/react';
import type { Theme } from '@emotion/react';
import styled from '@emotion/styled';
import type { DefaultLabelFormatterCallbackParams, EChartsOption } from 'echarts';
import type { TFunction } from 'i18next';
import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownToggle,
  Fade,
  Modal,
  ModalBody,
  ModalHeader,
} from 'reactstrap';

import { Chart } from '@common/components/Chart';

import { useTranslation } from '@/common/i18n';
import Icon, { useSVGIconPath } from '@/components/common/icon';
import { useSite } from '@/context/site';

import { EmissionsCard } from './EmissionsCard';
import { ProgressDriversWrapper } from './ProgressDriversWrapper';
import { StyledCard } from './StyledCard';
import { StyledIndicator, StyledStatusBadge } from './StyledStatusBadge';
import { type MetricDim, type ProgressData, useProgressData } from './useProgressData';
import { STATUS_KEYS, getDeltaPercentage, getStatus } from './utils';

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

const StyledStatusBadgeButton = styled(StyledStatusBadge)`
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
  font-size: ${({ theme }) => theme.fontSizeBase};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spaces.s025};
  background: none;
  border: none;
  padding: 0px;
  cursor: pointer;
  margin-bottom: ${({ theme }) => theme.spaces.s100};
  transition:
    color 0.2s,
    border-bottom-color 0.2s;
  border-bottom: 2px solid transparent;

  &:hover {
    color: ${({ theme }) => theme.graphColors.blue070};
    border-bottom-color: ${({ theme }) => theme.graphColors.blue050};
  }
`;

const StyledChart = styled(Chart)`
  canvas {
    cursor: pointer;
  }
`;

export type CategoryMeasureYearsMap = Map<string, number[]>;

export type ProgressIndicatorProps = {
  color?: string;
  metric: MetricDim;
  isModalOpen: boolean;
  onModalOpenChange: (isOpen: boolean) => void;
  selectedYear: number;
  onSelectedYearChange: (year: number) => void;
  showViewDetails?: boolean;
  /** Map of category/node ID -> measureDatapointYears from upstream nodes */
  categoryMeasureYears?: CategoryMeasureYearsMap;
};

const StyledChartWrapper = styled.div`
  height: 400px;
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

  .modal-body {
    flex: 1;
    overflow-y: auto;
  }
`;

// Slide the modal in from the right
const globalModalCss = css`
  .progress-tracking-modal {
    .modal.fade .modal-dialog {
      transform: translate(50px, 0);
    }

    .modal.show .modal-dialog {
      transform: none;
    }
  }
`;

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

function getChartConfig(
  measuredEmissionsData: ProgressData,
  t: TFunction,
  theme: Theme,
  iconPath: string,
  categoriesWithMeasuredData?: Set<string>
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
      formatter: function (params: DefaultLabelFormatterCallbackParams[]) {
        if (!Array.isArray(params) || params.length === 0) {
          return '';
        }

        const firstParam = params[0];
        // axisValue is available at runtime for axis-triggered tooltips
        const axisValue = (firstParam as { axisValue?: string | number }).axisValue;
        const label = String(axisValue ?? '').split('\n')[0];

        // Get the category ID for the hovered item to check if it has measured data
        const dataIndex = firstParam.dataIndex;
        const categoryId = measuredEmissionsData.observed[dataIndex]?.id;
        const hasMeasuredData =
          !categoriesWithMeasuredData || categoriesWithMeasuredData.has(categoryId);

        const colorBlocks = params
          .filter((param) => {
            // Hide "Calculated emissions" row if category doesn't have measured data
            if (!hasMeasuredData && param.seriesName === t('calculated-emissions')) {
              return false;
            }

            return true;
          })
          .map((param) => {
            const color = typeof param.color === 'string' ? param.color : '';
            const style =
              param.seriesName === t('calculated-emissions')
                ? getStripeGradient(color)
                : `background-color: ${color};`;

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
              color,
              measuredEmissionsData.unit
            );
          })
          .join('<br/>');

        return `${label}<br/>${colorBlocks}`;
      },
    },
    legend: {
      data: [t('planned-emissions'), t('calculated-emissions')],
      top: '0',
      itemStyle: {
        color: '#bbb',
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
        data: measuredEmissionsData.observed.map((observed) => {
          const expected = measuredEmissionsData.expected.find(
            (expected) => expected.id === observed.id
          );

          if (!expected) {
            return observed.label;
          }

          // Only show status label if category has measured data
          const hasMeasuredData =
            !categoriesWithMeasuredData || categoriesWithMeasuredData.has(observed.id);

          if (!hasMeasuredData) {
            return observed.label;
          }

          const deltaPercentage = getDeltaPercentage(expected.value, observed.value);
          const status = getStatus(deltaPercentage, t, theme);
          const statusLabel = `{${status.key}|${status.label}}`;

          return `${observed.label}\n${statusLabel}`;
        }),
        axisLabel: {
          formatter: '{value}',
          lineHeight: 18,
          rich: {
            [STATUS_KEYS.ON_TRACK]: {
              fontSize: 10,
              backgroundColor: theme.graphColors.green010,
              borderRadius: 4,
              padding: [2, 6],
              color: theme.graphColors.green070,
            },
            [STATUS_KEYS.DEVIATING]: {
              fontSize: 10,
              backgroundColor: theme.graphColors.yellow010,
              borderRadius: 4,
              padding: [2, 6],
              color: theme.graphColors.yellow070,
            },
            [STATUS_KEYS.OFF_TRACK]: {
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
        name: t('planned-emissions'),
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
        name: t('calculated-emissions'),
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
  showViewDetails = true,
  categoryMeasureYears = new Map(),
}: ProgressIndicatorProps) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [drillDownState, setDrillDownState] = useState<DrillDownState>(null);
  const site = useSite();

  const drillDownIconPath = useSVGIconPath('angleRight');

  const progressData = useProgressData(metric, color);

  const observedYears = useMemo(
    () =>
      [...progressData]
        .sort((a, b) => b.year - a.year)
        .filter((data) => data.observed.length > 0 && data.year !== site.minYear),
    [progressData, site.minYear]
  );

  const latestProgressData = observedYears[0];
  const selectedEmissions = observedYears.find((d) => d.year === selectedYear);

  // Filter emissions to only include categories that have measureDatapointYears for the selected year
  // (excluding the baseline year)
  const filteredEmissionsForChart = useMemo((): ProgressData | undefined => {
    if (!selectedEmissions || categoryMeasureYears.size === 0) {
      return selectedEmissions;
    }

    const filteredExpected: typeof selectedEmissions.expected = [];
    const filteredObserved: typeof selectedEmissions.observed = [];

    selectedEmissions.expected.forEach((exp, index) => {
      const measureYears = categoryMeasureYears.get(exp.id) ?? [];
      const hasMeasuredDataForYear = measureYears.some(
        (year) => year === selectedEmissions.year && year !== site.minYear
      );

      // Always include expected, but only include observed if category has measured data
      filteredExpected.push(exp);

      if (hasMeasuredDataForYear) {
        filteredObserved.push(selectedEmissions.observed[index]);
      } else {
        // Include a placeholder with zero value so indices align
        filteredObserved.push({
          ...selectedEmissions.observed[index],
          value: 0,
        });
      }
    });

    return {
      ...selectedEmissions,
      expected: filteredExpected,
      observed: filteredObserved,
    };
  }, [selectedEmissions, categoryMeasureYears, site.minYear]);

  // Create a Set of category IDs that have measured data for the selected year
  const categoriesWithMeasuredData = useMemo(() => {
    const categoriesSet = new Set<string>();

    if (!selectedEmissions || categoryMeasureYears.size === 0) {
      return undefined;
    }

    selectedEmissions.expected.forEach((exp) => {
      const measureYears = categoryMeasureYears.get(exp.id) ?? [];
      const hasMeasuredDataForYear = measureYears.some(
        (year) => year === selectedEmissions.year && year !== site.minYear
      );

      if (hasMeasuredDataForYear) {
        categoriesSet.add(exp.id);
      }
    });
    return categoriesSet;
  }, [selectedEmissions, categoryMeasureYears, site.minYear]);

  // If there are no observed years with measured data, don't render the progress indicator
  if (observedYears.length === 0 || !latestProgressData) {
    return null;
  }

  const latestDeltaPercentage = getDeltaPercentage(
    latestProgressData.totalExpected,
    latestProgressData.totalObserved
  );
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

  function handleChartClick(dataPoint: [number, number]) {
    const clickedCategory = selectedEmissions?.expected[dataPoint[1]];

    if (clickedCategory) {
      setDrillDownState({ categoryId: clickedCategory.id, label: clickedCategory.label });
    }
  }

  const chartConfig = filteredEmissionsForChart
    ? getChartConfig(
        filteredEmissionsForChart,
        t,
        theme,
        drillDownIconPath,
        categoriesWithMeasuredData
      )
    : undefined;

  return (
    <>
      <Global styles={globalModalCss} />
      <StyledContainer>
        <StyledTitle>
          {t('calculated-emissions')} ({latestProgressData.year})
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
            as="button"
            onClick={handleOpenModal}
            $backgroundColor={status.backgroundColor}
            $color={status.color}
            $iconColor={status.iconColor}
          >
            <StyledIndicator />
            <StyledSpan>{status.label}</StyledSpan>
          </StyledStatusBadgeButton>
        </div>

        {showViewDetails && (
          <StyledViewDetails onClick={handleOpenModal}>{t('view-details')}</StyledViewDetails>
        )}
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
            : `${t('calculated-emissions')} (${selectedEmissions?.year ?? ''})`}
        </ModalHeader>
        <ModalBody>
          <Fade key={drillDownState?.categoryId ?? 'default'}>
            <div>
              {drillDownState ? (
                <div>
                  <StyledBackButton onClick={() => setDrillDownState(null)}>
                    <Icon width="24px" height="24px" name="arrowLeft" />
                    <StyledSpan>Back to emissions by sector</StyledSpan>
                  </StyledBackButton>

                  <ProgressDriversWrapper nodeId={drillDownState.categoryId} />
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
                          title={`${t('planned-emissions')} (${selectedEmissions.year})`}
                          value={totalExpected}
                          unit={selectedEmissions.unit}
                        />
                      )}
                      {totalObserved != null && selectedEmissions && (
                        <EmissionsCard
                          title={`${t('calculated-emissions')} (${selectedEmissions.year})`}
                          value={totalObserved}
                          unit={selectedEmissions.unit}
                          deltaPercentage={getDeltaPercentage(
                            selectedEmissions.totalExpected,
                            selectedEmissions.totalObserved
                          )}
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
                          onZrClick={showViewDetails ? handleChartClick : undefined}
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
