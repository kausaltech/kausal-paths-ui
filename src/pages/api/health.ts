import { NextResponse } from 'next/server';

import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(_req: NextApiRequest, _res: NextApiResponse) {
  return NextResponse.json({ status: 'OK' });
}
