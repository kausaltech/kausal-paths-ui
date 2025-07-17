import React, { useState } from 'react';

import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Stack,
  Typography,
} from '@mui/material';
import { Dash, Plus } from 'react-bootstrap-icons';
import { useTranslation } from 'react-i18next';

import { Chart } from '../charts/Chart';

export type DashboardProgressItem = {
  title: string;
  chartLabel?: string;
  color?: string;
  value: number;
  targetValue?: number;
  min?: number;
  max?: number;
  unit?: string;
  description?: string;
};

type Props = {
  items?: DashboardProgressItem[];
};

const getBarOption = (item: DashboardProgressItem) => {
  const min = item.min ?? 0;
  const max = item.max ?? 100;
  const value = item.value;
  const target = item.targetValue;
  return {
    grid: { left: 0, right: 0, top: 20, bottom: 20 },
    xAxis: {
      min,
      max,
      show: false,
    },
    yAxis: {
      type: 'category',
      data: [''],
      show: false,
    },
    series: [
      {
        type: 'bar',
        data: [value],
        barWidth: 20,
        itemStyle: {
          color: item.color || '#1976d2',
        },
        z: 2,
      },
      target !== undefined
        ? {
            type: 'bar',
            data: [target],
            barWidth: 8,
            itemStyle: {
              color: '#ff9800',
            },
            z: 3,
          }
        : {},
    ],
    animation: false,
    tooltip: {
      show: false,
    },
  };
};

const DashboardVisualizationProgress = ({ items = [] }: Props) => {
  const [expanded, setExpanded] = useState<number[]>([]);

  const { t } = useTranslation();

  const allExpanded = items.length > 0 && expanded.length === items.length;

  const handleExpandAll = () => {
    setExpanded(items.map((_, i) => i));
  };

  const handleCollapseAll = () => {
    setExpanded([]);
  };

  const handleChange = (idx: number) => (_: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded((prev) => (isExpanded ? [...prev, idx] : prev.filter((i) => i !== idx)));
  };

  return (
    <Box sx={{ my: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', color: 'text.secondary' }}>
        {allExpanded ? (
          <Button
            color="inherit"
            size="small"
            onClick={handleCollapseAll}
            sx={{ color: 'inherit', fontWeight: 'fontWeightRegular', textDecoration: 'underline' }}
          >
            {t('collapse-all')}
          </Button>
        ) : (
          <Button
            color="inherit"
            size="small"
            onClick={handleExpandAll}
            sx={{ color: 'inherit', fontWeight: 'fontWeightRegular', textDecoration: 'underline' }}
          >
            {t('expand-all')}
          </Button>
        )}
      </Box>

      <Stack>
        {items.map((item, idx) => {
          const isItemExpanded = expanded.includes(idx);

          return (
            <Accordion
              key={idx}
              expanded={isItemExpanded}
              onChange={handleChange(idx)}
              disableGutters
            >
              <AccordionSummary
                expandIcon={isItemExpanded ? <Dash size={30} /> : <Plus size={30} />}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  <Typography variant="h4" component="p" sx={{ color: 'text.primary', flex: 1 }}>
                    {item.title}
                  </Typography>

                  <Typography sx={{ minWidth: 100, textAlign: 'right', mx: 1 }}>
                    <Typography
                      variant="h4"
                      component="span"
                      sx={{ color: 'text.primary', fontWeight: 'fontWeightRegular' }}
                    >
                      {item.value}{' '}
                    </Typography>

                    {item.unit && <span>{item.unit}</span>}
                  </Typography>
                </Box>
              </AccordionSummary>

              <AccordionDetails>
                <Box sx={{ width: '100%', maxWidth: 500, mb: 1 }}>
                  <Chart isLoading={false} data={getBarOption(item)} height="60px" />
                </Box>
                {item.description && (
                  <Typography variant="body2" color="text.secondary">
                    {item.description}
                  </Typography>
                )}
              </AccordionDetails>
            </Accordion>
          );
        })}
      </Stack>
    </Box>
  );
};

export default DashboardVisualizationProgress;
