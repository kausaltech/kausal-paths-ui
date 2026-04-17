'use client';

import { useState } from 'react';

import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import { Button, IconButton, ListItemIcon, Menu, MenuItem, Typography } from '@mui/material';

import { authClient, useSession } from '@/lib/auth-client';

export default function AccountMenu() {
  const { data: session } = useSession();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  if (!session?.user) return null;

  const handleSignOut = () => {
    setAnchorEl(null);
    void authClient.signOut().then(() => {
      window.location.href = '/';
    });
  };

  return (
    <>
      <IconButton
        onClick={(e) => setAnchorEl(e.currentTarget)}
        size="small"
        aria-label="Account menu"
        sx={{ color: 'inherit' }}
      >
        <AccountCircleIcon />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem disabled>
          <Typography variant="body2">{session.user.email ?? session.user.name}</Typography>
        </MenuItem>
        <MenuItem onClick={handleSignOut}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          Sign out
        </MenuItem>
      </Menu>
    </>
  );
}
