/**
 * Shim for next/head.
 *
 * In a SPA there's no server-rendered <head> to hydrate.
 * This component extracts <title> children and applies them
 * via document.title. Meta tags are rendered into a portal
 * in <head> so they work for SEO prerendering if added later.
 */
import { Children, type ReactNode, isValidElement, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface HeadProps {
  children?: ReactNode;
}

export default function Head({ children }: HeadProps) {
  // Extract title from children
  let title: string | null = null;
  const otherChildren: ReactNode[] = [];

  Children.forEach(children, (child) => {
    if (isValidElement(child) && child.type === 'title') {
      // Extract text content from <title> children
      const titleContent = Children.toArray(child.props.children).join('');
      title = titleContent;
    } else {
      otherChildren.push(child);
    }
  });

  useEffect(() => {
    if (title) {
      document.title = title;
    }
  }, [title]);

  // Render meta tags into <head> via portal
  if (otherChildren.length > 0) {
    return createPortal(<>{otherChildren}</>, document.head);
  }

  return null;
}
