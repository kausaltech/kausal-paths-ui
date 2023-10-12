import React, { useState } from 'react';
import styled from 'styled-components';

const TotalValue = styled.div<{ muted?: boolean; size?: string }>`
  padding: 0;
  line-height: 1.2;
  font-weight: 700;
  font-size: ${(props) => (props.size === 'sm' ? '1.25' : '1.5')}rem;
  color: ${(props) =>
    props.muted
      ? props.theme.graphColors.grey050
      : props.theme.graphColors.grey090};

  &:hover {
    color: ${(props) => props.theme.graphColors.grey090};
    cursor: pointer;

    > div {
      color: ${(props) => props.theme.graphColors.grey090};
    }
    svg {
      fill: ${(props) => props.theme.graphColors.grey090};
    }
  }
`;

const TotalUnit = styled.span<{ size?: string }>`
  margin-left: 0.25rem;
  font-size: ${(props) => (props.size === 'sm' ? '0.6' : '0.75')}rem;
`;

const YearRange = styled.div<{ size?: string }>`
  display: flex;
  font-size: ${(props) => (props.size === 'sm' ? '0.6' : '0.75')}rem;
  color: ${(props) => props.theme.graphColors.grey070};
`;

type HighlightValueProps = {
  displayValue: string;
  header: string;
  unit: string;
  className?: string;
  size?: string;
  muted?: boolean;
};

const HighlightValue = (props: HighlightValueProps) => {
  const { displayValue, header, unit, className, size, muted } = props;

  const id = `tt-${displayValue}`.replace(/\W/g, '_');
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const toggle = () => setTooltipOpen(!tooltipOpen);

  return (
    <TotalValue className={className} size={size} muted={muted} id={id}>
      <YearRange size={size}>
        <span dangerouslySetInnerHTML={{ __html: header }} />
      </YearRange>
      {displayValue}
      <TotalUnit dangerouslySetInnerHTML={{ __html: unit }} size={size} />
    </TotalValue>
  );
};

export default HighlightValue;
