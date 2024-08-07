import React from 'react';

import { darken, readableColor } from 'polished';
import { Badge as BSSBadge } from 'reactstrap';
import styled from 'styled-components';

interface BadgeProps {
  children?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  isLink?: boolean;
}
const StyledBadge = styled(BSSBadge)`
  background-color: ${(props) => props.theme[props.color!]} !important;
  color: ${(props) =>
    readableColor(
      props.theme[props.color!],
      props.theme.themeColors.black,
      props.theme.themeColors.white
    )};
  border-radius: ${(props) => props.theme.badgeBorderRadius};
  padding: ${(props) => props.theme.badgePaddingY} ${(props) => props.theme.badgePaddingX};
  font-weight: ${(props) => props.theme.badgeFontWeight};
  max-width: 100%;
  word-break: break-all;
  word-break: break-word;
  hyphens: manual;
  white-space: normal;
  text-align: left;

  &:hover {
    background-color: ${(props) =>
      props.isLink && darken(0.05, props.theme[props.color!])} !important;
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

const Badge: React.FC = (props: BadgeProps) => {
  const { children, size = 'sm', color = 'brandDark', isLink = false } = props;
  return (
    <StyledBadge className={size} color={color} isLink={isLink}>
      {children}
    </StyledBadge>
  );
};

export default Badge;
