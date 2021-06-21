import styled from 'styled-components';

const TotalValue = styled.div`
  text-align: right;
  line-height: 1.2;
  font-weight: 700;
  font-size: 1.5rem;
`;

const TotalUnit = styled.div`
  font-size: 0.75rem;
`;

const YearRange = styled.div`
  font-size: 0.75rem;
  color: ${(props) => props.theme.graphColors.grey050};
`;

const HighlightValue = (props) => {
  const { displayValue, header, unit, className } = props;

  return (
    <TotalValue className={className}>
      <YearRange dangerouslySetInnerHTML={{ __html: header }} />
      { displayValue }
      <TotalUnit dangerouslySetInnerHTML={{ __html: unit }} />
    </TotalValue>
  );
};

export default HighlightValue;
