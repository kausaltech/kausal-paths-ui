import { useState } from 'react';
import { useTranslation } from 'next-i18next';
import styled, { useTheme } from 'styled-components';
import dynamic from 'next/dynamic';
import fiLocale from 'plotly.js-locales/fi';
import svLocale from 'plotly.js-locales/sv';
import Layout from 'components/Layout';

const MOCK_DATA = {
  actions: [
    'Low -energy lamps',
    'Pressure -controlled fans',
    'Adjustment ventilation system',
    'Sneak -flushing luminaires',
    'Presence controlled LED',
    'Replacement thermostats/valves + adjustment heating system',
    'Wind insulation 300mm',
    'Painting/sealing windows/doors',
    'New entrance/basement doors',
    'Heat exchanger wastewater',
    'IMD hot water',
    'FVP COP 3.0',
    'FTX 85 %',
    'Additional insulation windows',
    'Facade insulation 100mm',
    'Window replacement (U = 1.0)',
    ],  
  netcost:  [
    -30.8,
    -27.1,
    -21.1,
    -20.1,
    -17.8,
    -17.5,
    -17.1,
    -13.6,
    -13.5,
    -11.9,
    -11.9,
    -5,
    -1.9,
    -1.6,
    20.2,
    22.7,
    ],  
    energySaving: [
    10400000,
    41600000,
    52000000,
    62400000,
    10400000,
    135200000,
    36400000,
    20800000,
    26000000,
    52000000,
    52000000,
    166400000,
    78000000,
    78000000,
    43680000,
    31200000,
    ], 
};

const Plot = dynamic(() => import('components/graphs/Plot'),
  { ssr: false });

function MacPage() {

  const theme = useTheme();
  const [barColors, setBarColors] = useState(MOCK_DATA['netcost'].map((bar) => "rgb(158,202,225)"));
  const [hoverText, setHoverText] = useState(null);

  let totalSaving = 0;
  const xPlacement = MOCK_DATA['energySaving'].map((bar) => {
    totalSaving += bar;
    return totalSaving - bar + (bar/2);
  }  );

  const layout = {
    barmode: 'relative',
    hoverlabel: { bgcolor: theme.graphColors.grey005 },
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
    const hoverColors = MOCK_DATA['netcost'].map((bar) =>  theme.graphColors.green050);
    hoverColors[hoveredIndex] = theme.graphColors.green090;
    setBarColors(hoverColors);
    setHoverText(`${MOCK_DATA.actions[hoveredIndex]}: ${evt.points[0].label} kWh/year — ${evt.points[0].value} SEK/year`);
    return null;
  };

  return (
  <Layout>
    <h1>MAC</h1>
    <Plot
      data={[{
        type: 'bar',
        x: xPlacement,
        y: MOCK_DATA['netcost'],
        text: MOCK_DATA['actions'],
        width: MOCK_DATA['energySaving'], 
        marker: {
          color: barColors,
          opacity: 0.9,
          line: {
            color: 'rgb(255,255,255)',
            width: 2
          }
        },
        textposition: 'none',
        hovertemplate:
            "<b>%{text}</b><br><br>" +
            "%{yaxis.title.text}: %{y:.0f} SEK/hWh<br>" +
            "%{xaxis.title.text}: %{x:.0f} kWh/år<br>" +
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
  </Layout>
  )
}

export default MacPage