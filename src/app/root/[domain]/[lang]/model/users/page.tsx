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

import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { PersonPlus } from 'react-bootstrap-icons';

import { InstanceMemberRole, type InstanceUsersQuery } from '@/common/__generated__/graphql';
import { useInstance } from '@/common/instance';
import { useSession } from '@/lib/auth-client';

const GET_INSTANCE_USERS = gql`
  query InstanceUsers {
    me {
      id
      email
      firstName
      lastName
    }
    instance {
      id
      users {
        isOwner
        role
        user {
          id
          email
          firstName
          lastName
        }
      }
    }
  }
`;

function getInitials(name: string | null | undefined, email: string | null | undefined): string {
  const source = name?.trim() || email?.split('@')[0] || '';
  if (!source) return '?';
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

const ROLE_LABEL: Record<InstanceMemberRole, string> = {
  [InstanceMemberRole.Admin]: 'Admin',
  [InstanceMemberRole.Reviewer]: 'Reviewer',
  [InstanceMemberRole.SuperAdmin]: 'Super admin',
  [InstanceMemberRole.Viewer]: 'Viewer',
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

  const { data, loading, error } = useQuery<InstanceUsersQuery>(GET_INSTANCE_USERS, {
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

  const me = data?.me ?? null;
  const currentEmail = (me?.email ?? session.user.email ?? '').toLowerCase() || null;
  const rawMembers = data?.instance?.users ?? [];
  const isMemberOfInstance =
    currentEmail !== null && rawMembers.some((m) => m.user.email.toLowerCase() === currentEmail);
  // Backend only exposes `instance.users` to instance admins/owners or
  // superusers. So if you can see this page but aren't in the members list,
  // you must be a superuser. There's no `isSuperuser` field on the User type
  // to confirm this directly — promote a backend flag if this needs to be
  // exact.
  const isSuperuser = me !== null && !isMemberOfInstance;
  // Sort so "me" is always first when I'm a member.
  const members = currentEmail
    ? [...rawMembers].sort((a, b) => {
        const aMe = a.user.email.toLowerCase() === currentEmail ? 0 : 1;
        const bMe = b.user.email.toLowerCase() === currentEmail ? 0 : 1;
        return aMe - bMe;
      })
    : rawMembers;

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
    // Mock: no backend mutation yet — replace with `inviteUserToInstance` once
    // the invite flow is wired up.
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

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load users: {error.message}
        </Alert>
      )}

      {loading && !data ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={24} />
        </Box>
      ) : members.length === 0 && !isSuperuser ? (
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="body2" color="text.secondary">
            No users have access to this instance yet.
          </Typography>
        </Paper>
      ) : (
        <Stack spacing={1}>
          {isSuperuser && me && (
            <Paper key="me" variant="outlined" sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ width: 36, height: 36, fontSize: 13, bgcolor: 'primary.main' }}>
                  {getInitials(
                    [me.firstName, me.lastName].filter(Boolean).join(' ').trim() || null,
                    me.email
                  )}
                </Avatar>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {[me.firstName, me.lastName].filter(Boolean).join(' ').trim() || me.email}
                    </Typography>
                    <Chip label="You" size="small" />
                    <Chip label="Superuser" size="small" color="secondary" />
                  </Box>
                  {([me.firstName, me.lastName].filter(Boolean).join(' ').trim()
                    ? true
                    : false) && (
                    <Typography variant="body2" color="text.secondary">
                      {me.email}
                    </Typography>
                  )}
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mt: 0.5, display: 'block' }}
                  >
                    Not a member of this instance — shown because superusers can access every
                    instance.
                  </Typography>
                </Box>
              </Box>
            </Paper>
          )}
          {members.map((member) => {
            const fullName =
              [member.user.firstName, member.user.lastName].filter(Boolean).join(' ').trim() ||
              null;
            const isCurrentUser =
              currentEmail !== null && member.user.email.toLowerCase() === currentEmail;
            return (
              <Paper key={member.user.id} variant="outlined" sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar
                    sx={{
                      width: 36,
                      height: 36,
                      fontSize: 13,
                      bgcolor: 'primary.main',
                    }}
                  >
                    {getInitials(fullName, member.user.email)}
                  </Avatar>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {fullName || member.user.email}
                      </Typography>
                      {isCurrentUser && <Chip label="You" size="small" />}
                      {member.isOwner && (
                        <Chip label="Owner" size="small" color="primary" variant="outlined" />
                      )}
                      <Chip label={ROLE_LABEL[member.role]} size="small" variant="outlined" />
                    </Box>
                    {fullName && (
                      <Typography variant="body2" color="text.secondary">
                        {member.user.email}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Paper>
            );
          })}
        </Stack>
      )}

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
