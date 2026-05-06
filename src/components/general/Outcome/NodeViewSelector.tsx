import { useRouter } from 'next/navigation';

import { Box, FormControl, MenuItem, Select } from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';

import {
  BarChartLineFill,
  BoxArrowUpRight,
  InfoCircleFill,
  PieChartFill,
  Table,
} from 'react-bootstrap-icons';

import { useTheme } from '@common/themes';
import styled from '@common/themes/styled';

import { useTranslations } from '@/common/i18n';
import { useInstance } from '@/common/instance';
import { formatUrl } from '@/common/links';
import { useSiteOrNull } from '@/context/site';

const StyledMenuItem = styled(MenuItem)`
  padding: 0.5rem 1rem;

  svg.bi {
    margin-right: 0.5rem;
    fill: ${({ theme }) => theme.textColor.tertiary};
  }
`;

const NodeViewSelector = ({
  idPrefix,
  activeTabId,
  setActiveTabId,
  showDistribution,
}: {
  idPrefix: string;
  activeTabId: string;
  setActiveTabId: (tabId: string) => void;
  showDistribution: boolean;
}) => {
  const selectId = `${idPrefix}-view-select`;
  const t = useTranslations();
  const theme = useTheme();
  const instance = useInstance();
  const router = useRouter();
  const site = useSiteOrNull();

  const handleChange = (event: SelectChangeEvent) => {
    if (event.target.value === 'node-page') {
      router.push(formatUrl(site, `/node/${idPrefix}`));
      return;
    }
    const tabId = event.target.value;
    setActiveTabId(tabId);
    // A11y: After switching the view, move focus to the new region
    const targetRegionId = `${idPrefix}-panel-${tabId}`;
    requestAnimationFrame(() => {
      document.getElementById(targetRegionId)?.focus();
    });
  };

  const allItems = [
    {
      id: 'year',
      icon: <PieChartFill aria-hidden="true" focusable="false" color={theme.textColor.tertiary} />,
      label: t('common.distribution'),
      show: showDistribution,
    },
    {
      id: 'graph',
      icon: (
        <BarChartLineFill aria-hidden="true" focusable="false" color={theme.textColor.tertiary} />
      ),
      label: t('common.time-series'),
      show: true,
    },
    {
      id: 'table',
      icon: <Table aria-hidden="true" focusable="false" color={theme.textColor.tertiary} />,
      label: t('common.table'),
      show: true,
    },
    {
      id: 'info',
      icon: (
        <InfoCircleFill aria-hidden="true" focusable="false" color={theme.textColor.tertiary} />
      ),
      label: t('common.details'),
      show: true,
    },
    {
      id: 'node-page',
      icon: (
        <BoxArrowUpRight aria-hidden="true" focusable="false" color={theme.textColor.tertiary} />
      ),
      label: t('common.node-open'),
      show: true,
    },
  ];

  const items = allItems.filter((item) => item.show);

  return (
    <Box>
      <FormControl size="small">
        <Select
          id={selectId}
          value={activeTabId}
          onChange={handleChange}
          inputProps={{ 'aria-label': t('common.view-options') }}
          sx={{
            backgroundColor: 'transparent',
            '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
          }}
          renderValue={(value) => {
            const item = items.find((i) => i.id === value);
            return (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {item?.icon}
                {item?.label ?? t('common.view-options')}
              </Box>
            );
          }}
          size="small"
        >
          {items.map((item) => (
            <StyledMenuItem key={item.id} value={item.id}>
              {item.icon} {item.label}
            </StyledMenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
};

export default NodeViewSelector;
