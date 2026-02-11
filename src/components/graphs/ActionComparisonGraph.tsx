import { useCallback, useEffect, useMemo, useState } from 'react';

import dynamic from 'next/dynamic';

import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import { Grid } from '@mui/material';
import { useTranslation } from 'next-i18next';

import Icon from '@/components/common/icon';

const Plot = dynamic(() => import('@/components/graphs/Plot'), { ssr: false });

const GraphContainer = styled.div`
  .js-plotly-plot {
    margin-bottom: 1rem;
  }
`;

const ActionDescription = styled.div`
  margin-bottom: 2rem;
  padding: 1rem;
  border-radius: 0;
  border-left: 5px solid ${(props) => props.color};
  font-size: 1rem;
  background-color: ${(props) => props.theme.graphColors.grey010};

  h4 {
    margin-bottom: 1rem;
  }
`;

const HoverValue = styled.div``;

const HoverGroupTag = styled.span`
  font-size: 80%;
`;

const HoverValueTitle = styled.div`
  line-height: 1;
  margin-bottom: 0.5rem;
`;

const HoverValueValue = styled.span`
  font-size: 1.75rem;
  font-weight: 700;
  line-height: 1;
  margin-right: 0.5rem;
`;

const HoverValueUnit = styled.span``;

const formatNumber = (value: number, language: string) => {
  return parseFloat(Number(value).toPrecision(3)).toLocaleString(language);
};

type ActionComparisonData = {
  actions: string[];
  impact: number[];
  colors: (string | null | undefined)[];
  groups: (string | undefined)[];
};

type ActionComparisonGraphProps = {
  data: ActionComparisonData;
  effectUnit: string | undefined;
  impactName: string;
  actionIds: string[];
  actionGroups: { id: string; name: string }[];
};

function ActionComparisonGraph(props: ActionComparisonGraphProps) {
  const { data, effectUnit, impactName, actionIds, actionGroups } = props;
  const theme = useTheme();
  const { t, i18n } = useTranslation();

  const [hoverId, setHoverId] = useState<number | null>(null);

  useEffect(() => {
    setHoverId(null);
  }, [data]);

  const layout = useMemo(
    () => ({
      height: 300,
      barmode: 'relative' as const,
      hoverlabel: {
        bgcolor: theme.themeColors.white,
        bordercolor: theme.graphColors.grey030,
        font: {
          family: theme.fontFamily,
          color: theme.graphColors.grey090,
        },
      },
      hovermode: 'x unified' as const,
      hoverdistance: 10,
      yaxis: {
        title: {
          text: `${impactName} (${effectUnit})`,
        },
      },
      xaxis: {
        title: {
          text: t('actions'),
        },
        showgrid: true,
        showticklabels: false,
      },
      margin: {
        l: 50,
        r: 0,
        b: 60,
        t: 10,
        pad: 0,
      },
      paper_bgcolor: theme.themeColors.white,
      plot_bgcolor: theme.themeColors.white,
    }),
    [theme, effectUnit, impactName, t]
  );

  const handleHover = useCallback(
    (evt: { points: { pointIndex: number }[] }) => {
      const hoveredIndex = evt.points[0].pointIndex;
      setHoverId(hoveredIndex);
      return null;
    },
    [setHoverId]
  );

  const plot = useMemo(
    () => (
      <Plot
        data={[
          {
            type: 'bar',
            x: data.actions,
            y: data.impact,
            text: data.actions,
            name: impactName,
            marker: {
              color: data.colors,
              opacity: 0.9,
              line: {
                color: theme.themeColors.white,
                width: 2,
              },
            },
            textposition: 'none',
            customdata: data.impact,
            hovertemplate: `%{y:.3r} ${effectUnit}`,
          },
        ]}
        layout={layout}
        useResizeHandler
        style={{ width: '100%' }}
        config={{ displayModeBar: false }}
        onHover={(evt) => handleHover(evt)}
      />
    ),
    [data, theme, layout, handleHover, effectUnit, impactName]
  );

  if (data.actions?.length < 1) return <div />;

  return (
    <GraphContainer>
      {plot}
      {hoverId !== null && (
        <ActionDescription color={data.colors[hoverId] ?? undefined}>
          <a href={`/actions/${actionIds[hoverId]}/`}>
            <HoverGroupTag color={data.colors[hoverId] ?? undefined}>
              {actionGroups.find((group) => group.id === data.groups[hoverId])?.name}
            </HoverGroupTag>
            <h4>
              {data.actions[hoverId]} <Icon name="arrowRight" />
            </h4>
          </a>
          <Grid container spacing={2}>
            <Grid size={{ md: 3 }} sx={{ display: 'flex', alignItems: 'end' }}>
              <HoverValue>
                <HoverValueTitle>{impactName}</HoverValueTitle>
                <HoverValueValue>
                  {formatNumber(data.impact[hoverId], i18n.language)}
                </HoverValueValue>
                <HoverValueUnit dangerouslySetInnerHTML={{ __html: effectUnit ?? '' }} />
              </HoverValue>
            </Grid>
            <Grid size={{ md: 3 }} sx={{ display: 'flex', alignItems: 'end' }} />
            <Grid size={{ md: 3 }} sx={{ display: 'flex', alignItems: 'end' }} />
          </Grid>
        </ActionDescription>
      )}
    </GraphContainer>
  );
}

export default ActionComparisonGraph;
