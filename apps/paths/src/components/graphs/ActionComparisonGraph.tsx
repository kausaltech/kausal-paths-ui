import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'next-i18next';
import styled, { useTheme } from 'styled-components';
import dynamic from 'next/dynamic';
import { Col, Row } from 'reactstrap';
import Icon from 'components/common/icon';

const Plot = dynamic(() => import('components/graphs/Plot'), { ssr: false });

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

const formatNumber = (value, language) => {
  return parseFloat(Number(value).toPrecision(3)).toLocaleString(language);
};

function ActionComparisonGraph(props) {
  const { data, impactUnit, impactName, actionIds, actionGroups } = props;
  const theme = useTheme();
  const { t, i18n } = useTranslation();

  const [hoverId, setHoverId] = useState(null);

  useEffect(() => {
    // Update the document title using the browser API
    setHoverId(null);
  }, [data]);

  // console.log("mac props", props);
  // TODO: Add sorting of data here

  if (data.actions?.length < 1) return <div />;

  const layout = useMemo(
    () => ({
      height: 300,
      barmode: 'relative',
      hoverlabel: {
        bgcolor: theme.themeColors.white,
        bordercolor: theme.graphColors.grey030,
        font: {
          family: theme.fontFamily,
          color: theme.graphColors.grey090,
        },
      },
      hovermode: 'x unified',
      hoverdistance: 10,
      yaxis: {
        title: `${impactName} (${impactUnit})`,
      },
      xaxis: {
        title: t('actions'),
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
    [theme, impactUnit, impactName]
  );

  const handleHover = useCallback(
    (evt) => {
      // console.log("HOVERED", evt);
      const hoveredIndex = evt.points[0].pointIndex;
      //const hoverColors = data.colors;
      //hoverColors[hoveredIndex] = "#333";
      //setBarColors(hoverColors);
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
            x: data['actions'],
            y: data['impact'],
            text: data['actions'],
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
            customdata: data['impact'],
            hovertemplate: `%{y:.3r} ${impactUnit}`,
          },
        ]}
        layout={layout}
        useResizeHandler
        style={{ width: '100%' }}
        config={{ displayModeBar: false }}
        onHover={(evt) => handleHover(evt)}
      />
    ),
    [data, theme, layout, handleHover]
  );

  return (
    <GraphContainer>
      {plot}
      {hoverId !== null && (
        <ActionDescription color={data.colors[hoverId]}>
          <a href={`/actions/${actionIds[hoverId]}/`}>
            <HoverGroupTag color={data.colors[hoverId]}>
              {
                actionGroups.find((group) => group.id === data.groups[hoverId])
                  ?.name
              }
            </HoverGroupTag>
            <h4>
              {data.actions[hoverId]} <Icon name="arrowRight" />
            </h4>
          </a>
          <Row>
            <Col md={3} className="d-flex align-items-end">
              <HoverValue>
                <HoverValueTitle>{impactName}</HoverValueTitle>
                <HoverValueValue>
                  {formatNumber(data.impact[hoverId], i18n.language)}
                </HoverValueValue>
                <HoverValueUnit
                  dangerouslySetInnerHTML={{ __html: impactUnit }}
                />
              </HoverValue>
            </Col>
            <Col md={3} className="d-flex align-items-end"></Col>
            <Col md={3} className="d-flex align-items-end"></Col>
          </Row>
        </ActionDescription>
      )}
    </GraphContainer>
  );
}

export default ActionComparisonGraph;
