import { useCallback, useEffect, useMemo, useState } from 'react';

import dynamic from 'next/dynamic';

import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import { Grid } from '@mui/material';
import { useTranslation } from 'next-i18next';
import type Plotly from 'plotly.js';

import type { ActionListQuery } from '@/common/__generated__/graphql';
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
  font-size: 1rem;
  background-color: ${(props) => props.theme.graphColors.grey010};

  h4 {
    margin-bottom: 1rem;
  }
`;

const HoverValue = styled.div``;

const HoverGroupTag = styled.span`
  font-size: 80%;
  color: ${(props) => props.color};
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

const EmptyPlot = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 450px;
  margin: 0 0 2rem;
`;

const formatNumber = (value, language: string) => {
  return parseFloat(Number(value).toPrecision(3)).toLocaleString(language);
};

/*
  const macData = {
    ids: sortedActions.map((action) => action.id),
    actions: sortedActions.map((action) => action.name),
    colors: sortedActions.map((action) => action.color || action.group?.color),
    groups: sortedActions.map((action) => action.group?.id),
    cost: sortedActions.map((action) => action.cumulativeCost),
    efficiency: sortedActions.map((action) => action.cumulativeEfficiency),
    impact: sortedActions.map((action) => action.cumulativeImpact),
  };
*/
type MacGraphProps = {
  data: {
    ids: string[];
    actions: string[];
    colors: string[];
    groups: string[];
    cost: number[];
    efficiency: number[];
    impact: number[];
  };
  effectUnit: string;
  impactName: string;
  indicatorUnit: string;
  efficiencyName: string;
  actionIds: string[];
  costName: string;
  costUnit: string;
  actionGroups: ActionListQuery['instance']['actionGroups'];
};

function MacGraph(props: MacGraphProps) {
  const {
    data,
    effectUnit,
    impactName,
    indicatorUnit,
    efficiencyName,
    actionIds,
    costName,
    costUnit,
    actionGroups,
  } = props;
  const theme = useTheme();
  const { i18n, t } = useTranslation();

  const [hoverId, setHoverId] = useState<number | null>(null);

  useEffect(() => {
    // Update the document title using the browser API
    setHoverId(null);
  }, [data]);

  // console.log("mac props", props);
  // TODO: Add sorting of data here

  const isEmpty = data.actions?.length < 1;

  const { xPlacement, negativeSideWidth } = useMemo(() => {
    const result = data['impact'].reduce(
      (acc, bar) => {
        const barWidth = Math.abs(bar);
        if (bar < 0) {
          const newNegativeSideWidth = acc.negativeSideWidth + barWidth;
          acc.xPlacement.push(-newNegativeSideWidth + barWidth - barWidth / 2);
          acc.negativeSideWidth = newNegativeSideWidth;
        } else {
          const newTotalSaving = acc.totalSaving + barWidth;
          acc.xPlacement.push(newTotalSaving - barWidth + barWidth / 2);
          acc.totalSaving = newTotalSaving;
        }
        return acc;
      },
      { xPlacement: [] as number[], negativeSideWidth: 0, totalSaving: 0 }
    );

    return { xPlacement: result.xPlacement, negativeSideWidth: result.negativeSideWidth };
  }, [data]);

  const negativeSide = useMemo<Partial<Plotly.Shape>[]>(
    () =>
      negativeSideWidth > 0
        ? [
            {
              type: 'rect' as const,
              // x-reference is assigned to the x-values
              xref: 'x' as const,
              // y-reference is assigned to the plot paper [0,1]
              yref: 'paper' as const,
              x0: -negativeSideWidth,
              y0: 0,
              x1: 0,
              y1: 1,
              fillcolor: theme.graphColors.red030,
              opacity: 0.2,
              line: {
                width: 0,
              },
            },
            {
              type: 'line' as const,
              xref: 'x' as const,
              yref: 'paper' as const,
              x0: 0,
              y0: 0,
              x1: 0,
              y1: 1,
              line: {
                color: theme.graphColors.red030,
                width: 1,
              },
            },
          ]
        : [],
    [theme, negativeSideWidth]
  );

  const layout = useMemo(
    () => ({
      height: 450,
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
          text: `${efficiencyName} (${indicatorUnit})`,
        },
      },
      xaxis: {
        ticksuffix: ` ${effectUnit}`,
        title: {
          text: `${impactName} (${effectUnit})`,
        },
        showgrid: true,
      },
      margin: {
        l: 50,
        r: 0,
        b: 60,
        t: 10,
        pad: 0,
      },
      shapes: negativeSide,
      paper_bgcolor: theme.themeColors.white,
      plot_bgcolor: theme.themeColors.white,
    }),
    [theme, efficiencyName, indicatorUnit, effectUnit, impactName, negativeSide]
  );

  const handleHover = useCallback(
    (evt: Plotly.PlotHoverEvent) => {
      // console.log("HOVERED", evt);
      const hoveredIndex: number = evt.points[0].pointIndex;
      //const hoverColors = data.colors;
      //hoverColors[hoveredIndex] = "#333";
      //setBarColors(hoverColors);
      setHoverId(hoveredIndex);
      return null;
    },
    [setHoverId]
  );

  const plot = useMemo(
    () =>
      isEmpty ? (
        <EmptyPlot>
          <h4>{t('actions-count', { count: 0 })}</h4>
        </EmptyPlot>
      ) : (
        <Plot
          data={[
            {
              type: 'bar',
              x: xPlacement,
              y: data['efficiency'],
              text: data['actions'],
              width: data['impact'],
              marker: {
                color: data.colors,
                opacity: 0.9,
                line: {
                  color: theme.themeColors.white,
                  width: 2,
                },
              },
              textposition: 'none',
              customdata: data['impact'],
              hovertemplate:
                '<b>%{text}</b><br><br>' +
                '%{yaxis.title.text}: %{y:.3r}<br>' +
                '%{xaxis.title.text}: %{customdata:.3r}<br>' +
                '<extra></extra>',
            },
          ]}
          layout={layout}
          useResizeHandler
          style={{ width: '100%' }}
          config={{ displayModeBar: false }}
          onHover={(evt) => handleHover(evt)}
        />
      ),
    [isEmpty, t, xPlacement, data, theme.themeColors.white, layout, handleHover]
  );

  return (
    <GraphContainer>
      {plot}
      {hoverId !== null && (
        <ActionDescription>
          <a href={`/actions/${actionIds[hoverId]}/`}>
            <HoverGroupTag color={data.colors[hoverId]}>
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
                <HoverValueUnit dangerouslySetInnerHTML={{ __html: effectUnit }} />
              </HoverValue>
            </Grid>
            <Grid size={{ md: 3 }} sx={{ display: 'flex', alignItems: 'end' }}>
              <HoverValue>
                <HoverValueTitle>{costName}</HoverValueTitle>
                <HoverValueValue>{formatNumber(data.cost[hoverId], i18n.language)}</HoverValueValue>
                <HoverValueUnit dangerouslySetInnerHTML={{ __html: costUnit }} />
              </HoverValue>
            </Grid>
            <Grid size={{ md: 3 }} sx={{ display: 'flex', alignItems: 'end' }}>
              <HoverValue>
                <HoverValueTitle>{efficiencyName}</HoverValueTitle>
                <HoverValueValue>
                  {formatNumber(data.efficiency[hoverId], i18n.language)}
                </HoverValueValue>
                <HoverValueUnit dangerouslySetInnerHTML={{ __html: indicatorUnit }} />
              </HoverValue>
            </Grid>
          </Grid>
        </ActionDescription>
      )}
    </GraphContainer>
  );
}

export default MacGraph;
