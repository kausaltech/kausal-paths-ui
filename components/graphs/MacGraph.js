import { useState } from 'react';
import { useTheme } from 'styled-components';
import dynamic from 'next/dynamic';

const Plot = dynamic(() => import('components/graphs/Plot'),
  { ssr: false });

function MacGraph(props) {

  const { data } = props;
  const theme = useTheme();
  const barColor = theme.graphColors.green070;
  const barHoverColor = theme.graphColors.green090;

  const [barColors, setBarColors] = useState(data['netcost'].map((bar) => barColor));
  const [hoverText, setHoverText] = useState(null);

  let totalSaving = 0;
  const xPlacement = data['energySaving'].map((bar) => {
    totalSaving += bar;
    return totalSaving - bar + (bar/2);
  }  );

  const layout = {
    barmode: 'relative',
    hoverlabel: { 
      bgcolor: theme.graphColors.grey005,
      bordercolor: theme.graphColors.grey005,
      font: {
        family: theme.fontFamily,
        color: theme.graphColors.grey090,
      }
    },
    yaxis: {
      title: "Marginalnetto-kostnad",
    },
    xaxis: {
      ticksuffix: " kWh/år",
      title: "Total energibesparing",
      showticklabels: false,
    },
  };

  const handleHover = (evt) => {
    // console.log("HOVERED", evt);
    const hoveredIndex = evt.points[0].pointIndex;
    const hoverColors = data['netcost'].map((bar) =>  barColor);
    hoverColors[hoveredIndex] = barHoverColor;
    setBarColors(hoverColors);
    setHoverText(`${data.actions[hoveredIndex]}: ${evt.points[0].label} kWh/year — ${evt.points[0].value} SEK/year`);
    return null;
  };

  return (
  <>
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
            color: theme.graphColors.grey005,
            width: 2
          }
        },
        textposition: 'none',
        hovertemplate:
            "<b>%{text}</b><br><br>" +
            "%{yaxis.title.text}: %{y:,} SEK/hWh<br>" +
            "%{xaxis.title.text}: %{x:,} kWh/år<br>" +
            "<extra></extra>",

      }]}
      layout={layout}
      useResizeHandler
      style={{ width: '100%' }}
      config={{ displayModeBar: false }}
      onHover={(evt) => handleHover(evt)}
    />
    <div>
      { hoverText }
    </div>
  </>
  )
}

export default MacGraph;