import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';

function getSafeReturnPath(req: NextRequest): string {
  const returnTo = req.nextUrl.searchParams.get('returnTo');
  if (!returnTo || !returnTo.startsWith('/') || returnTo.startsWith('//')) return '/';
  return returnTo;
}

/**
 * Clear a rejected OAuth session at a response boundary that can write cookies.
 * RSC callers redirect here after the backend reports `invalid_token`.
 */
export async function GET(req: NextRequest) {
  await auth.api.signOut({
    headers: req.headers,
  });
  return NextResponse.redirect(new URL(getSafeReturnPath(req), req.url), 303);
}
