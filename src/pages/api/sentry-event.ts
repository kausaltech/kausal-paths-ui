import type { NextApiRequest, NextApiResponse } from 'next';
import getRawBody from 'raw-body';

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
  const clientIp =
    typeof req.headers[FORWARDED_FOR_HEADER] === 'string'
      ? req.headers[FORWARDED_FOR_HEADER]
      : req.socket.remoteAddress;

  const body = await getRawBody(req);
  try {
    await forwardToSentry(body, sentryDsnUrl, {
      clientIp,
      contentType: req.headers['content-type'],
      referer: req.headers['referer'],
    });
  } catch (_err) {
    res.status(500).json({ error: 'Failed to forward to Sentry' });
  }
  return res.status(200).json({});
}

export const config = {
  api: {
    bodyParser: false,
  },
};
