'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import { Box, CircularProgress, Container, Paper, Stack, Typography } from '@mui/material';

import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { ShieldLock } from 'react-bootstrap-icons';

import type { ModelEditorAccessQuery } from '@/common/__generated__/graphql';
import { useInstance } from '@/common/instance';
import { useSession } from '@/lib/auth-client';

const GET_EDITOR_ACCESS = gql`
  query ModelEditorAccess {
    instance {
      id
      editor {
        __typename
      }
    }
  }
`;

// Routes under /model that don't require edit rights to the *current* instance.
// The model picker lets a user switch to an instance they can edit, so signed-in
// users always get through even if they can't edit this one — but the editor
// chrome (nav, stale-version notice) is still hidden in that case.
const EXEMPT_PREFIXES = ['/model/user/'];

function isExempt(pathname: string): boolean {
  return EXEMPT_PREFIXES.some((prefix) => pathname.includes(prefix));
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      {children}
    </Box>
  );
}

type Props = {
  children: React.ReactNode;
  /** Editor-only UI (nav, stale-version notice). Rendered only when the user has edit rights. */
  chrome?: React.ReactNode;
};

export default function EditorAccessGate({ children, chrome }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const instance = useInstance();
  const { data: session, isPending } = useSession();
  const exempt = isExempt(pathname);

  const { data, loading } = useQuery<ModelEditorAccessQuery>(GET_EDITOR_ACCESS, {
    skip: !session?.user,
    fetchPolicy: 'cache-and-network',
  });

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.replace('/auth/sign-in');
    }
  }, [isPending, session, router]);

  if (isPending || !session?.user) {
    return (
      <Centered>
        <CircularProgress />
      </Centered>
    );
  }

  // Wait for the first response before deciding — `data` is undefined on the
  // initial fetch, and rendering the denial screen here would flash for every
  // editor on every navigation.
  if (loading && !data) {
    return (
      <Centered>
        <CircularProgress />
      </Centered>
    );
  }

  const canEdit = data?.instance.editor != null;

  if (exempt) {
    return (
      <>
        {children}
        {canEdit && chrome}
      </>
    );
  }

  if (!canEdit) {
    return (
      <Container maxWidth="sm" sx={{ pt: 20, pb: 6 }}>
        <Paper variant="outlined" sx={{ p: 4 }}>
          <Stack spacing={2} alignItems="flex-start">
            <ShieldLock size={28} />
            <Typography variant="h5">No edit access</Typography>
            <Typography variant="body1" color="text.secondary">
              You don&apos;t have edit access to <strong>{instance.name}</strong>. Ask an
              administrator of this model to grant you access, or switch to a model you can edit.
            </Typography>
          </Stack>
        </Paper>
      </Container>
    );
  }

  return (
    <>
      {children}
      {chrome}
    </>
  );
}
