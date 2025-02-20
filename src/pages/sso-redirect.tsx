'use client';

import { useEffect } from 'react';
import { signIn } from 'next-auth/react';

import Loader from '@/components/common/Loader';

export default function SSORedirect() {
  useEffect(() => {
    signIn('paths-oidc-provider', { callbackUrl: '/' });
  }, []);

  return <Loader size="lg" />;
}
