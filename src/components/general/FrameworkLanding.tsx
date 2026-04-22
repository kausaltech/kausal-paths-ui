'use client';

import { useRouter } from 'next/navigation';

import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Container,
  Stack,
  Typography,
} from '@mui/material';

import type { StreamFieldFragment } from '@/common/__generated__/graphql';
import { useSession } from '@/lib/auth-client';

type FrameworkLandingData = Extract<StreamFieldFragment, { __typename: 'FrameworkLandingBlock' }>;
type Framework = NonNullable<FrameworkLandingData['framework']>;
type FrameworkConfigItem = Framework['configs'][number];

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
      {config.viewUrl && (
        <CardActions>
          <Button size="small" href={config.viewUrl}>
            Open
          </Button>
        </CardActions>
      )}
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

  if (!framework) return null;

  const isAuthenticated = !!session?.user;
  const { identifier, allowUserRegistration, allowInstanceCreation, configs } = framework;

  return (
    <>
      <Container maxWidth="md">
        <Box
          sx={{
            mt: 4,
            borderRadius: 1,
            overflow: 'hidden',
          }}
        >
          <Box
            component="img"
            src="https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?q=80&w=1470&auto=format&fit=crop"
            alt=""
            sx={{
              width: '100%',
              height: 'auto',
              display: 'block',
              mt: '-10%',
              mb: '-15%',
            }}
          />
        </Box>
      </Container>
      <Container maxWidth="md">
        <Box sx={{ mt: 6, mb: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom>
            {heading}
          </Typography>
          {body && <Box sx={{ mb: 4 }} dangerouslySetInnerHTML={{ __html: body }} />}

          <Stack direction="row" spacing={2} sx={{ mb: 4 }}>
            {allowUserRegistration && !isAuthenticated && (
              <Button
                variant="contained"
                size="large"
                onClick={() => router.push(`/auth/register?framework=${identifier}`)}
              >
                Register
              </Button>
            )}
            {allowInstanceCreation && (
              <Button
                variant="outlined"
                size="large"
                onClick={() => router.push(`/auth/create-instance?framework=${identifier}`)}
              >
                Create new instance
              </Button>
            )}
          </Stack>

          {configs.length > 0 && (
            <>
              <Typography variant="h5" component="h2" gutterBottom>
                Your instances
              </Typography>
              <Stack spacing={2}>
                {configs.map((config) => (
                  <InstanceCard key={config.id} config={config} />
                ))}
              </Stack>
            </>
          )}
        </Box>
      </Container>
    </>
  );
}
