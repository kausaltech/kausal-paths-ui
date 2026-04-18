'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  CircularProgress,
  Container,
  Typography,
} from '@mui/material';

import { Box as BoxIcon, Database, Diagram2 } from 'react-bootstrap-icons';

import { useInstance } from '@/common/instance';
import { useSession } from '@/lib/auth-client';

type LandingCard = {
  title: string;
  description: string;
  href: string;
  Icon: typeof Diagram2;
};

const CARDS: LandingCard[] = [
  {
    title: 'Nodes',
    description: 'Edit the causal graph: nodes, edges, and formulas.',
    href: '/nodes',
    Icon: Diagram2,
  },
  {
    title: 'Datasets',
    description: 'Manage datasets that feed node inputs.',
    href: '/datasets',
    Icon: Database,
  },
  {
    title: 'Dimensions',
    description: 'Define dimensions and their categories.',
    href: '/dimensions',
    Icon: BoxIcon,
  },
];

function getModelEditorBase(pathname: string): string {
  const idx = pathname.indexOf('/model-editor');
  return idx >= 0 ? pathname.slice(0, idx) + '/model-editor' : '/model-editor';
}

export default function ModelEditorLandingPage() {
  const router = useRouter();
  const pathname = usePathname();
  const instance = useInstance();
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

  const base = getModelEditorBase(pathname);

  return (
    <Container maxWidth="md" sx={{ pt: 8, pb: 6, mx: 0 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="overline" color="text.secondary">
          Model editor
        </Typography>
        <Typography variant="h1" sx={{ mt: 0.5 }}>
          {instance.name}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
          {instance.leadParagraph ?? 'Edit the model for this instance.'}
        </Typography>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
          gap: 2,
        }}
      >
        {CARDS.map(({ title, description, href, Icon }) => (
          <Card key={href}>
            <CardActionArea component={Link} href={base + href} sx={{ height: '100%' }}>
              <CardContent
                sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, height: '100%' }}
              >
                <Box sx={{ color: 'primary.main' }}>
                  <Icon size={24} />
                </Box>
                <Typography variant="h3">{title}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {description}
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        ))}
      </Box>
    </Container>
  );
}
