import React, { useState } from 'react';
import Icon from 'components/common/icon';
import * as BSIcon from 'react-bootstrap-icons';
import styled from 'styled-components';
import {
  summarizeYearlyValuesBetween,
  getImpactMetricValue,
} from 'common/preprocess';
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
  box-shadow: 3px 3px 12px rgba(33, 33, 33, 0.15);
  max-width: 400px;
  padding: 1rem;
  background-color: ${(props) => props.theme.graphColors.grey005};
  white-space: normal;

  &.type-action .card {
    background-color: ${(props) => props.theme.graphColors.grey000};
    border: ${(props) => props.theme.graphColors.grey030} 2px solid;
  }
`;

const CardHeader = styled.div`
  display: flex;
  position: relative;
  margin-bottom: ${(props) => (props.isOpen ? '1rem' : '0')};
  border-bottom: ${(props) =>
    props.isOpen ? `1px solid ${props.theme.graphColors.grey030}` : 'none'};

  svg {
    display: block;
    flex: 0 0 24px;
    margin-right: 1rem;
    width: 24px;
    height: 24px;
  }

  h4 {
    word-wrap: break-word;
    text-wrap: wrap;
  }

  button {
    display: flex;
    flex: 1 1 100%;
    top: 0;
    left: 0;
    padding: 0;
    margin: 0;
    text-align: left;
    background-color: transparent;
    text-decoration: none;
  }
`;

const ContentWrapper = styled.div`
  background-color: ${(props) => props.theme.graphColors.grey005};
  border-radius: 0;

  .x2sstick text,
  .xtick text {
    text-anchor: end !important;
  }
`;

const ImpactFigures = styled.div`
  display: flex;
  width: 100%;
  justify-content: flex-end;

  .figure-left,
  .figure-right {
    flex: 1 1 50%;
  }

  .figure-left {
    text-align: left;
  }
`;

const TextContent = styled.div`
  padding: 0.5rem 0.5rem 0;
`;

const MoreLink = styled.div`
  text-align: right;
`;

type CausalCardProps = {
  node: CausalGridNode;
  startYear: number;
  endYear: number;
  noEffect: boolean;
  compact: boolean;
};

const NodeIcon = (props) => {
  const { node } = props;
  const nodeType = node.isAction ? 'action' : node.quantity;

  switch (nodeType) {
    case 'emission_factor':
      // ClipboardX
      return <BSIcon.ClipboardX size={24} className="mb-3" />;
    case 'emissions':
    case 'building_emissions':
    case 'building_heat_emissions':
      //
      return <BSIcon.CloudHaze size={24} className="mb-3" />;
    case 'energy':
    case 'energy_factor':
    case 'energy_per_area':
      // LightningChargeFill
      return <BSIcon.LightningChargeFill size={24} className="mb-3" />;
    case 'mileage':
      // Signpost
      return <BSIcon.Signpost size={24} className="mb-3" />;
    case 'per_capita':
      // People
      return <BSIcon.People size={24} className="mb-3" />;
    case 'floor_area':
      // Building
      return <BSIcon.Buildings size={24} className="mb-3" />;
    case 'action':
      // Journals
      return <BSIcon.Journals size={24} className="mb-3" />;
    default:
      // Diamond
      return <BSIcon.Diamond size={24} className="mb-3" />;
  }
};

const CausalCard = (props: CausalCardProps) => {
  const { node, startYear, endYear, noEffect, compact } = props;
  const { targetYearGoal } = node;
  const { maxYear } = useSite();

  //console.log('node', node);
  const [isOpen, setIsOpen] = useState(false);
  const impactAtTargetYear = getImpactMetricValue(node, endYear);
  // TODO: use isACtivity when available, for now cumulate impact on emissions
  const cumulativeImpact =
    node.quantity === 'emissions'
      ? summarizeYearlyValuesBetween(node.impactMetric, startYear, endYear)
      : undefined;

  return (
    <ActionLinks>
      <NodeCard
        className={`${node.__typename === 'ActionNode' && 'action'} type-${
          node.quantity
        }`}
      >
        <CardHeader isOpen={isOpen}>
          <button className="btn btn-link" onClick={() => setIsOpen(!isOpen)}>
            <NodeIcon node={node} />
            <h4>{node.name}</h4>
            {isOpen ? (
              <Icon
                name="angleDown"
                width="24px"
                height="24px"
                className="ml-auto"
              />
            ) : (
              <Icon
                name="angleRight"
                width="24px"
                height="24px"
                className="ml-auto"
              />
            )}
          </button>
        </CardHeader>
        <Collapse isOpen={isOpen}>
          <ImpactFigures>
            <ImpactDisplay
              effectCumulative={cumulativeImpact}
              effectYearly={impactAtTargetYear}
              yearRange={[startYear, endYear]}
              unitCumulative={
                node.impactMetric!.yearlyCumulativeUnit?.htmlShort
              }
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
            </ContentWrapper>
          )}
          {node.shortDescription && (
            <TextContent
              dangerouslySetInnerHTML={{ __html: node.shortDescription }}
            />
          )}
          <MoreLink>
            <NodeLink node={node}>
              <a>
                See full details <BSIcon.ArrowRight />
              </a>
            </NodeLink>
          </MoreLink>
        </Collapse>
      </NodeCard>
    </ActionLinks>
  );
};

export default CausalCard;
