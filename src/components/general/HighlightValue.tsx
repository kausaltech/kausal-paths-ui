import React, { useState } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';

const TotalValue = styled.div`
  padding: 0.5rem;
  line-height: 1.2;
  font-weight: 700;
  font-size: ${(props) => (props.size === 'sm' ? '1.25' : '1.5')}rem;
  color: ${(props) =>
    props.muted
      ? props.theme.graphColors.grey050
      : props.theme.graphColors.grey090};

  &:hover {
    //background-color: rgba(0, 0, 0, 0.05);
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

const TotalUnit = styled.span`
  margin-left: 0.25rem;
  font-size: ${(props) => (props.size === 'sm' ? '0.6' : '0.75')}rem;
`;

const YearRange = styled.div`
  display: flex;
  font-size: ${(props) => (props.size === 'sm' ? '0.6' : '0.75')}rem;
  color: ${(props) => props.theme.graphColors.grey050};
`;

const HighlightValue = (props) => {
  const { displayValue, header, unit, className, size, muted } = props;

  const { t } = useTranslation();
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
