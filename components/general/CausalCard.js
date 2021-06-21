import Link from 'next/link';
import * as Icon from 'react-bootstrap-icons';
import styled from 'styled-components';
import { getMetricValue, beautifyValue } from 'common/preprocess';
import { settingsVar } from 'common/cache';
import DashCard from 'components/general/DashCard';
import NodePlot from 'components/general/NodePlot';
import HighlightValue from 'components/general/HighlightValue';

const ActionLinks = styled.div`
  margin-bottom: 1rem;
`;

const NodeCard = styled.div`
  margin-bottom: 1rem;

  &.action .card {
    border:${(props) => props.theme.graphColors.grey030} 2px solid;
  }

  &.emissions .card {

  }
`;

const ContentWrapper = styled.div`
  padding: 1rem;
  margin: .5rem 0;
  background-color: ${(props) => props.theme.graphColors.grey005};
  border-radius: 10px;

  .x2sstick text, .xtick text {
    text-anchor: end !important;
  }
`;

const CausalCard = (props) => {
  const { node, index, startYear, endYear } = props;

  const { targetYearGoal } = node;
  let targetYear;

  return (
    <ActionLinks>
      <NodeCard className={`${node.isAction && 'action'} ${node.quantity}`}>
        <DashCard>
          { node.isAction && <Icon.Journals size={24} className="mb-3" /> }
          { node.quantity === 'emission_factor' && <Icon.ClipboardX size={24} className="mb-3" /> }
          { node.quantity === 'emissions' && <Icon.CloudFog size={24} className="mb-3" /> }
          <Link href={`/node/${node.id}`}><a><h4>{node.name}</h4></a></Link>
          <div dangerouslySetInnerHTML={{ __html: node.description }} />
          <HighlightValue
            displayValue={beautifyValue(getMetricValue(node, settingsVar().maxYear) || 0)}
            header={endYear}
            unit={node.unit?.htmlShort}
          />
          <ContentWrapper>
            <NodePlot
              metric={node.metric}
              impactMetric={node.impactMetric}
              startYear={startYear}
              endYear={endYear}
              color={node.color}
              isAction={node.isAction}
              targetYearGoal={targetYearGoal}
              targetYear={targetYear}
            />
          </ContentWrapper>
        </DashCard>
      </NodeCard>
    </ActionLinks>
  );
};

export default CausalCard;
