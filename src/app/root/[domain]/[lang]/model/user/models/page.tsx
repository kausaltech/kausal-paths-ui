'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { Box, Chip, CircularProgress, Container, Paper, Stack, Typography } from '@mui/material';

import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';

import { useSession } from '@/lib/auth-client';

const GET_MY_FRAMEWORK_ROLES = gql`
  query MyFrameworkRoles {
    me {
      id
      email
      frameworkRoles {
        frameworkId
        roleId
        orgSlug
        orgId
      }
    }
  }
`;

type FrameworkRoleEntry = {
  frameworkId: string;
  roleId: string | null;
  orgSlug: string | null;
  orgId: string | null;
};

type MyFrameworkRolesQuery = {
  me: {
    id: string;
    email: string | null;
    frameworkRoles: FrameworkRoleEntry[];
  } | null;
};

export default function MyModelsPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  const { data, loading } = useQuery<MyFrameworkRolesQuery>(GET_MY_FRAMEWORK_ROLES, {
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
      <Box
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}
      >
        <CircularProgress />
      </Box>
    );
  }

  const roles = data?.me?.frameworkRoles ?? [];

  return (
    <Container maxWidth="md" sx={{ pt: 16, pb: 6, mx: 0 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="overline" color="text.secondary">
          Account
        </Typography>
        <Typography variant="h1" sx={{ mt: 0.5 }}>
          My models
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
          Frameworks you have a role in.
        </Typography>
      </Box>

      {loading && roles.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={24} />
        </Box>
      ) : roles.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="body2" color="text.secondary">
            You don&apos;t have any framework roles yet.
          </Typography>
        </Paper>
      ) : (
        <Stack spacing={2}>
          {roles.map((role, idx) => (
            <Paper
              key={`${role.frameworkId}-${role.orgId ?? role.orgSlug ?? idx}`}
              variant="outlined"
              sx={{ p: 2 }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Typography variant="h3" sx={{ fontSize: 16 }}>
                  {role.frameworkId}
                </Typography>
                {role.roleId && <Chip label={role.roleId} size="small" />}
              </Box>
              {(role.orgSlug || role.orgId) && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {role.orgSlug ? `Org: ${role.orgSlug}` : `Org ID: ${role.orgId}`}
                </Typography>
              )}
            </Paper>
          ))}
        </Stack>
      )}
    </Container>
  );
}
