import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { FORWARDED_FOR_HEADER } from '@common/constants/headers.mjs';
import { getSentryDsn } from '@common/env/runtime';
import { forwardToSentry } from '@common/sentry/tunnel';

const sentryDsn = getSentryDsn();
const sentryDsnUrl = sentryDsn ? new URL(sentryDsn) : null;

export async function POST(req: NextRequest) {
  if (!sentryDsnUrl) {
    return NextResponse.json({ error: 'Sentry disabled' }, { status: 500 });
  }

  const clientIp =
    req.headers.get(FORWARDED_FOR_HEADER) ?? req.headers.get('x-forwarded-for') ?? undefined;

  const body = Buffer.from(await req.arrayBuffer());
  try {
    await forwardToSentry(body, sentryDsnUrl, {
      clientIp,
      contentType: req.headers.get('content-type') ?? undefined,
      referer: req.headers.get('referer') ?? undefined,
    });
  } catch (_err) {
    return NextResponse.json({ error: 'Failed to forward to Sentry' }, { status: 500 });
  }
  return NextResponse.json({});
}
