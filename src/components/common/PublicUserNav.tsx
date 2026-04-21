'use client';

import { useState } from 'react';
import Link from 'next/link';

import {
  Avatar,
  Box,
  Button,
  ListItemIcon,
  Menu,
  MenuItem,
  Switch,
  Tooltip,
  Typography,
} from '@mui/material';

import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { BoxArrowRight, ChevronDown, PencilSquare } from 'react-bootstrap-icons';

import { authClient, useSession } from '@/lib/auth-client';

const CAN_EDIT_MODEL = gql`
  query CanEditModel {
    instance {
      id
      nodes {
        id
      }
    }
  }
`;

type CanEditModelData = {
  instance: {
    id: string;
    nodes: { id: string }[];
  };
};

function getFirstName(name: string | null | undefined, email: string | null | undefined): string {
  if (name && name.trim()) return name.trim().split(/\s+/)[0];
  if (email) return email.split('@')[0];
  return 'User';
}

function getInitials(name: string | null | undefined, email: string | null | undefined): string {
  const source = name?.trim() ?? email?.split('@')[0] ?? '';
  if (!source) return '?';
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

export default function PublicUserNav() {
  const { data: session } = useSession();
  const { data: modelData } = useQuery<CanEditModelData>(CAN_EDIT_MODEL, {
    skip: !session?.user,
  });
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  if (!session?.user) return null;

  const canEditModel = (modelData?.instance.nodes.length ?? 0) > 0;

  const user = session.user;
  const firstName = getFirstName(user.name, user.email);
  const initials = getInitials(user.name, user.email);
  const image = 'image' in user && typeof user.image === 'string' ? user.image : null;

  const handleSignOut = () => {
    setAnchorEl(null);
    void authClient.signOut().then(() => {
      window.location.href = '/';
    });
  };

  return (
    <Box
      component="header"
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 1,
        px: 2,
        py: 0.5,
        bgcolor: 'grey.100',
        borderBottom: '1px solid',
        borderColor: 'divider',
        color: 'text.primary',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {canEditModel && (
          <>
            <Tooltip
              title="Draft mode is not yet available — all edits apply directly to the published model."
              placement="bottom"
            >
              <Box
                component="span"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  userSelect: 'none',
                  color: 'success.main',
                  opacity: 0.6,
                }}
              >
                <Switch checked={false} disabled size="small" color="success" />
                <Typography
                  variant="overline"
                  sx={{ color: 'inherit', fontWeight: 600, lineHeight: 1, fontSize: 10 }}
                >
                  Published
                </Typography>
              </Box>
            </Tooltip>
            <Button
              component={Link}
              href="/model-editor"
              size="small"
              variant="text"
              startIcon={<PencilSquare size={12} />}
              sx={{ fontSize: 12, py: 0.25, px: 0.75, textTransform: 'none' }}
            >
              Edit model
            </Button>
          </>
        )}
      </Box>

      <Box
        role="button"
        tabIndex={0}
        onClick={(e) => setAnchorEl(e.currentTarget)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setAnchorEl(e.currentTarget);
          }
        }}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.75,
          pl: 0.5,
          pr: 1,
          py: 0.25,
          cursor: 'pointer',
          userSelect: 'none',
          borderRadius: 1,
          '&:hover': { bgcolor: 'action.hover' },
          '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main' },
        }}
        aria-label="Account menu"
        aria-haspopup="menu"
        aria-expanded={Boolean(anchorEl)}
      >
        <Avatar
          src={image ?? undefined}
          alt={firstName}
          sx={{ width: 24, height: 24, fontSize: 11, bgcolor: 'primary.main' }}
        >
          {initials}
        </Avatar>
        <Typography variant="body2" sx={{ fontWeight: 500, fontSize: 12 }}>
          {firstName}
        </Typography>
        <ChevronDown size={10} />
      </Box>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem disabled sx={{ opacity: '1 !important' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {user.name && (
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {user.name}
              </Typography>
            )}
            {user.email && (
              <Typography variant="caption" color="text.secondary">
                {user.email}
              </Typography>
            )}
          </Box>
        </MenuItem>
        <MenuItem onClick={handleSignOut}>
          <ListItemIcon>
            <BoxArrowRight size={16} />
          </ListItemIcon>
          Sign out
        </MenuItem>
      </Menu>
    </Box>
  );
}
