import { useState } from 'react';
import styled, { useTheme } from 'styled-components';
import dynamic from 'next/dynamic';
import { Col, Row } from 'reactstrap';

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

const HoverValue = styled.div``;

const HoverValueTitle = styled.div`
`;

const HoverValueValue = styled.span`
  font-size: 2rem;
  font-weight: 700;
  line-height: 1;
  margin-right: .5rem;
`;

const HoverValueUnit = styled.span`
`;

function MacGraph(props) {

  const { data } = props;
  const theme = useTheme();
  const barColor = theme.graphColors.green070;
  const barHoverColor = theme.graphColors.green090;

  const [barColors, setBarColors] = useState(data['netcost'].map((bar) => barColor));
  const [hoverId, setHoverId] = useState(null);

  let totalSaving = 0;
  const xPlacement = data['energySaving'].map((bar) => {
    totalSaving += bar;
    return totalSaving - bar + (bar/2);
  }  );

  const layout = {
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
      title: "Marginal net cost (EUR/kWh)"
/*      title: "Marginalnetto-kostnad",*/
    },
    xaxis: {
      ticksuffix: " GWh/a",
      title: "Energy saving (GWh/a)",
/*      title: "Energibesparing",*/
      showticklabels: false,
    },
    margin: {
      l: 50,
      r: 0,
      b: 10,
      t: 10,
      pad: 0,
    },
    paper_bgcolor: theme.themeColors.white,
    plot_bgcolor: theme.themeColors.white,
  };

  const handleHover = (evt) => {
    // console.log("HOVERED", evt);
    const hoveredIndex = evt.points[0].pointIndex;
    const hoverColors = data['netcost'].map((bar) =>  barColor);
    hoverColors[hoveredIndex] = barHoverColor;
    setBarColors(hoverColors);
    setHoverId(hoveredIndex);
    return null;
  };

  return (
  <GraphContainer>
    <Plot
      data={[{
        type: 'bar',
        x: xPlacement,
        y: data['netcost'],
        text: data['actions'],
        width: data['energySaving'], 
        marker: {
          color: barColors,
          opacity: 0.9,
          line: {
            color: theme.themeColors.white,
            width: 2
          }
        },
        textposition: 'none',
        customdata: data['energySaving'],
        hovertemplate:
            "<b>%{text}</b><br><br>" +
            "%{yaxis.title.text}: %{y:,}<br>" +
            "%{xaxis.title.text}: %{customdata:,}<br>" +
            "<extra></extra>",
      }]}
      layout={layout}
      useResizeHandler
      style={{ width: '100%' }}
      config={{ displayModeBar: false }}
      onHover={(evt) => handleHover(evt)}
    />
    { hoverId !== null && 
    <ActionDescription>
      <h4>{data.actions[hoverId]}</h4>
      <Row>
        <Col md={3}>
          <HoverValue>
            <HoverValueTitle>Marginal net cost</HoverValueTitle>
            <HoverValueValue>{Number(data.netcost[hoverId]).toLocaleString()}</HoverValueValue>
            <HoverValueUnit>EUR/kWh</HoverValueUnit>
          </HoverValue>
        </Col>
        <Col md={3}>
          <HoverValue>
            <HoverValueTitle>Energy saving</HoverValueTitle>
            <HoverValueValue>{Number(data.energySaving[hoverId]).toLocaleString()}</HoverValueValue>
            <HoverValueUnit>GWh/a</HoverValueUnit>
          </HoverValue>
        </Col>
      </Row>
    </ActionDescription>
  }
  </GraphContainer>
  )
}

export default MacGraph;