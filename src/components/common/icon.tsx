import React, { type HTMLProps } from 'react';

import { useTheme } from '@emotion/react';
import SVG from 'react-inlinesvg';

import { getLogger } from '@common/logging';
import { getThemeStaticURL } from '@common/themes/theme';

const camelToKebabCase = (s: string) =>
  s.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();

type IconProps = {
  name?: string;
  color?: string;
  width?: string;
  height?: string;
  className?: string;
  alt?: string;
} & Omit<HTMLProps<SVGElement>, 'ref'>;

export function useSVGIconPath(name: string) {
  const theme = useTheme();
  const kebabName = camelToKebabCase(name);

  if (!(kebabName in theme.icons)) {
    throw new Error(`Unsupported icon: ${name}`);
  }

  const iconPath = getThemeStaticURL(theme.icons[kebabName]);

  return iconPath;
}

const Icon = (props: IconProps) => {
  const {
    name = 'circleOutline',
    color = 'inherit',
    width = '1em',
    height = '1em',
    className = '',
    alt,
  } = props;

  const theme = useTheme();
  const iconPath = useSVGIconPath(name);

  return (
    <SVG
      src={iconPath}
      className={`icon ${className}`}
      onError={(error) => {
        const logger = getLogger('icon');
        logger.error(error, `Error rendering icon ${name}`);
      }}
      key={`${theme.name}-${name}`}
      style={{ width, height, color }}
      aria-hidden={alt ? 'false' : 'true'}
      focusable={alt ? 'true' : 'false'}
      title={alt}
    />
  );
};

export default Icon;
