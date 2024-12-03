import type { Theme } from '@kausal/themes/types';
import type { TFunction } from 'i18next';

type Status = {
  key: 'ON_TRACK' | 'OFF_TRACK' | 'DEVIATING';
  label: string;
  subLabel?: string;
  color: string;
  iconColor: string;
  backgroundColor: string;
};

export function getStatus(deltaPercentage: number, t: TFunction, theme: Theme): Status {
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
