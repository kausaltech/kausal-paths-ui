import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { Badge as BSSBadge } from 'reactstrap';
import { readableColor } from 'polished';

const StyledBadge = styled(BSSBadge)`
  background-color: ${(props) => props.theme[props.color]} !important;
  color: ${(props) =>
    readableColor(
      props.theme[props.color],
      props.theme.themeColors.black,
      props.theme.themeColors.white
    )};
  border-radius: ${(props) => props.theme.badgeBorderRadius};
  padding: ${(props) => props.theme.badgePaddingY}
    ${(props) => props.theme.badgePaddingX};
  font-weight: ${(props) => props.theme.badgeFontWeight};
  max-width: 100%;
  word-break: break-all;
  word-break: break-word;
  hyphens: manual;
  white-space: normal;
  text-align: left;

  &:hover {
    background-color: ${(props) =>
      props.isLink && darken(0.05, props.theme[props.color])} !important;
  }

  &.lg {
    font-size: ${(props) => props.theme.fontSizeMd};
  }
  &.md {
    font-size: ${(props) => props.theme.fontSizeBase};
  }
  &.sm {
    font-size: ${(props) => props.theme.fontSizeSm};
  }
`;

const Badge = (props) => {
  const { children, size, color, isLink } = props;

  return (
    <StyledBadge className={size} color={color} isLink={isLink}>
      {children}
    </StyledBadge>
  );
};

Badge.defaultProps = {
  children: null,
  size: 'sm',
  color: 'brandDark',
  isLink: false,
};

Badge.propTypes = {
  children: PropTypes.node,
  size: PropTypes.string,
  color: PropTypes.string,
  isLink: PropTypes.bool,
};

export default Badge;
