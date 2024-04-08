import { ChartWrapper } from 'components/charts/ChartWrapper';
import { Chart } from 'components/charts/Chart';
import { useTranslation } from 'react-i18next';

type Props = {
  isLoading: boolean;
};

export function ReturnOnInvestment({ isLoading }: Props) {
  const { t } = useTranslation();

  return (
    <ChartWrapper title={t('return-on-investment')} isLoading={isLoading}>
      <Chart />
    </ChartWrapper>
  );
}
