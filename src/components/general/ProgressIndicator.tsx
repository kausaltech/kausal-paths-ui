import { useTranslation } from '@/common/i18n';
import type { Theme } from '@kausal/themes/types';
import type { TFunction } from 'i18next';
import React, { useState } from 'react';
import {
  Modal,
  ModalBody,
  ModalHeader,
  Dropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
} from 'reactstrap';
import styled, { useTheme } from 'styled-components';
import { Chart } from '../charts/Chart';
import type { EChartsOption } from 'echarts';

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

const StyledStatusBadge = styled.button<{ $backgroundColor: string; $color: string }>`
  border: none;
  outline: none;
  margin: 0;
  cursor: pointer;
  display: inline-flex;
  gap: ${({ theme }) => theme.spaces.s050};
  background-color: ${(props) => props.$backgroundColor};
  padding: ${({ theme }) => `${theme.spaces.s050} ${theme.spaces.s050}`};
  border-radius: ${({ theme }) => theme.badgeBorderRadius};
  align-items: center;
  font-size: ${({ theme }) => theme.fontSizeSm};
  margin-top: ${({ theme }) => theme.spaces.s025};

  > ${StyledIndicator} {
    background-color: ${(props) => props.$color};
  }
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

export type ProgressIndicatorProps = {
  data: ProgressData[];
  isModalOpen: boolean;
  onModalOpenChange: (isOpen: boolean) => void;
  selectedYear: number;
  onSelectedYearChange: (year: number) => void;
};

type ProgressData = {
  year: number;
  forecast: {
    id: string;
    color: string;
    label: string;
    value: number;
  }[];
  measured: {
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

function EmissionsCard({ title, value, unit }: EmissionsCardProps) {
  return (
    <StyledCard>
      <StyledEmissionsCardTitle>{title}</StyledEmissionsCardTitle>
      <StyledEmissionsCardValue>
        {value} <StyledEmissionsCardUnit>{unit}</StyledEmissionsCardUnit>
      </StyledEmissionsCardValue>
    </StyledCard>
  );
}

export const MOCK_DATA: ProgressData[] = [
  {
    year: 2020,
    forecast: [
      {
        id: 'electricity',
        color: '#C33D0B',
        label: 'Electricity emissions',
        value: 100,
      },
      {
        id: 'transport',
        color: '#0F608D',
        label: 'Transport emissions',
        value: 200,
      },
      {
        id: 'buildings',
        color: '#2A8442',
        label: 'Building emissions',
        value: 150,
      },
      {
        id: 'freight',
        color: '#8B4513',
        label: 'Freight transport emissions',
        value: 120,
      },
      {
        id: 'waste',
        color: '#6B4423',
        label: 'Waste emissions',
        value: 80,
      },
      {
        id: 'other',
        color: '#808080',
        label: 'Emissions from other sectors',
        value: 50,
      },
    ],
    measured: [
      {
        id: 'electricity',
        color: '#C33D0B',
        label: 'Electricity emissions',
        value: 150,
      },
      {
        id: 'transport',
        color: '#0F608D',
        label: 'Transport emissions',
        value: 180,
      },
      {
        id: 'buildings',
        color: '#2A8442',
        label: 'Building emissions',
        value: 140,
      },
      {
        id: 'freight',
        color: '#8B4513',
        label: 'Freight transport emissions',
        value: 110,
      },
      {
        id: 'waste',
        color: '#6B4423',
        label: 'Waste emissions',
        value: 85,
      },
      {
        id: 'other',
        color: '#808080',
        label: 'Emissions from other sectors',
        value: 45,
      },
    ],
  },
  {
    year: 2021,
    forecast: [
      {
        id: 'electricity',
        color: '#C33D0B',
        label: 'Electricity emissions',
        value: 120,
      },
      {
        id: 'transport',
        color: '#0F608D',
        label: 'Transport emissions',
        value: 250,
      },
      {
        id: 'buildings',
        color: '#2A8442',
        label: 'Building emissions',
        value: 140,
      },
      {
        id: 'freight',
        color: '#8B4513',
        label: 'Freight transport emissions',
        value: 110,
      },
      {
        id: 'waste',
        color: '#6B4423',
        label: 'Waste emissions',
        value: 75,
      },
      {
        id: 'other',
        color: '#808080',
        label: 'Emissions from other sectors',
        value: 45,
      },
    ],
    measured: [
      {
        id: 'electricity',
        color: '#C33D0B',
        label: 'Electricity emissions',
        value: 180,
      },
      {
        id: 'transport',
        color: '#0F608D',
        label: 'Transport emissions',
        value: 220,
      },
      {
        id: 'buildings',
        color: '#2A8442',
        label: 'Building emissions',
        value: 130,
      },
      {
        id: 'freight',
        color: '#8B4513',
        label: 'Freight transport emissions',
        value: 100,
      },
      {
        id: 'waste',
        color: '#6B4423',
        label: 'Waste emissions',
        value: 70,
      },
      {
        id: 'other',
        color: '#808080',
        label: 'Emissions from other sectors',
        value: 40,
      },
    ],
  },
  {
    year: 2022,
    forecast: [
      {
        id: 'electricity',
        color: '#C33D0B',
        label: 'Electricity emissions',
        value: 150,
      },
      {
        id: 'transport',
        color: '#0F608D',
        label: 'Transport emissions',
        value: 300,
      },
      {
        id: 'buildings',
        color: '#2A8442',
        label: 'Building emissions',
        value: 130,
      },
      {
        id: 'freight',
        color: '#8B4513',
        label: 'Freight transport emissions',
        value: 100,
      },
      {
        id: 'waste',
        color: '#6B4423',
        label: 'Waste emissions',
        value: 70,
      },
      {
        id: 'other',
        color: '#808080',
        label: 'Emissions from other sectors',
        value: 40,
      },
    ],
    measured: [
      {
        id: 'electricity',
        color: '#C33D0B',
        label: 'Electricity emissions',
        value: 200,
      },
      {
        id: 'transport',
        color: '#0F608D',
        label: 'Transport emissions',
        value: 280,
      },
      {
        id: 'buildings',
        color: '#2A8442',
        label: 'Building emissions',
        value: 120,
      },
      {
        id: 'freight',
        color: '#8B4513',
        label: 'Freight transport emissions',
        value: 90,
      },
      {
        id: 'waste',
        color: '#6B4423',
        label: 'Waste emissions',
        value: 65,
      },
      {
        id: 'other',
        color: '#808080',
        label: 'Emissions from other sectors',
        value: 35,
      },
    ],
  },
];

function getTotalMeasuredAndForecast(yearlyValues: ProgressData) {
  const totalForecast = yearlyValues.forecast.reduce((sum, { value }) => sum + value, 0);
  const totalMeasured = yearlyValues.measured.reduce((sum, { value }) => sum + value, 0);

  const delta = totalForecast !== 0 ? ((totalMeasured - totalForecast) / totalForecast) * 100 : 0;

  return {
    ...yearlyValues,
    delta: Math.round(delta),
    totalForecast,
    totalMeasured,
    plannedRateOfChange: totalForecast,
  };
}

type Status = {
  key: 'ON_TRACK' | 'OFF_TRACK' | 'DEVIATING';
  label: string;
  color: string;
  backgroundColor: string;
};

function getStripeGradient(color?: string) {
  return `background-image: linear-gradient(-45deg, ${color} 25%,
            rgba(255,255,255,0.4) 25%, rgba(255,255,255,0.4) 50%,
            ${color} 50%, ${color} 75%,
            rgba(255,255,255,0.4) 75%);background-size: 8px 8px;`;
}

const getTooltipRow = (style: string, seriesName: string, value: number | null, color: string) => {
  const styles = [
    'display: inline-block',
    'margin-right: 5px',
    'width: 10px',
    'height:10px',
    `border: 1px solid ${color}`,
    style,
  ];

  return `<span style="${styles.join(';')}"></span>${seriesName}: ${value ?? ''}`;
};

function getStatus(deltaPercentage: number, t: TFunction, theme: Theme): Status {
  if (deltaPercentage === 0 || deltaPercentage > 0) {
    return {
      key: 'ON_TRACK',
      label: t('on-track'),
      color: theme.graphColors.green050,
      backgroundColor: theme.graphColors.green010,
    };
  }

  if (deltaPercentage < -10) {
    return {
      key: 'OFF_TRACK',
      label: t('off-track'),
      color: theme.graphColors.red050,
      backgroundColor: theme.graphColors.red010,
    };
  }

  return {
    key: 'DEVIATING',
    label: t('deviating'),
    color: theme.graphColors.yellow050,
    backgroundColor: theme.graphColors.yellow010,
  };
}

function getChartConfig(
  mostRecentMeasuredEmissions: ProgressData,
  t: TFunction,
  theme: Theme
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
      formatter: (params) => {
        const firstParam = params[0];
        const label = firstParam.axisValue.split('\n')[0];

        if (!Array.isArray(params)) {
          return '';
        }

        const colorBlocks = params
          .map((param) => {
            const style =
              param.seriesName === 'Measured emissions'
                ? getStripeGradient(param.color)
                : `background-color: ${param.color};`;

            return getTooltipRow(
              style,
              param.seriesName ?? '',
              typeof param.value === 'number' ? param.value : null,
              param.color ?? ''
            );
          })
          .join('<br/>');

        return `${label}<br/>${colorBlocks}`;
      },
    },
    legend: {
      data: ['Forecast emissions', 'Measured emissions'],
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
    },
    xAxis: {
      type: 'value',
      name: 'ktCO2e', // TODO: get unit from backend
    },
    yAxis: {
      type: 'category',
      data: mostRecentMeasuredEmissions.measured.map((m, i) => {
        const forecast = mostRecentMeasuredEmissions.forecast[i].value;
        const measured = m.value;
        const isOnTrack = measured <= forecast;
        const status = isOnTrack
          ? `{statusOnTrack|${t('on-track')}}`
          : `{statusOffTrack|${t('off-track')}}`;

        return `${m.label}\n${status}`;
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
    },
    series: [
      {
        name: 'Forecast emissions',
        type: 'bar',
        data: mostRecentMeasuredEmissions.forecast.map((f) => f.value),
        itemStyle: {
          color: (params) => {
            const forecast = mostRecentMeasuredEmissions.forecast[params.dataIndex];
            return forecast.color;
          },
        },
      },
      {
        name: 'Measured emissions',
        type: 'bar',
        data: mostRecentMeasuredEmissions.measured.map((m) => m.value),
        itemStyle: {
          color: (params) => {
            const measured = mostRecentMeasuredEmissions.measured[params.dataIndex];
            return measured.color;
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
  data = MOCK_DATA,
  isModalOpen,
  onModalOpenChange,
  selectedYear,
  onSelectedYearChange,
}: ProgressIndicatorProps) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const measuredYears = data
    .sort((a, b) => b.year - a.year)
    .filter((data) => data.measured.length > 0);

  const mostRecentMeasuredEmissions = measuredYears[0];
  const selectedEmissions = measuredYears.find((d) => d.year === selectedYear);

  const { delta: mostRecentDelta } = getTotalMeasuredAndForecast(mostRecentMeasuredEmissions);
  const selectedEmissionsWithTotals = selectedEmissions
    ? getTotalMeasuredAndForecast(selectedEmissions)
    : undefined;
  const totalForecast = selectedEmissionsWithTotals?.totalForecast ?? null;
  const totalMeasured = selectedEmissionsWithTotals?.totalMeasured ?? null;

  const status = getStatus(mostRecentDelta, t, theme);
  const chartConfig = selectedEmissionsWithTotals
    ? getChartConfig(selectedEmissionsWithTotals, t, theme)
    : undefined;

  function handleOpenModal() {
    onModalOpenChange(true);
  }

  function toggleDropdown() {
    setDropdownOpen(!dropdownOpen);
  }

  function handleYearSelect(year: number) {
    onSelectedYearChange(year);
  }

  return (
    <>
      <StyledContainer>
        <StyledTitle>
          {t('measured-emissions')} ({mostRecentMeasuredEmissions.year})
        </StyledTitle>

        {mostRecentDelta !== 0 && (
          <StyledSubtitle>
            {t(mostRecentDelta < 0 ? 'higher-than-forecast' : 'lower-than-forecast', {
              percentage: Math.abs(mostRecentDelta),
            })}
          </StyledSubtitle>
        )}

        <div>
          <StyledStatusBadge
            onClick={handleOpenModal}
            $backgroundColor={status.backgroundColor}
            $color={status.color}
          >
            <StyledIndicator />
            <span>{status.label}</span>
          </StyledStatusBadge>
        </div>

        <StyledViewDetails onClick={handleOpenModal}>{t('view-details')}</StyledViewDetails>
      </StyledContainer>

      <Modal
        isOpen={isModalOpen}
        toggle={() => onModalOpenChange(false)}
        role="dialog"
        aria-modal="true"
        centered
      >
        <ModalHeader toggle={() => onModalOpenChange(false)}>
          {t('measured-emissions')} ({selectedEmissions?.year})
        </ModalHeader>
        <ModalBody>
          <StyledYearSelector>
            <Dropdown isOpen={dropdownOpen} toggle={toggleDropdown}>
              <DropdownToggle caret>{selectedYear}</DropdownToggle>
              <DropdownMenu>
                {measuredYears.map(({ year }) => (
                  <DropdownItem key={year} onClick={() => handleYearSelect(year)}>
                    {year}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>
          </StyledYearSelector>

          <StyledFlexContainer>
            {totalForecast != null && (
              <EmissionsCard
                title={t('total-forecast-emissions', { year: selectedEmissions?.year })}
                value={totalForecast}
                unit={'ktCO2e'} // TODO: get unit from backend
              />
            )}
            {totalMeasured != null && (
              <EmissionsCard
                title={t('total-measured-emissions', { year: selectedEmissions?.year })}
                value={totalMeasured}
                unit={'ktCO2e'} // TODO: get unit from backend
              />
            )}
          </StyledFlexContainer>
          <h5>{t('emissions-by-sector', { year: selectedEmissions?.year })}</h5>
          <StyledCard>
            <StyledChartWrapper>
              {chartConfig && <Chart isLoading={false} data={chartConfig} />}
            </StyledChartWrapper>
          </StyledCard>
        </ModalBody>
      </Modal>
    </>
  );
};
