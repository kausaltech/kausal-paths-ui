import Link from 'next/link';
import * as Icon from 'react-bootstrap-icons';
import styled from 'styled-components';
import { getMetricValue, beautifyValue } from 'common/preprocess';
import DashCard from 'components/general/DashCard';
import NodePlot from 'components/general/NodePlot';

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

const CausalCard = (props) => {
  const { node, index, startYear, endYear } = props;
  return (
    <ActionLinks>
      <NodeCard className={`${node.isAction && 'action'} ${node.quantity}`}>
        <DashCard>
          { node.isAction && <Icon.Journals size={24} className="mb-3" /> }
          { node.quantity === 'emission_factor' && <Icon.ClipboardX size={24} className="mb-3" /> }
          { node.quantity === 'emissions' && <Icon.CloudFog size={24} className="mb-3" /> }
          <Link href={`/node/${node.id}`}><a><h4>{node.name}</h4></a></Link>
          <div dangerouslySetInnerHTML={{ __html: node.description }} />
          <p>
            <strong>{beautifyValue(getMetricValue(node, 2030) || 0)}</strong>
            {' '}
            <span dangerouslySetInnerHTML={{ __html: node.unit?.htmlShort }} />
          </p>

          <NodePlot
            metric={node.metric}
            impactMetric={node.impactMetric}
            year="2021"
            startYear={startYear}
            endYear={endYear}
            color={node.color}
            isAction={node.isAction}
          />
        </DashCard>
      </NodeCard>
    </ActionLinks>
  );
};

export default CausalCard;
