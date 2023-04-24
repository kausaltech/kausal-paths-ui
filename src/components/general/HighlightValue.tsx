import styled from 'styled-components';

const TotalValue = styled.div`
  //text-align: right;
  line-height: 1.2;
  font-weight: 700;
  font-size: ${(props) => (props.size === 'sm' ? '1.25' : '1.5')}rem;
  color: ${(props) => (props.muted ? props.theme.graphColors.grey050 : props.theme.graphColors.grey090)};
`;

const TotalUnit = styled.span`
  margin-left: 0.25rem;
  font-size: ${(props) => (props.size === 'sm' ? '0.6' : '0.75')}rem;
`;

const YearRange = styled.div`
  font-size: ${(props) => (props.size === 'sm' ? '0.6' : '0.75')}rem;
  color: ${(props) => props.theme.graphColors.grey050};
`;

const HighlightValue = (props) => {
  const { displayValue, header, unit, className, size, muted } = props;

  return (
    <TotalValue className={className} size={size} muted={muted}>
      <YearRange dangerouslySetInnerHTML={{ __html: header }} size={size} />
      { displayValue }
      <TotalUnit dangerouslySetInnerHTML={{ __html: unit }} size={size} />
    </TotalValue>
  );
};

export default HighlightValue;
