import { useTranslation } from 'next-i18next';

import { beautifyValue } from '@common/utils/format';

import { useFeatures } from '@/common/instance';

const ScenarioOutcomeAsText = (props: {
  isForecast: boolean;
  scenarioName: string;
  goalType: string;
  selectedYear: number;
  selectedYearDifference: number;
  selectedYearValue: number;
  nearestGoalYear: number;
  nearestGoalValue: number;
  unit: string;
}) => {
  const { t } = useTranslation();
  const maximumFractionDigits = useFeatures().maximumFractionDigits ?? undefined;
  const {
    isForecast,
    scenarioName,
    goalType,
    selectedYear,
    selectedYearDifference,
    selectedYearValue,
    nearestGoalYear,
    nearestGoalValue,
    unit,
  } = props;

  const selectedYearValueFormatted = `${beautifyValue(
    selectedYearValue,
    undefined,
    maximumFractionDigits ?? undefined
  )} ${unit}`;
  const nearestGoalValueFormatted = `${beautifyValue(
    nearestGoalValue,
    undefined,
    maximumFractionDigits ?? undefined
  )} ${unit}`;
  if (isForecast) {
    return (
      <div
        dangerouslySetInnerHTML={{
          __html: t('outcome-bar-summary-forecast', {
            scenarioName,
            goalType,
            selectedYear,
            selectedYearValue: selectedYearValueFormatted,
            nearestGoalYear,
            nearestGoalValue: nearestGoalValueFormatted,
            interpolation: { escapeValue: false },
          }),
        }}
      />
    );
  } else {
    return (
      <div
        dangerouslySetInnerHTML={{
          __html: t('outcome-bar-summary-historical', {
            goalType,
            selectedYear,
            selectedYearDifference,
            nearestGoalYear,
            nearestGoalValue: nearestGoalValueFormatted,
            interpolation: { escapeValue: false },
          }),
        }}
      />
    );
  }
};

export default ScenarioOutcomeAsText;
