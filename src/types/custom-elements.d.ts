import type { DetailedHTMLProps, HTMLAttributes } from 'react';

type CustomElementProps = DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
  variant?: string;
  name?: string;
  tabindex?: string;
  'icon-position'?: string;
  size?: string;
  'text-align'?: string;
  'badge-type'?: string;
  'badge-position'?: string;
};

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'slot-fb': CustomElementProps;
      'stzh-footer': CustomElementProps;
      'stzh-link': CustomElementProps;
    }
  }
}
