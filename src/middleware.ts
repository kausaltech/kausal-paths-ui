import { I18NConfig } from 'next/dist/server/config-shared';
import { NextURL } from 'next/dist/server/web/next-url';
import { NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import type { NextRequest } from 'next/server';

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  const hdr = request.headers;
  const def: string = hdr.get('x-default-locale')!;
  if (!def) return;

  const other: string[] = hdr.get('x-other-locales')!.split(',');
  const path: string = hdr.get('x-normalized-path')!;
  if (path.startsWith('/_next/') || path.startsWith('/static/'))
    return NextResponse.next();

  const url: NextURL = request.nextUrl;
  const i18n: I18NConfig = {
    defaultLocale: def,
    locales: [def, ...other],
  };
  const opts = {
    forceLocale: false,
    nextConfig: {
      i18n,
      basePath: '/abcd',
    },
  };
  const locale = hdr.get('x-current-locale') as string;
  const identifier: string = hdr.get('x-instance-identifier')!;
  const normPath = hdr.get('x-normalized-path')!;
  const newUrl = new URL(`/${identifier}/${locale}${normPath}`, request.url);
  const dest = new NextURL(newUrl, opts);
  dest.locale = locale;
  return NextResponse.rewrite(dest);
  //return NextResponse.rewrite()
  return NextResponse.json({ foo: url.origin });
  return NextResponse.next();
}
