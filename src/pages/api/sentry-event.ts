import type { NextApiRequest, NextApiResponse } from 'next';

import { FORWARDED_FOR_HEADER } from '@common/constants/headers.mjs';
import { getSentryDsn } from '@common/env/runtime';
import { forwardToSentry } from '@common/sentry/tunnel';

const sentryDsn = getSentryDsn();
const sentryDsnUrl = sentryDsn ? new URL(sentryDsn) : null;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!sentryDsnUrl) {
    res.status(500).json({ error: 'Sentry disabled' });
    return;
  }
  if (!req.body) {
    res.status(500).json({ error: 'No request body' });
    return;
  }
  const clientIp =
    typeof req.headers[FORWARDED_FOR_HEADER] === 'string'
      ? req.headers[FORWARDED_FOR_HEADER]
      : req.socket.remoteAddress;

  try {
    await forwardToSentry(req.body as string, sentryDsnUrl, clientIp);
  } catch (_err) {
    res.status(500).json({ error: 'Failed to forward to Sentry' });
  }
  return res.status(200).json({});
}
