'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

import { PersonPlus } from 'react-bootstrap-icons';

import { useInstance } from '@/common/instance';
import { useSession } from '@/lib/auth-client';

function getInitials(name: string | null | undefined, email: string | null | undefined): string {
  const source = name?.trim() || email?.split('@')[0] || '';
  if (!source) return '?';
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

type UserStatus = 'active' | 'invited';

type UserRow = {
  id: string;
  name: string | null;
  email: string | null;
  isCurrentUser: boolean;
  status: UserStatus;
};

type InviteRole = 'admin' | 'editor' | 'viewer';

const ROLE_OPTIONS: { value: InviteRole; label: string }[] = [
  { value: 'admin', label: 'Admin' },
  { value: 'editor', label: 'Editor' },
  { value: 'viewer', label: 'Viewer' },
];

// Loose email check — server is the source of truth, this just catches the
// obvious typos before the dialog closes.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function InstanceUsersPage() {
  const router = useRouter();
  const instance = useInstance();
  const { data: session, isPending } = useSession();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<InviteRole>('editor');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

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

  const user = session.user;
  // Placeholder list: backend doesn't yet expose "who has access to this
  // instance", so we seed with the current user plus a mock pending invite.
  // Replace with a real query once InstanceType exposes a users / members
  // field.
  const rows: UserRow[] = [
    {
      id: user.id,
      name: user.name ?? null,
      email: user.email ?? null,
      isCurrentUser: true,
      status: 'active',
    },
    {
      id: 'mock-invited-1',
      name: null,
      email: 'invited.colleague@example.org',
      isCurrentUser: false,
      status: 'invited',
    },
  ];

  const openInvite = () => {
    setInviteEmail('');
    setInviteRole('editor');
    setEmailError(null);
    setInviteOpen(true);
  };

  const handleSendInvite = () => {
    const trimmed = inviteEmail.trim();
    if (!EMAIL_RE.test(trimmed)) {
      setEmailError('Enter a valid email address');
      return;
    }
    // Mock: no backend mutation yet — just close and confirm. Replace with a
    // real invitation mutation once the backend exposes one.
    setInviteOpen(false);
    setToast(`Invitation sent to ${trimmed} (mock)`);
  };

  return (
    <Container maxWidth="md" sx={{ pt: 20, pb: 6, mx: 0 }}>
      <Box
        sx={{
          mb: 4,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="overline" color="text.secondary">
            {instance.name}
          </Typography>
          <Typography variant="h1" sx={{ mt: 0.5 }}>
            Users
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
            People with access to this instance.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<PersonPlus size={14} />} onClick={openInvite}>
          Invite users
        </Button>
      </Box>

      <Stack spacing={1}>
        {rows.map((row) => {
          const isInvited = row.status === 'invited';
          return (
            <Paper key={row.id} variant="outlined" sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar
                  sx={{
                    width: 36,
                    height: 36,
                    fontSize: 13,
                    bgcolor: isInvited ? 'action.disabled' : 'primary.main',
                  }}
                >
                  {getInitials(row.name, row.email)}
                </Avatar>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Typography
                      variant="body1"
                      sx={{ fontWeight: 500, color: isInvited ? 'text.secondary' : 'text.primary' }}
                    >
                      {row.name || row.email || 'Unknown user'}
                    </Typography>
                    {row.isCurrentUser && <Chip label="You" size="small" />}
                    {isInvited && (
                      <Chip label="Invite sent" size="small" color="warning" variant="outlined" />
                    )}
                  </Box>
                  {row.name && row.email && (
                    <Typography variant="body2" color="text.secondary">
                      {row.email}
                    </Typography>
                  )}
                </Box>
              </Box>
            </Paper>
          );
        })}
      </Stack>

      <Dialog open={inviteOpen} onClose={() => setInviteOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Invite a user</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 0.5 }}>
            <Typography variant="body2" color="text.secondary">
              Send an invitation to access <strong>{instance.name}</strong>.
            </Typography>
            <TextField
              label="Email address"
              type="email"
              value={inviteEmail}
              onChange={(e) => {
                setInviteEmail(e.target.value);
                if (emailError) setEmailError(null);
              }}
              error={emailError !== null}
              helperText={emailError ?? ' '}
              autoFocus
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel id="invite-role-label">Role</InputLabel>
              <Select
                labelId="invite-role-label"
                label="Role"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as InviteRole)}
              >
                {ROLE_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Typography variant="caption" color="text.secondary">
              This is a mock — no invitation is actually sent yet.
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInviteOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleSendInvite} variant="contained">
            Send invitation
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={toast !== null}
        autoHideDuration={4000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setToast(null)}>
          {toast ?? ''}
        </Alert>
      </Snackbar>
    </Container>
  );
}
