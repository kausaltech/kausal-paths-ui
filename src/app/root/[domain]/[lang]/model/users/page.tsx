'use client';

import { useState } from 'react';

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
  IconButton,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';

import { gql } from '@apollo/client';
import { useMutation, useQuery } from '@apollo/client/react';
import { PersonPlus, XLg } from 'react-bootstrap-icons';

import {
  type AddUserToInstanceMutation,
  type AddUserToInstanceMutationVariables,
  InstanceMemberRole,
  type InstanceUsersQuery,
  type InviteUserToInstanceMutation,
  type InviteUserToInstanceMutationVariables,
  type RemoveInvitationMutation,
  type RemoveInvitationMutationVariables,
} from '@/common/__generated__/graphql';
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
      invitations {
        id
        email
        expiresAt
        createdAt
      }
    }
  }
`;

const ADD_USER_TO_INSTANCE = gql`
  mutation AddUserToInstance($instanceId: ID!, $email: String!) {
    instanceAdmin(instanceId: $instanceId) {
      addUserToInstance(email: $email) {
        __typename
        ... on User {
          id
          email
          firstName
          lastName
        }
        ... on UserNotFoundError {
          email
        }
        ... on OperationInfo {
          messages {
            kind
            message
            field
          }
        }
      }
    }
  }
`;

const REMOVE_INVITATION = gql`
  mutation RemoveInvitation($instanceId: ID!, $invitationId: ID!) {
    instanceAdmin(instanceId: $instanceId) {
      removeInvitation(invitationId: $invitationId) {
        messages {
          kind
          message
          field
        }
      }
    }
  }
`;

const INVITE_USER_TO_INSTANCE = gql`
  mutation InviteUserToInstance($instanceId: ID!, $email: String!) {
    instanceAdmin(instanceId: $instanceId) {
      inviteUserToInstance(email: $email) {
        __typename
        ... on InstanceInvitation {
          id
          email
          expiresAt
        }
        ... on OperationInfo {
          messages {
            kind
            message
            field
          }
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

// Loose email check — server is the source of truth, this just catches the
// obvious typos before the dialog closes.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type DialogStep = 'add' | 'invite';

export default function InstanceUsersPage() {
  const instance = useInstance();
  const { data: session } = useSession();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [dialogStep, setDialogStep] = useState<DialogStep>('add');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const { data, loading, error, refetch } = useQuery<InstanceUsersQuery>(GET_INSTANCE_USERS, {
    fetchPolicy: 'cache-and-network',
  });

  const [addUser, { loading: addLoading }] = useMutation<
    AddUserToInstanceMutation,
    AddUserToInstanceMutationVariables
  >(ADD_USER_TO_INSTANCE);

  const [inviteUser, { loading: inviteLoading }] = useMutation<
    InviteUserToInstanceMutation,
    InviteUserToInstanceMutationVariables
  >(INVITE_USER_TO_INSTANCE);

  const [removeInvitation] = useMutation<
    RemoveInvitationMutation,
    RemoveInvitationMutationVariables
  >(REMOVE_INVITATION);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const submitLoading = addLoading || inviteLoading;

  const me = data?.me ?? null;
  const currentEmail = (me?.email ?? session?.user.email ?? '').toLowerCase() || null;
  const rawMembers = data?.instance?.users ?? [];
  // Backend returns `instance.users` only to instance admins, owners, and
  // superusers; for everyone else it returns `[]`. Any instance with at least
  // an owner produces a non-empty list, so `users.length === 0` after the
  // first response is a reliable signal that the viewer isn't an admin.
  const isAdminViewer = !loading && rawMembers.length > 0;
  const isMemberOfInstance =
    currentEmail !== null && rawMembers.some((m) => m.user.email.toLowerCase() === currentEmail);
  // If you can see the member list but aren't in it, you must be a superuser
  // (instance admins/owners always appear in their own member list).
  const isSuperuser = isAdminViewer && me !== null && !isMemberOfInstance;
  // Sort so "me" is always first when I'm a member.
  const members = currentEmail
    ? [...rawMembers].sort((a, b) => {
        const aMe = a.user.email.toLowerCase() === currentEmail ? 0 : 1;
        const bMe = b.user.email.toLowerCase() === currentEmail ? 0 : 1;
        return aMe - bMe;
      })
    : rawMembers;
  const invitations = data?.instance?.invitations ?? [];

  const handleRevoke = async (invitationId: string, email: string) => {
    setRevokingId(invitationId);
    try {
      const res = await removeInvitation({
        variables: { instanceId: instance.id, invitationId },
      });
      const messages = res.data?.instanceAdmin.removeInvitation?.messages ?? [];
      if (messages.length > 0) {
        setToast(`Failed to revoke invitation: ${formatOperationMessages(messages)}`);
      } else {
        setToast(`Revoked invitation for ${email}`);
      }
      await refetch();
    } catch (e) {
      setToast(e instanceof Error ? e.message : 'Failed to revoke invitation');
    } finally {
      setRevokingId(null);
    }
  };

  const openInvite = () => {
    setInviteEmail('');
    setDialogStep('add');
    setEmailError(null);
    setSubmitError(null);
    setInviteOpen(true);
  };

  const closeInvite = () => {
    if (submitLoading) return;
    setInviteOpen(false);
  };

  const formatOperationMessages = (
    messages: ReadonlyArray<{ message: string; field: string | null }>
  ) => {
    if (messages.length === 0) return 'Operation failed';
    return messages.map((m) => (m.field ? `${m.field}: ${m.message}` : m.message)).join('; ');
  };

  const handleSubmit = async () => {
    const trimmed = inviteEmail.trim();
    if (!EMAIL_RE.test(trimmed)) {
      setEmailError('Enter a valid email address');
      return;
    }
    setSubmitError(null);

    if (dialogStep === 'add') {
      try {
        const res = await addUser({ variables: { instanceId: instance.id, email: trimmed } });
        const payload = res.data?.instanceAdmin.addUserToInstance;
        if (!payload) {
          setSubmitError('No response from server');
          return;
        }
        if (payload.__typename === 'User') {
          setInviteOpen(false);
          setToast(`Added ${payload.email} to ${instance.name}`);
          await refetch();
          return;
        }
        if (payload.__typename === 'UserNotFoundError') {
          setDialogStep('invite');
          return;
        }
        if (payload.__typename === 'OperationInfo') {
          setSubmitError(formatOperationMessages(payload.messages));
          return;
        }
      } catch (e) {
        setSubmitError(e instanceof Error ? e.message : 'Failed to add user');
      }
      return;
    }

    // dialogStep === 'invite'
    try {
      const res = await inviteUser({ variables: { instanceId: instance.id, email: trimmed } });
      const payload = res.data?.instanceAdmin.inviteUserToInstance;
      if (!payload) {
        setSubmitError('No response from server');
        return;
      }
      if (payload.__typename === 'InstanceInvitation') {
        setInviteOpen(false);
        setToast(`Invitation sent to ${payload.email}`);
        await refetch();
        return;
      }
      if (payload.__typename === 'OperationInfo') {
        setSubmitError(formatOperationMessages(payload.messages));
        return;
      }
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Failed to send invitation');
    }
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
        {isAdminViewer && (
          <Button variant="contained" startIcon={<PersonPlus size={14} />} onClick={openInvite}>
            Invite users
          </Button>
        )}
      </Box>

      {!loading && !isAdminViewer && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Only instance admins can manage users. Ask an admin of <strong>{instance.name}</strong> if
          you need to invite or remove users.
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load users: {error.message}
        </Alert>
      )}

      {loading && !data ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={24} />
        </Box>
      ) : !isAdminViewer ? null : members.length === 0 && !isSuperuser ? (
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

      {invitations.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Pending invitations
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Invitations that haven&apos;t been accepted yet.
          </Typography>
          <Stack spacing={1}>
            {invitations.map((inv) => {
              const expires = new Date(inv.expiresAt);
              const expired = expires.getTime() < Date.now();
              return (
                <Paper key={inv.id} variant="outlined" sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ width: 36, height: 36, fontSize: 13 }}>
                      {getInitials(null, inv.email)}
                    </Avatar>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {inv.email}
                        </Typography>
                        <Chip label="Pending" size="small" color="warning" variant="outlined" />
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {expired
                          ? `Expired ${expires.toLocaleDateString()}`
                          : `Expires ${expires.toLocaleDateString()}`}
                      </Typography>
                    </Box>
                    <Tooltip title="Revoke invitation">
                      <span>
                        <IconButton
                          size="small"
                          onClick={() => void handleRevoke(inv.id, inv.email)}
                          disabled={revokingId === inv.id}
                          aria-label="Revoke invitation"
                        >
                          <XLg size={14} />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Box>
                </Paper>
              );
            })}
          </Stack>
        </Box>
      )}

      <Dialog open={inviteOpen} onClose={closeInvite} fullWidth maxWidth="xs">
        <DialogTitle>{dialogStep === 'add' ? 'Add a user' : 'Send an invitation'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 0.5 }}>
            {dialogStep === 'add' ? (
              <Typography variant="body2" color="text.secondary">
                Add an existing user as an admin of <strong>{instance.name}</strong>. If they
                don&apos;t have an account yet, we&apos;ll offer to send an invitation.
              </Typography>
            ) : (
              <Alert severity="info" sx={{ mb: 0 }}>
                No account exists for <strong>{inviteEmail.trim()}</strong>. Send an invitation
                email with a sign-up link?
              </Alert>
            )}
            <TextField
              label="Email address"
              type="email"
              value={inviteEmail}
              onChange={(e) => {
                setInviteEmail(e.target.value);
                if (emailError) setEmailError(null);
                if (submitError) setSubmitError(null);
                // If the user edits the email after a "not found" response,
                // drop back to the add step so we re-check the new address.
                if (dialogStep === 'invite') setDialogStep('add');
              }}
              error={emailError !== null}
              helperText={emailError ?? ' '}
              autoFocus
              fullWidth
              disabled={submitLoading}
            />
            {submitError && <Alert severity="error">{submitError}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeInvite} color="inherit" disabled={submitLoading}>
            Cancel
          </Button>
          <Button onClick={() => void handleSubmit()} variant="contained" disabled={submitLoading}>
            {submitLoading
              ? dialogStep === 'add'
                ? 'Adding…'
                : 'Sending…'
              : dialogStep === 'add'
                ? 'Add user'
                : 'Send invitation'}
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
