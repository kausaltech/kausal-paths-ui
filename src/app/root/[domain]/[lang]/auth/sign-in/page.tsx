'use client';

import { authClient } from '@/lib/auth-client';
import { KAUSAL_PROVIDER_ID } from '@/lib/auth-const';

export default function SignInPage() {
  const handleSignIn = () => {
    void authClient.signIn.oauth2({
      providerId: KAUSAL_PROVIDER_ID,
      callbackURL: '/',
    });
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <button onClick={handleSignIn} type="button">
        Sign in
      </button>
    </div>
  );
}
