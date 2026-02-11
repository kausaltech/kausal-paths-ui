import React, { useState } from 'react';

import styled from '@emotion/styled';
import {
  Buildings,
  ClipboardX,
  CloudHaze,
  Diamond,
  Journals,
  LightningChargeFill,
  People,
  Signpost,
} from 'react-bootstrap-icons';
import { Collapse } from 'reactstrap';

import { useTranslation } from '@/common/i18n';
import { NodeLink } from '@/common/links';
import { getImpactMetricValue, summarizeYearlyValuesBetween } from '@/common/preprocess';
import Icon from '@/components/common/icon';
import NodePlot from '@/components/general/NodePlot';
import { useSite } from '@/context/site';

import type { CausalGridNode } from './CausalGrid';
import ImpactDisplay from './ImpactDisplay';

const ActionLinks = styled.div`
  margin-bottom: 1rem;
`;

const NodeCard = styled.div`
  margin-bottom: 1rem;
  box-shadow: 3px 3px 12px rgba(33, 33, 33, 0.15);
  width: 100%;
  padding: 0.5rem;
  background-color: ${({ theme }) => theme.cardBackground.secondary};
  white-space: normal;

  &.type-action .card {
    background-color: ${(props) => props.theme.graphColors.grey000};
    border: ${(props) => props.theme.graphColors.grey030} 2px solid;
  }
`;

const CardHeader = styled.div`
  button {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    min-height: 4.5rem;
    padding: 0;
    margin: 0;
    text-align: left;
    background-color: transparent;
    text-decoration: none;
    transition: all 1s;

    &:hover {
      color: ${(props) => props.theme.graphColors.blue070};
      .caret {
        fill: ${(props) => props.theme.graphColors.blue070};
      }
    }
  }

  .node-type {
    display: none;
    flex: 0 0 24px;
    width: 24px;
    height: 24px;
    margin-right: 1rem;
    fill: ${(props) => props.theme.graphColors.grey050};

    @media (min-width: ${(props) => props.theme.breakpoints.values.md}px) {
      display: block;
    }
  }

  .caret {
    display: block;
    flex: 0 0 24px;
    margin-left: 1rem;
    width: 24px;
    height: 24px;
    fill: ${(props) => props.theme.graphColors.grey050};
  }

  h4 {
    flex: 1 1 auto;
    margin: 0;
    font-size: ${(props) => props.theme.fontSizeBase};
    hyphens: none;

    @media (min-width: ${(props) => props.theme.breakpoints.values.md}px) {
      font-size: ${(props) => props.theme.fontSizeMd};
    }
  }
`;

const CardContent = styled.div`
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: ${({ theme }) => `1px solid ${theme.graphColors.grey030}`};
`;

const PlotWrapper = styled.div`
  display: none;
  background-color: ${({ theme }) => theme.cardBackground.secondary};
  border-radius: 0;

  .x2sstick text,
  .xtick text {
    text-anchor: end !important;
  }

  @media (min-width: ${(props) => props.theme.breakpoints.values.md}px) {
    display: block;
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
  margin-top: 1rem;
  text-align: right;
`;

type CausalCardProps = {
  node: CausalGridNode;
  startYear: number;
  endYear: number;
  noEffect: boolean;
  compact: boolean;
};

const NodeIcon = (props: { node: CausalGridNode }) => {
  const { node } = props;
  const isActionNode = node.__typename.toLowerCase().includes('action');
  const nodeType = isActionNode ? 'action' : node.quantity;

  switch (nodeType) {
    case 'emission_factor':
      // ClipboardX
      return <ClipboardX size={24} className="node-type" />;
    case 'emissions':
    case 'building_emissions':
    case 'building_heat_emissions':
      //
      return <CloudHaze size={24} className="node-type" />;
    case 'energy':
    case 'energy_factor':
    case 'energy_per_area':
      // LightningChargeFill
      return <LightningChargeFill size={24} className="node-type" />;
    case 'mileage':
      // Signpost
      return <Signpost size={24} className="node-type" />;
    case 'per_capita':
      // People
      return <People size={24} className="node-type" />;
    case 'floor_area':
      // Building
      return <Buildings size={24} className="node-type" />;
    case 'action':
      // Journals
      return <Journals size={24} className="node-type" />;
    default:
      // Diamond
      return <Diamond size={24} className="node-type" />;
  }
};

const CausalCard = (props: CausalCardProps) => {
  const { node, startYear, endYear, noEffect, compact } = props;
  const { goals } = node;

  // TODO: Maybe not use endyear here, find out goal year from plan maybe?
  const targetYearGoal = goals?.find((goal) => goal.year === endYear)?.value;
  const { maxYear } = useSite();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const impactAtTargetYear = node.impactMetric
    ? getImpactMetricValue({ impactMetric: node.impactMetric }, endYear)
    : 0;
  // TODO: use isACtivity when available, for now cumulate impact on emissions
  const cumulativeImpact =
    node.quantity === 'emissions' && node.impactMetric
      ? summarizeYearlyValuesBetween(node.impactMetric, startYear, endYear)
      : undefined;

  return (
    <ActionLinks>
      <NodeCard className={`${node.__typename === 'ActionNode' && 'action'} type-${node.quantity}`}>
        <CardHeader>
          <button
            className="btn btn-link"
            onClick={() => setIsOpen(!isOpen)}
            aria-controls={`card-content-${node.id}`}
          >
            <NodeIcon node={node} />
            <h4>{node.name}</h4>
            {isOpen ? (
              <Icon name="angleDown" width="24px" height="24px" className="caret ml-auto" />
            ) : (
              <Icon name="angleRight" width="24px" height="24px" className="caret ml-auto" />
            )}
          </button>
        </CardHeader>
        <Collapse isOpen={isOpen} id={`card-content-${node.id}`} aria-hidden={!isOpen}>
          <CardContent>
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
              <PlotWrapper>
                <NodePlot
                  metric={node.metric}
                  impactMetric={node.impactMetric}
                  startYear={startYear}
                  endYear={endYear}
                  color={node.color}
                  isAction={node.__typename === 'ActionNode'}
                  targetYearGoal={targetYearGoal}
                  targetYear={maxYear}
                  quantity={node.quantity}
                  compact
                />
              </PlotWrapper>
            )}
            {node.shortDescription && (
              <TextContent dangerouslySetInnerHTML={{ __html: node.shortDescription }} />
            )}
            <MoreLink>
              <NodeLink node={node} className="node-type-icon">
                <a>
                  {t('details')} <Icon name="arrow-right" />
                </a>
              </NodeLink>
            </MoreLink>
          </CardContent>
        </Collapse>
      </NodeCard>
    </ActionLinks>
  );
};

export default CausalCard;
