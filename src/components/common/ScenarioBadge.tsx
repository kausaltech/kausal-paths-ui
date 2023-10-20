import React from 'react';
import PropTypes from 'prop-types';
import styled, { useTheme } from 'styled-components';

const StyledBadge = styled.div<{ $color: string; $isLink?: boolean }>`
  display: inline-block;
  max-width: 100%;
  padding: 0.25rem 0.5rem;
  margin-bottom: 0.5rem;
  background-color: white !important;
  // border-left: 24px solid ${(props) => props.$color} !important;
  color: ${(props) => props.theme.themeColors.black};
  border-radius: ${(props) => props.theme.badgeBorderRadius};
  font-weight: ${(props) => props.theme.badgeFontWeight};
  word-break: break-all;
  word-break: break-word;
  hyphens: manual;
  white-space: normal;
  text-align: left;

  &:hover {
    background-color: ${(props) =>
      props.$isLink && darken(0.05, props.theme[props.$color])} !important;
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

const getBadgeColor = (theme, type, color) => {
  switch (type) {
    case 'forecast':
      return theme.graphColors.grey060;
    case 'activeScenario':
      return theme.graphColors.grey030;
    case 'scenario':
      return theme.graphColors.grey020;
    default:
      return theme[color];
  }
};

const ScenarioBadge = (props) => {
  const { children, size, color, isLink, type } = props;
  const theme = useTheme();

  return (
    <StyledBadge
      className={size}
      $color={getBadgeColor(theme, type, color)}
      $isLink={isLink}
    >
      {children}
    </StyledBadge>
  );
};

ScenarioBadge.defaultProps = {
  children: null,
  size: 'sm',
  color: 'brandDark',
  isLink: false,
};

ScenarioBadge.propTypes = {
  children: PropTypes.node,
  size: PropTypes.string,
  color: PropTypes.string,
  type: PropTypes.string,
  isLink: PropTypes.bool,
};

export default ScenarioBadge;
