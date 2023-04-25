import React, { useState } from 'react';
import styled from 'styled-components';
import { InfoCircleFill as InfoIcon } from 'react-bootstrap-icons';
import { useTranslation } from 'react-i18next';
import { Tooltip } from 'reactstrap';

const TotalValue = styled.div`
  padding: .5rem;
  line-height: 1.2;
  font-weight: 700;
  font-size: ${(props) => (props.size === 'sm' ? '1.25' : '1.5')}rem;
  color: ${(props) => (props.muted ? props.theme.graphColors.grey050 : props.theme.graphColors.grey090)};

  &:hover {
    background-color: rgba(0, 0, 0, 0.05);
    cursor: pointer;
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
  const id = `tt-${displayValue}`.replace(/\W/g,'_');
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const toggle = () => setTooltipOpen(!tooltipOpen);

  return (
    <TotalValue
      className={className}
      size={size}
      muted={muted}
      id={id}
    >
      <YearRange size={size}>
        <span dangerouslySetInnerHTML={{ __html: header }} />
        <InfoIcon className="ms-1" />
      </YearRange>
      { displayValue }
      <TotalUnit dangerouslySetInnerHTML={{ __html: unit }} size={size} />
      <Tooltip
        target={id}
        placement="top"
        isOpen={tooltipOpen}
        autohide={false}
        toggle={toggle}
      >
        Total yearly emissions on year X
      </Tooltip>
    </TotalValue>
  );
};

export default HighlightValue;
