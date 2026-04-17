import { useTranslation } from '@/common/i18n';
import { useNumberFormatter } from '@/common/numbers';

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
  const formatNumber = useNumberFormatter();
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

  const selectedYearValueFormatted = `${formatNumber(selectedYearValue)} ${unit}`;
  const nearestGoalValueFormatted = `${formatNumber(nearestGoalValue)} ${unit}`;
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
          }),
        }}
      />
    );
  }
};

export default ScenarioOutcomeAsText;
