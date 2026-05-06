'use client';

import { useRouter } from 'next/navigation';

import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CircularProgress,
  Container,
  Stack,
  Typography,
} from '@mui/material';

import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { BoxArrowUpRight } from 'react-bootstrap-icons';

import type { StreamFieldFragment } from '@/common/__generated__/graphql';
import { useSession } from '@/lib/auth-client';
import ThemableIllustration from '../common/ThemableIllustration';

type FrameworkLandingData = Extract<StreamFieldFragment, { __typename: 'FrameworkLandingBlock' }>;

const GET_FRAMEWORK_CONFIGS = gql`
  query FrameworkConfigs($identifier: ID!) {
    framework(identifier: $identifier) {
      id
      configs {
        id
        organizationName
        viewUrl
        instance {
          id
          name
        }
      }
    }
  }
`;

type FrameworkConfigItem = {
  id: string;
  organizationName: string | null;
  viewUrl: string | null;
  instance: { id: string; name: string } | null;
};

type FrameworkConfigsData = {
  framework: { id: string; configs: FrameworkConfigItem[] } | null;
};

function getFirstName(name: string | null | undefined, email: string | null | undefined): string {
  if (name && name.trim()) return name.trim().split(/\s+/)[0];
  if (email) return email.split('@')[0];
  return 'there';
}

function InstanceCard({ config }: { config: FrameworkConfigItem }) {
  const name = config.instance?.name ?? config.organizationName ?? 'Unnamed instance';

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" component="h3">
          {name}
        </Typography>
        {config.organizationName && config.instance?.name && (
          <Typography variant="body2" color="text.secondary">
            {config.organizationName}
          </Typography>
        )}
      </CardContent>
      <CardActions sx={{ justifyContent: 'flex-end' }}>
        {config.viewUrl ? (
          <Button
            size="small"
            href={config.viewUrl}
            target="_blank"
            rel="noopener noreferrer"
            endIcon={<BoxArrowUpRight />}
          >
            Open
          </Button>
        ) : (
          <Button size="small" disabled>
            Missing link from config
          </Button>
        )}
      </CardActions>
    </Card>
  );
}

type Props = {
  block: FrameworkLandingData;
};

export function FrameworkLanding({ block }: Props) {
  const router = useRouter();
  const { data: session } = useSession();
  const { heading, body, framework } = block;

  const isAuthenticated = !!session?.user;
  const firstName = session?.user ? getFirstName(session.user.name, session.user.email) : null;

  const { data: configsData, loading: configsLoading } = useQuery<FrameworkConfigsData>(
    GET_FRAMEWORK_CONFIGS,
    {
      variables: { identifier: framework?.identifier ?? '' },
      skip: !isAuthenticated || !framework,
    }
  );

  if (!framework) return null;

  const { identifier, allowUserRegistration, allowInstanceCreation } = framework;
  const configs = configsData?.framework?.configs ?? [];

  return (
    <>
      <Container maxWidth="md">
        <Box sx={{ width: '100%', mt: 3, mb: 3 }}>
          <ThemableIllustration maxHeight={300} />
        </Box>
      </Container>
      <Container maxWidth="md">
        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom>
            {isAuthenticated ? `Welcome, ${firstName}` : heading}
          </Typography>
          {body && <Box sx={{ mb: 4 }} dangerouslySetInnerHTML={{ __html: body }} />}

          <Stack direction="row" spacing={2} sx={{ mb: 4 }}>
            {!isAuthenticated && (
              <>
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => router.push(`/auth/sign-in?framework=${identifier}`)}
                >
                  Log in
                </Button>
                {allowUserRegistration && (
                  <Button
                    variant="outlined"
                    size="large"
                    onClick={() => router.push(`/auth/register?framework=${identifier}`)}
                  >
                    Register
                  </Button>
                )}
              </>
            )}
            {isAuthenticated && allowInstanceCreation && (
              <Button
                variant="contained"
                size="large"
                onClick={() => router.push(`/auth/create-instance?framework=${identifier}`)}
              >
                Create a new instance
              </Button>
            )}
          </Stack>

          {isAuthenticated && (
            <>
              <Typography variant="h5" component="h2" gutterBottom>
                Your instances
              </Typography>
              {configsLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : configs.length > 0 ? (
                <Stack spacing={2}>
                  {configs.map((config) => (
                    <InstanceCard key={config.id} config={config} />
                  ))}
                </Stack>
              ) : null}
            </>
          )}
        </Box>
      </Container>
    </>
  );
}
