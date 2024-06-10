import { ChartWrapper } from 'components/charts/ChartWrapper';
import { Chart } from 'components/charts/Chart';
import { useTranslation } from 'react-i18next';

type Props = {
  isLoading: boolean;
};

export function CostBenefitAnalysis({ isLoading }: Props) {
  const { t } = useTranslation();

  return (
    <ChartWrapper title={t('cost-benefit-analysis')} isLoading={isLoading}>
      <Chart />
    </ChartWrapper>
  );
}
