import { useState } from 'react';
import { useTranslation } from 'next-i18next';
import styled, { useTheme } from 'styled-components';
import dynamic from 'next/dynamic';
import { Col, Row } from 'reactstrap';
import {ArrowRight} from 'react-bootstrap-icons';

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

  const { data, impactUnit, impactName, efficiencyUnit, efficiencyName, actions, actionIds } = props;
  const theme = useTheme();
  const { i18n } = useTranslation();
  const barColor = theme.graphColors.green070;
  const barHoverColor = theme.graphColors.green090;

  const [barColors, setBarColors] = useState(data['efficiency'].map((bar) => barColor));
  const [hoverId, setHoverId] = useState(null);

  //console.log("mac props", props);
  // TODO: Add sorting of data here

  let totalSaving = 0;
  const xPlacement = data['impact'].map((bar) => {
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
      title: `${efficiencyName} (${efficiencyUnit})`
/*      title: "Marginalnetto-kostnad",*/
    },
    xaxis: {
      ticksuffix: ` ${impactUnit}`,
      title: `${impactName} (${impactUnit})`,
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
    const hoverColors = data['efficiency'].map((bar) =>  barColor);
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
        y: data['efficiency'],
        text: data['actions'],
        width: data['impact'], 
        marker: {
          color: barColors,
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
            "%{yaxis.title.text}: %{y:.0f}<br>" +
            "%{xaxis.title.text}: %{customdata:.0f}<br>" +
            "<extra></extra>",
      }]}
      layout={layout}
      useResizeHandlers
      style={{ width: '100%' }}
      config={{ displayModeBar: false }}
      onHover={(evt) => handleHover(evt)}
    />
    { hoverId !== null && 
    <ActionDescription>
      <a href={`/actions/${actionIds[hoverId]}/`}>
        <h4>
          {data.actions[hoverId]}
          <ArrowRight />
        </h4>
      </a>
      <Row>
        <Col md={3}>
          <HoverValue>
            <HoverValueTitle>Efficiency</HoverValueTitle>
            <HoverValueValue>{Math.round(Number(data.efficiency[hoverId])).toLocaleString(i18n.language)}</HoverValueValue>
            <HoverValueUnit>{efficiencyUnit}</HoverValueUnit>
          </HoverValue>
        </Col>
        <Col md={3}>
          <HoverValue>
            <HoverValueTitle>Impact</HoverValueTitle>
            <HoverValueValue>{Math.round(Number(data.impact[hoverId])).toLocaleString(i18n.language)}</HoverValueValue>
            <HoverValueUnit>{impactUnit}</HoverValueUnit>
          </HoverValue>
        </Col>
      </Row>
    </ActionDescription>
  }
  </GraphContainer>
  )
}

export default MacGraph;