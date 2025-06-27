import React, { type HTMLProps } from 'react';

import SVG from 'react-inlinesvg';
import { useTheme } from 'styled-components';

import { getLogger } from '@/common/log';
import { getThemeStaticURL } from '@/common/theme';

const camelToKebabCase = (s: string) =>
  s.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();

const logger = getLogger('icon');

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
    ...rest
  } = props;

  const theme = useTheme();
  const iconPath = useSVGIconPath(name);

  return (
    <SVG
      src={iconPath}
      className={`icon ${className}`}
      onError={(error) => logger.error(error, `Error rendering icon ${name}`)}
      key={`${theme.name}-${name}`}
      style={{ width, height, color }}
      aria-hidden={alt ? 'false' : 'true'}
      focusable={alt ? 'true' : 'false'}
      title={alt}
    />
  );
};

export const CombinedIconSymbols = () => {
  const theme = useTheme();
  /* Find the correct icon file from static folder for now */
  /* TODO: Get themed icon url from API */
  const iconFileName = camelToKebabCase(theme.combinedIconsFilename);
  const icon = `${theme.iconsUrl}/${iconFileName}.svg`;

  return <SVG style={{ display: 'none' }} src={icon} />;
};

export default Icon;
