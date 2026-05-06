'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { Box, CircularProgress } from '@mui/material';

import NodeGraphEditor from '@/components/model-editor/NodeGraphEditor';
import { useSession } from '@/lib/auth-client';

export default function ModelEditorNodesPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.replace('/auth/sign-in');
    }
  }, [isPending, session, router]);

  if (isPending || !session?.user) {
    return (
      <Box
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return <NodeGraphEditor />;
}
