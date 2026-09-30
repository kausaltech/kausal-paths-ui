import { darken, readableColor } from 'polished';

import styled from '@common/themes/styled';
import { transientOptions } from '@common/themes/styles/styled';

type BadgeColor = 'neutralLight' | 'neutralDark' | 'brandLight' | 'brandDark';

// Laid out like Bootstrap's `.badge`
const StyledBadge = styled('span', transientOptions)<{ $color: BadgeColor; $isLink: boolean }>`
  display: inline-block;
  font-size: 0.75em;
  line-height: 1;
  vertical-align: baseline;
  background-color: ${(props) => props.theme[props.$color]};
  color: ${(props) =>
    readableColor(
      props.theme[props.$color],
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
    background-color: ${(props) => props.$isLink && darken(0.05, props.theme[props.$color])};
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

type BadgeProps = {
  children?: React.ReactNode;
  size?: string;
  color: 'neutralLight' | 'neutralDark' | 'brandLight' | 'brandDark';
  isLink?: boolean;
};

const Badge = (props: BadgeProps) => {
  const { children, size, color, isLink } = props;

  return (
    <StyledBadge className={size} $color={color} $isLink={isLink ?? false}>
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

export default Badge;
