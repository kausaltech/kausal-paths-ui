import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'next-i18next';
import styled, { useTheme } from 'styled-components';
import dynamic from 'next/dynamic';
import { Col, Row } from 'reactstrap';
import {ArrowRight} from 'react-bootstrap-icons';
import { t } from 'i18next';

const Plot = dynamic(() => import('components/graphs/Plot'),
  { ssr: false });

const GraphContainer = styled.div`
  .js-plotly-plot {
    margin-bottom: 1rem;
  }
`;

const ActionDescription = styled.div`
  margin-bottom: 2rem;
  padding: 1rem;
  border-radius:  ${(props) => props.theme.cardBorderRadius};
  font-size: 1rem;
  background-color: ${(props) => props.theme.graphColors.grey010};

  h4 {
    margin-bottom: 1rem;
  }
`;

const HoverValue = styled.div`

`;

const HoverGroupTag = styled.span`
  font-size: 80%;
  color: ${(props) => props.color};
`;

const HoverValueTitle = styled.div`
  line-height: 1;
  margin-bottom: .5rem;
`;

const HoverValueValue = styled.span`
  font-size: 1.75rem;
  font-weight: 700;
  line-height: 1;
  margin-right: .5rem;
`;

const HoverValueUnit = styled.span`
`;

const formatNumber = (value, language) => {
  return parseFloat(Number(value).toPrecision(3)).toLocaleString(language)
};

function MacGraph(props) {
  const { data, impactUnit, impactName, efficiencyUnit, efficiencyName, actionIds, costName, costUnit, actionGroups } = props;
  const theme = useTheme();
  const { i18n } = useTranslation();

  const barHoverColor = theme.graphColors.green090;

  const [barColors, setBarColors] = useState(data.colors);
  const [hoverId, setHoverId] = useState(null);

  useEffect(() => {
    // Update the document title using the browser API
    setHoverId(null);
  }, [data]);

  // console.log("mac props", props);
  // TODO: Add sorting of data here

  if (data.actions?.length < 1) return <div/>

  let totalSaving = 0;
  let negativeSideWidth = 0;
  const xPlacement = data['impact'].map((bar) => {
    const barWidth = Math.abs(bar);
    if (bar < 0) {
      negativeSideWidth += barWidth;
      return -negativeSideWidth + barWidth - (barWidth/2);
    } 
    totalSaving += barWidth;
    return totalSaving - barWidth + (barWidth/2);
  }  );

  const negativeSide = useMemo(() => (negativeSideWidth > 0 ? [
    {
    type: 'rect',
    // x-reference is assigned to the x-values
    xref: 'x',
    // y-reference is assigned to the plot paper [0,1]
    yref: 'paper',
    x0: -negativeSideWidth,
    y0: 0,
    x1: 0,
    y1: 1,
    fillcolor: theme.graphColors.red030,
    opacity: 0.2,
    line: {
        width: 0
    }},
    {
      type: 'line',
      xref: 'x',
      yref: 'paper',
      x0: 0,
      y0: 0,
      x1: 0,
      y1: 1,
      line: {
        color: theme.graphColors.red030,
        width: 1
      }
    }
  ] : []), [theme, negativeSideWidth]);
  const layout = useMemo(() => ({
    barmode: 'relative',
    hoverlabel: { 
      bgcolor: theme.themeColors.white,
      bordercolor: theme.graphColors.grey030,
      font: {
        family: theme.fontFamily,
        color: theme.graphColors.grey090,
      }
    },
    yaxis: {
      title: `${efficiencyName} (${efficiencyUnit})`
    },
    xaxis: {
      ticksuffix: ` ${impactUnit}`,
      title: `${impactName} (${impactUnit})`,
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
  }), [theme, efficiencyName, efficiencyUnit, impactUnit, impactName, negativeSide]);

  const handleHover = useCallback((evt) => {
    // console.log("HOVERED", evt);
    const hoveredIndex = evt.points[0].pointIndex;
    //const hoverColors = data.colors;
    //hoverColors[hoveredIndex] = "#333";
    //setBarColors(hoverColors);
    setHoverId(hoveredIndex);
    return null;
  }, [setHoverId]);

  const plot = useMemo(() => (
    <Plot
      data={[{
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
            width: 2
          }
        },
        textposition: 'none',
        customdata: data['impact'],
        hovertemplate:
            "<b>%{text}</b><br><br>" +
            "%{yaxis.title.text}: %{y:.3r}<br>" +
            "%{xaxis.title.text}: %{customdata:.3r}<br>" +
            "<extra></extra>",
      }]}
      layout={layout}
      useResizeHandlers
      style={{ width: '100%' }}
      config={{ displayModeBar: false }}
      onHover={(evt) => handleHover(evt)}
    />
  ), [data, theme, layout, handleHover])

  return (
  <GraphContainer>
    { plot }
    { hoverId !== null && 
    <ActionDescription>
      <a href={`/actions/${actionIds[hoverId]}/`}>
        <HoverGroupTag color={data.colors[hoverId]}>{actionGroups.find((group) => group.id === data.groups[hoverId])?.name}</HoverGroupTag>
        <h4>
          {data.actions[hoverId]}
          {' '}
          <ArrowRight />
        </h4>
      </a>
      <Row>
        <Col md={3} className="d-flex align-items-end">
          <HoverValue>
            <HoverValueTitle>{impactName}</HoverValueTitle>
            <HoverValueValue>{formatNumber(data.impact[hoverId], i18n.language)}</HoverValueValue>
            <HoverValueUnit dangerouslySetInnerHTML={{__html: impactUnit}} />
          </HoverValue>
        </Col>
        <Col md={3} className="d-flex align-items-end">
          <HoverValue>
            <HoverValueTitle>{costName}</HoverValueTitle>
            <HoverValueValue>{formatNumber(data.cost[hoverId], i18n.language)}</HoverValueValue>
            <HoverValueUnit dangerouslySetInnerHTML={{__html: costUnit}} />
          </HoverValue>
        </Col>
        <Col md={3} className="d-flex align-items-end">
          <HoverValue>
            <HoverValueTitle>{efficiencyName}</HoverValueTitle>
            <HoverValueValue>{formatNumber(data.efficiency[hoverId], i18n.language)}</HoverValueValue>
            <HoverValueUnit dangerouslySetInnerHTML={{__html: efficiencyUnit}} />
          </HoverValue>
        </Col>
      </Row>
    </ActionDescription>
  }
  </GraphContainer>
  )
}

export default MacGraph;