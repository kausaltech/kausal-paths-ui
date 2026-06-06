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
import { useTranslations } from 'next-intl';
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

const ROLE_LABEL_KEY: Record<
  InstanceMemberRole,
  'users-role-admin' | 'users-role-reviewer' | 'users-role-super-admin' | 'users-role-viewer'
> = {
  [InstanceMemberRole.Admin]: 'users-role-admin',
  [InstanceMemberRole.Reviewer]: 'users-role-reviewer',
  [InstanceMemberRole.SuperAdmin]: 'users-role-super-admin',
  [InstanceMemberRole.Viewer]: 'users-role-viewer',
};

// Loose email check — server is the source of truth, this just catches the
// obvious typos before the dialog closes.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type DialogStep = 'add' | 'invite';

export default function InstanceUsersPage() {
  const t = useTranslations('model-editor');
  const instance = useInstance();
  const { data: session } = useSession();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [dialogStep, setDialogStep] = useState<DialogStep>('add');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; severity: 'success' | 'error' } | null>(
    null
  );

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
  // A failed load leaves `data` undefined, which we must not read as "empty
  // member list" → "not an admin". Only an actual response (no error, instance
  // present) lets us interpret an empty list as a real signal.
  const loadSucceeded = !error && data?.instance != null;
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
      const payload = res.data?.instanceAdmin.removeInvitation;
      const messages = payload?.messages ?? [];
      if (!payload) {
        // A null payload (e.g. permission/validation failure surfaced as
        // partial data) is not a success — don't let the empty-messages
        // fallback report a phantom revocation.
        setToast({
          message: t('users-failed-to-revoke', { error: t('users-no-server-response') }),
          severity: 'error',
        });
      } else if (messages.length > 0) {
        setToast({
          message: t('users-failed-to-revoke', { error: formatOperationMessages(messages) }),
          severity: 'error',
        });
      } else {
        setToast({ message: t('users-revoked', { email }), severity: 'success' });
      }
      await refetch();
    } catch (e) {
      setToast({
        message: e instanceof Error ? e.message : t('users-failed-to-revoke-short'),
        severity: 'error',
      });
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
    if (messages.length === 0) return t('users-operation-failed');
    return messages.map((m) => (m.field ? `${m.field}: ${m.message}` : m.message)).join('; ');
  };

  const handleSubmit = async () => {
    const trimmed = inviteEmail.trim();
    if (!EMAIL_RE.test(trimmed)) {
      setEmailError(t('users-email-invalid'));
      return;
    }
    setSubmitError(null);

    if (dialogStep === 'add') {
      try {
        const res = await addUser({ variables: { instanceId: instance.id, email: trimmed } });
        const payload = res.data?.instanceAdmin.addUserToInstance;
        if (!payload) {
          setSubmitError(t('users-no-server-response'));
          return;
        }
        if (payload.__typename === 'User') {
          setInviteOpen(false);
          setToast({
            message: t('users-added-to-instance', {
              email: payload.email,
              instanceName: instance.name,
            }),
            severity: 'success',
          });
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
        setSubmitError(e instanceof Error ? e.message : t('users-failed-to-add'));
      }
      return;
    }

    // dialogStep === 'invite'
    try {
      const res = await inviteUser({ variables: { instanceId: instance.id, email: trimmed } });
      const payload = res.data?.instanceAdmin.inviteUserToInstance;
      if (!payload) {
        setSubmitError(t('users-no-server-response'));
        return;
      }
      if (payload.__typename === 'InstanceInvitation') {
        setInviteOpen(false);
        setToast({
          message: t('users-invitation-sent', { email: payload.email }),
          severity: 'success',
        });
        await refetch();
        return;
      }
      if (payload.__typename === 'OperationInfo') {
        setSubmitError(formatOperationMessages(payload.messages));
        return;
      }
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : t('users-failed-to-send-invite'));
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
            {t('users-title')}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
            {t('users-people-with-access')}
          </Typography>
        </Box>
        {isAdminViewer && (
          <Button variant="contained" startIcon={<PersonPlus size={14} />} onClick={openInvite}>
            {t('users-invite-users')}
          </Button>
        )}
      </Box>

      {!loading && loadSucceeded && !isAdminViewer && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {t('users-admin-only', { instanceName: instance.name })}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {t('users-failed-to-load', { error: error.message })}
        </Alert>
      )}

      {loading && !data ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={24} />
        </Box>
      ) : !isAdminViewer ? null : members.length === 0 && !isSuperuser ? (
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="body2" color="text.secondary">
            {t('users-no-users')}
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
                    <Chip label={t('users-member')} size="small" />
                    <Chip label={t('users-superuser')} size="small" color="secondary" />
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
                    {t('users-not-member')}
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
                      {isCurrentUser && <Chip label={t('users-member')} size="small" />}
                      {member.isOwner && (
                        <Chip
                          label={t('users-owner')}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      )}
                      <Chip
                        label={t(ROLE_LABEL_KEY[member.role])}
                        size="small"
                        variant="outlined"
                      />
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
            {t('users-pending-invitations')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {t('users-pending-invitations-desc')}
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
                        <Chip
                          label={t('users-pending-status')}
                          size="small"
                          color="warning"
                          variant="outlined"
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {expired
                          ? t('users-expired', { date: expires.toLocaleDateString() })
                          : t('users-expires', { date: expires.toLocaleDateString() })}
                      </Typography>
                    </Box>
                    <Tooltip title={t('common-revoke-invitation')}>
                      <span>
                        <IconButton
                          size="small"
                          onClick={() => void handleRevoke(inv.id, inv.email)}
                          disabled={revokingId === inv.id}
                          aria-label={t('common-revoke-invitation')}
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
        <DialogTitle>
          {dialogStep === 'add' ? t('users-add-user') : t('users-invite-title')}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 0.5 }}>
            {dialogStep === 'add' ? (
              <Typography variant="body2" color="text.secondary">
                {t('users-add-user-desc', { instanceName: instance.name })}
              </Typography>
            ) : (
              <Alert severity="info" sx={{ mb: 0 }}>
                {t('users-email-not-found-desc', { email: inviteEmail.trim() })}
              </Alert>
            )}
            <TextField
              label={t('users-email-address')}
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
            {t('common-cancel')}
          </Button>
          <Button onClick={() => void handleSubmit()} variant="contained" disabled={submitLoading}>
            {submitLoading
              ? dialogStep === 'add'
                ? t('common-adding')
                : t('users-sending')
              : dialogStep === 'add'
                ? t('users-add-user-button')
                : t('users-send-invitation')}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={toast !== null}
        autoHideDuration={4000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={toast?.severity ?? 'success'} onClose={() => setToast(null)}>
          {toast?.message ?? ''}
        </Alert>
      </Snackbar>
    </Container>
  );
}
