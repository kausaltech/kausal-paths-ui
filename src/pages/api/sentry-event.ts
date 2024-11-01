import type { NextApiRequest, NextApiResponse } from 'next';
import getRawBody from 'raw-body';

import { getSentryDsn } from '@common/env/runtime';
import { forwardToSentry } from '@common/sentry/tunnel';

const sentryDsn = getSentryDsn();
const sentryDsnUrl = sentryDsn ? new URL(sentryDsn) : null;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!sentryDsnUrl) {
    res.status(500).json({ error: 'Sentry disabled' });
    return;
  }
  const body: NodeJS.ReadableStream = req.body;
  const buffer = await getRawBody(body, {
    length: req.headers['content-length'],
    limit: '1mb',
  });
  try {
    await forwardToSentry(buffer, sentryDsnUrl);
  } catch (err) {
    res.status(500).json({ error: 'Failed to forward to Sentry' });
  }
  return res.status(200).json({});
}

export const config = {
  api: {
    bodyParser: false,
  },
};
