import React from 'react';

import styled from '@emotion/styled';
import parse, { domToReact } from 'html-react-parser';
import Zoom from 'react-medium-image-zoom';
import 'react-medium-image-zoom/dist/styles.css';

import { useInstance } from '@/common/instance';
import Icon from '@/components/common/icon';

type RichTextImageProps = {
  attribs: {
    src: string;
    [key: string]: any;
  };
};

const StyledRichText = styled.div`
  .responsive-object {
    padding-bottom: 0 !important;
    width: 100%;
    max-width: ${(props) => props.theme.breakpointLg};
  }
  .responsive-object iframe {
    aspect-ratio: 16 / 9;
    width: 100%;
    height: 100%;
  }
`;

function ICompress() {
  return React.createElement(
    'svg',
    {
      'aria-hidden': 'true',
      'data-rmiz-btn-unzoom-icon': true,
      fill: 'currentColor',
      focusable: 'false',
      viewBox: '0 0 16 16',
      xmlns: 'http://www.w3.org/2000/svg',
    },

    React.createElement('path', {
      d: 'M 14.144531 1.148438 L 9 6.292969 L 9 3 L 8 3 L 8 8 L 13 8 L 13 7 L 9.707031 7 L 14.855469 1.851563 Z M 8 8 L 3 8 L 3 9 L 6.292969 9 L 1.148438 14.144531 L 1.851563 14.855469 L 7 9.707031 L 7 13 L 8 13 Z',
    })
  );
}
const CompressIcon = styled(ICompress)`
  vertical-align: baseline;
`;

function RichTextImage(props: RichTextImageProps) {
  const instance = useInstance();
  const { attribs } = props;
  const { src, alt, height, width, ...rest } = attribs;
  // FIXME: serveFileBaseUrl
  const { serveFileBaseUrl } = instance;

  rest.className = rest.class;
  delete rest.class;

  const imgElement = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`${serveFileBaseUrl}${src}`}
      alt={alt}
      height={height}
      width={width}
      className={rest.className}
    />
  );

  const [origWidth, origHeight] = [
    Number(rest['data-original-width']),
    Number(rest['data-original-height']),
  ];
  if (!isNaN(origWidth) && !isNaN(origHeight) && rest['data-original-src']) {
    if (origWidth > Number(height) * 1.2 || origHeight > Number(width) * 1.2) {
      // Only stretch zoomed image full width if original has width > 1000px
      const zoomImgAttribs =
        origWidth > 1000
          ? {
              src: `${serveFileBaseUrl}${rest['data-original-src']}`,
              alt,
              height: origHeight,
              width: origWidth,
            }
          : {};
      return (
        <Zoom zoomImg={zoomImgAttribs} IconUnzoom={CompressIcon}>
          {imgElement}
        </Zoom>
      );
    }
  }
  return imgElement;
}

type RichTextProps = {
  html: string;
  className?: string;
};

export default function RichText(props: RichTextProps) {
  const { html, className, ...rest } = props;
  // const { t } = useTranslation(); // FIXME: Unsure if we need alt/title for icons

  if (typeof html !== 'string') return <div />;

  // FIXME: Hacky hack to figure out if the rich text links are internal
  const cutHttp = (url) => url.replace(/^https?:\/\//, '');
  // FIXME!!
  const currentDomain = 'foooo.com';

  const options = {
    replace: (domNode) => {
      const { type, name, attribs, children } = domNode;
      if (type !== 'tag') return null;
      // Rewrite <a> tags to point to the FQDN
      if (name === 'a') {
        // File link
        if (attribs['data-link-type']) {
          // FIXME: Add icon based on attribs['data-file-extension']
          return (
            <a href={`${plan.serveFileBaseUrl}${attribs.href}`}>{domToReact(children, options)}</a>
          );
        }
        // Internal link
        if (cutHttp(attribs.href.split('.')[0]) === currentDomain || attribs.href.startsWith('#')) {
          return <a href={attribs.href}>{domToReact(children, options)}</a>;
        }
        // Assumed external link, open in new tab
        return (
          <a target="_blank" href={attribs.href} rel="noreferrer">
            <Icon name="arrow-up-right-from-square" />
            {domToReact(children, options)}
          </a>
        );
      } else if (name === 'img') {
        if (attribs.src && attribs.src[0] === '/') {
          return <RichTextImage attribs={attribs} />;
        }
      }
      return null;
    },
  };

  const parsedContent = parse(html, options);

  return (
    <div {...rest} className={`text-content ${className || ''}`}>
      <StyledRichText>{parsedContent}</StyledRichText>
    </div>
  );
}
