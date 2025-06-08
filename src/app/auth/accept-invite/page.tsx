'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

export default function AcceptInvitePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invitation, setInvitation] = useState<any>(null);
  const [accepting, setAccepting] = useState(false);

  const token = searchParams.get('token');
  const supabase = createClient();

  useEffect(() => {
    if (token) {
      fetchInvitation();
    } else {
      setError('No invitation token provided');
      setLoading(false);
    }
  }, [token]);

  const fetchInvitation = async () => {
    try {
      const { data, error } = await supabase
        .from('team_invitations')
        .select(
          `
          *,
          teams (
            id,
            name,
            sport,
            organizations (
              name
            )
          )
        `
        )
        .eq('id', token)
        .eq('accepted', false)
        .gte('expires_at', new Date().toISOString())
        .single();

      if (error || !data) {
        setError('Invalid or expired invitation');
      } else {
        setInvitation(data);
      }
    } catch (err) {
      setError('Failed to load invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!invitation) return;

    setAccepting(true);
    setError(null);

    try {
      // Check if user is authenticated
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        // Redirect to signup with invitation token
        router.push(`/auth/signup?invite=${token}`);
        return;
      }

      // Check if email matches
      if (user.email?.toLowerCase() !== invitation.email.toLowerCase()) {
        setError('This invitation was sent to a different email address');
        setAccepting(false);
        return;
      }

      // Check if this invitation is linked to a pending player
      const pendingPlayerId = invitation.metadata?.pending_player_id;

      if (pendingPlayerId) {
        // Update the existing pending player record
        const { error: updateError } = await supabase
          .from('team_members')
          .update({
            user_id: user.id,
            is_pending: false,
            claimed_at: new Date().toISOString(),
            pending_player_name: null,
            pending_player_position: null,
          })
          .eq('id', pendingPlayerId)
          .eq('is_pending', true);

        if (updateError) throw updateError;
      } else {
        // Create new team member record
        const { error: memberError } = await supabase
          .from('team_members')
          .insert({
            team_id: invitation.team_id,
            user_id: user.id,
            role: invitation.role,
            jersey_number: invitation.metadata?.jersey_number || null,
          });

        if (memberError) throw memberError;
      }

      // Mark invitation as accepted
      const { error: acceptError } = await supabase
        .from('team_invitations')
        .update({
          accepted: true,
          accepted_at: new Date().toISOString(),
          accepted_by: user.id,
        })
        .eq('id', token);

      if (acceptError) throw acceptError;

      // Update user profile if metadata contains additional info
      if (
        invitation.metadata?.full_name ||
        invitation.metadata?.phone_number ||
        invitation.metadata?.whatsapp_number
      ) {
        await supabase
          .from('users')
          .update({
            full_name: invitation.metadata.full_name || undefined,
            phone_number: invitation.metadata.phone_number || undefined,
            whatsapp_number: invitation.metadata.whatsapp_number || undefined,
          })
          .eq('id', user.id);
      }

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err) {
      console.error('Error accepting invitation:', err);
      setError('Failed to accept invitation');
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Invalid Invitation
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link href="/auth/login">
            <Button>Go to Login</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Team Invitation</h2>
        </div>

        <div className="space-y-4 mb-8">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">
              You've been invited to join:
            </p>
            <p className="font-semibold text-lg">{invitation?.teams?.name}</p>
            <p className="text-sm text-gray-600">
              {invitation?.teams?.sport} •{' '}
              {invitation?.teams?.organizations?.name}
            </p>
          </div>

          <div className="flex items-center justify-between py-2">
            <span className="text-gray-600">Role:</span>
            <span className="font-medium capitalize">{invitation?.role}</span>
          </div>

          <div className="flex items-center justify-between py-2">
            <span className="text-gray-600">Invited to:</span>
            <span className="font-medium">{invitation?.email}</span>
          </div>

          <div className="flex items-center justify-between py-2">
            <span className="text-gray-600">Expires:</span>
            <span className="font-medium">
              {new Date(invitation?.expires_at).toLocaleDateString()}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <Button
            onClick={handleAccept}
            disabled={accepting}
            className="w-full"
          >
            {accepting ? 'Accepting...' : 'Accept Invitation'}
          </Button>

          <Link href="/auth/login" className="block">
            <Button variant="outline" className="w-full">
              Cancel
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
