import { darken, readableColor } from 'polished';
import { Badge as BSSBadge } from 'reactstrap';

import styled from '@common/themes/styled';

type BadgeColor = 'neutralLight' | 'neutralDark' | 'brandLight' | 'brandDark';

const StyledBadge = styled(BSSBadge)<{ $color: BadgeColor; $isLink: boolean }>`
  background-color: ${(props) => props.theme[props.$color]} !important;
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
