import React, { useState } from 'react';
import * as Icon from 'react-bootstrap-icons';
import styled from 'styled-components';
import { summarizeYearlyValuesBetween, getImpactMetricValue } from 'common/preprocess';
import { Card, CardBody, CardFooter, Collapse } from 'reactstrap';
import NodePlot from 'components/general/NodePlot';
import ImpactDisplay from './ImpactDisplay';
import { NodeLink } from 'common/links';
import { useSite } from 'context/site';
import { CausalGridNode } from './CausalGrid';

const ActionLinks = styled.div`
  margin-bottom: 1rem;
`;

const NodeCard = styled.div`
  margin-bottom: 1rem;
  box-shadow: 3px 3px 12px rgba(33,33,33,0.15);
  max-width: 400px;
  padding: 1rem;
  background-color: ${(props) => props.theme.graphColors.grey005};

  &.action .card {
    background-color: ${(props) => props.theme.graphColors.grey000};
    border: ${(props) => props.theme.graphColors.grey030} 2px solid;
  }

  &.emissions .card {

  }
`;

const CardHeader = styled.div`
  display: flex;
  margin-bottom: 1rem;
  border-bottom: 1px solid ${(props) => props.theme.graphColors.grey020};

  svg {
    margin-right: 0.5rem;
  }

  h4 {
    word-wrap: break-word;
    text-wrap: wrap;
  }
`;

const ContentWrapper = styled.div`
  padding: 0 1rem;
  margin: .5rem 0;
  background-color: ${(props) => props.theme.graphColors.grey005};
  border-radius: 0;

  .x2sstick text, .xtick text {
    text-anchor: end !important;
  }
`;

const ImpactFigures = styled.div`
  display: flex;
  width: 100%;
  justify-content: flex-end;

  .figure-left, .figure-right {
    flex: 1 1 50%;
  }

  .figure-left {
    text-align: left;
  }
`;

const TextContent = styled.div`
  padding: .5rem .5rem 0;
`;

type CausalCardProps = {
  node: CausalGridNode,
  startYear: number,
  endYear: number,
  noEffect: boolean,
  compact: boolean,
}


const CausalCard = (props: CausalCardProps) => {
  const { node, startYear, endYear, noEffect, compact } = props;
  const { targetYearGoal } = node;
  const { maxYear } = useSite();

  const [isOpen, setIsOpen] = useState(false);
  const impactAtTargetYear = getImpactMetricValue(node, endYear);
  // TODO: use isACtivity when available, for now cumulate impact on emissions
  const cumulativeImpact = node.quantity === 'emissions'
    ? summarizeYearlyValuesBetween(node.impactMetric, startYear, endYear) : undefined;

  return (
    <ActionLinks>
      <NodeCard className={`${node.isAction && 'action'} ${node.quantity}`}>
          <CardHeader>
            { node.isAction && <Icon.Journals size={24} className="mb-3" /> }
            { node.quantity === 'emission_factor' && <Icon.ClipboardX size={24} className="mb-3" /> }
            { node.quantity === 'emissions' && <Icon.CloudFog size={24} className="mb-3" /> }
            { node.quantity === 'energy' && <Icon.BatteryCharging size={24} className="mb-3" /> }
            { node.quantity === 'mileage' && <Icon.Signpost size={24} className="mb-3" /> }
            <NodeLink node={node}><a><h4>{node.name}</h4></a></NodeLink>
          </CardHeader>
          <button className="btn btn-link" onClick={() => setIsOpen(!isOpen)}>
            more
          </button>
          <Collapse isOpen={isOpen}>
          <ImpactFigures>
            <ImpactDisplay
              effectCumulative={cumulativeImpact}
              effectYearly={impactAtTargetYear}
              yearRange={[startYear, endYear]}
              unitCumulative={node.impactMetric!.yearlyCumulativeUnit?.htmlShort}
              unitYearly={node.impactMetric!.unit?.htmlShort}
              muted={noEffect}
              size="sm"
            />
          </ImpactFigures>
          {!compact && (
            <ContentWrapper>
              <NodePlot
                metric={node.metric}
                impactMetric={node.impactMetric}
                startYear={startYear}
                endYear={endYear}
                color={node.color}
                isAction={node.isAction}
                targetYearGoal={targetYearGoal}
                targetYear={maxYear}
                quantity={node.quantity}
                compact
              />
            </ContentWrapper> )}
          { node.shortDescription && <TextContent dangerouslySetInnerHTML={{ __html: node.shortDescription }} /> }
          </Collapse>
      </NodeCard>
    </ActionLinks>
  );
};

export default CausalCard;
