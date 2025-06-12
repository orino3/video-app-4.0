'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/stores/authStore';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import Link from 'next/link';
import BulkUploadModal from './BulkUploadModal';
import QuickAddPlayerModal from './QuickAddPlayerModal';
import EditPendingPlayerModal from './EditPendingPlayerModal';
import { DeleteTeamModal } from './DeleteTeamModal';

interface TeamMember {
  id: string;
  user_id: string | null;
  role: 'coach' | 'player' | 'analyst';
  jersey_number?: string | null;
  created_at: string;
  is_pending: boolean;
  pending_player_name?: string | null;
  pending_player_position?: string | null;
  users?: {
    id: string;
    email: string;
    full_name: string;
    avatar_url?: string;
  };
}

interface TeamInvitation {
  id: string;
  email: string;
  role: string;
  invited_by: string | null;
  created_at: string;
  expires_at: string;
  accepted: boolean;
}

export default function TeamManagement() {
  const { user, isCoach, canManageTeam } = useAuth();
  const { getActiveTeam } = useAuthStore();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'player' | 'coach' | 'analyst'>(
    'player'
  );
  const [inviting, setInviting] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [editingPendingPlayer, setEditingPendingPlayer] =
    useState<TeamMember | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isTeamOwner, setIsTeamOwner] = useState(false);

  const supabase = createClient();
  const activeTeam = getActiveTeam();

  useEffect(() => {
    if (activeTeam) {
      console.log('[TeamManagement] Active team changed:', activeTeam.name, 'ID:', activeTeam.id);
      fetchTeamMembers();
      fetchInvitations();
      checkTeamOwnership();
    }
  }, [activeTeam?.id]); // Use team ID to properly detect changes

  const fetchTeamMembers = async () => {
    if (!activeTeam) return;

    try {
      setLoading(true);
      // Clear previous data
      setMembers([]);
      const { data, error } = await supabase
        .from('team_members')
        .select(
          `
          id,
          user_id,
          role,
          jersey_number,
          created_at,
          is_pending,
          pending_player_name,
          pending_player_position,
          users:user_id (
            id,
            email,
            full_name,
            avatar_url
          )
        `
        )
        .eq('team_id', activeTeam.id)
        .order('is_pending', { ascending: true })
        .order('role', { ascending: true })
        .order('jersey_number', { ascending: true });

      if (error) throw error;

      // Fix the data structure - team_members returns users as a single object, not array
      const formattedMembers = (data || []).map((member) => ({
        ...member,
        role: member.role as 'coach' | 'player' | 'analyst',
        users: member.users as any,
      }));

      console.log('[TeamManagement] Fetched members:', formattedMembers.length, 'for team:', activeTeam.name);
      setMembers(formattedMembers);
    } catch (err) {
      console.error('Error fetching team members:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchInvitations = async () => {
    if (!activeTeam) return;

    try {
      const { data, error } = await supabase
        .from('team_invitations')
        .select('*')
        .eq('team_id', activeTeam.id)
        .eq('accepted', false)
        .gte('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      console.log('[TeamManagement] Fetched invitations:', (data || []).length, 'for team:', activeTeam.name);
      setInvitations(data || []);
    } catch (err) {
      console.error('Error fetching invitations:', err);
    }
  };

  const checkTeamOwnership = async () => {
    if (!activeTeam || !user) return;

    try {
      // Get team details with owner_id
      const { data: teamData, error } = await supabase
        .from('teams')
        .select('owner_id')
        .eq('id', activeTeam.id)
        .single();

      if (error) throw error;

      // If owner_id is not set, check who was the first coach
      if (!teamData?.owner_id) {
        const { data: firstCoach, error: coachError } = await supabase
          .from('team_members')
          .select('user_id')
          .eq('team_id', activeTeam.id)
          .eq('role', 'coach')
          .order('created_at', { ascending: true })
          .limit(1)
          .single();

        if (!coachError && firstCoach) {
          setIsTeamOwner(firstCoach.user_id === user.id);
        }
      } else {
        setIsTeamOwner(teamData.owner_id === user.id);
      }
    } catch (err) {
      console.error('Error checking team ownership:', err);
      setIsTeamOwner(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!activeTeam || !inviteEmail.trim()) return;

    setInviting(true);
    try {
      // Create a team invitation record
      const { data: invitation, error: inviteError } = await supabase
        .from('team_invitations')
        .insert({
          team_id: activeTeam.id,
          email: inviteEmail.trim().toLowerCase(),
          role: inviteRole,
          invited_by: user?.id,
          expires_at: new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000
          ).toISOString(), // 7 days
        })
        .select()
        .single();

      if (inviteError) {
        // Check if it's a duplicate invitation
        if (inviteError.code === '23505') {
          throw new Error('An invitation has already been sent to this email');
        }
        throw inviteError;
      }

      // Show invitation details
      alert(
        `Team invitation created successfully!\n\nEmail: ${inviteEmail}\nRole: ${inviteRole}\nTeam: ${activeTeam.name}\n\nNote: Email notifications are not yet configured. The invitation has been saved to the database and will expire in 7 days.\n\nTo complete the setup, the invited user should:\n1. Sign up with the email: ${inviteEmail}\n2. They will automatically be added to the team`
      );

      setInviteEmail('');
      setInviteRole('player');

      // Refresh invitations list
      await fetchInvitations();
    } catch (err) {
      console.error('Error inviting member:', err);
      alert(err instanceof Error ? err.message : 'Failed to send invitation');
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!activeTeam || !confirm('Are you sure you want to remove this member?'))
      return;

    try {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      await fetchTeamMembers();
    } catch (err) {
      console.error('Error removing member:', err);
      alert('Failed to remove member');
    }
  };

  const handleRoleChange = async (memberId: string, newRole: string) => {
    if (!activeTeam) return;

    try {
      const { error } = await supabase
        .from('team_members')
        .update({ role: newRole })
        .eq('id', memberId);

      if (error) throw error;

      await fetchTeamMembers();
    } catch (err) {
      console.error('Error updating role:', err);
      alert('Failed to update role');
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    if (!confirm('Are you sure you want to cancel this invitation?')) return;

    try {
      const { error } = await supabase
        .from('team_invitations')
        .delete()
        .eq('id', invitationId);

      if (error) throw error;

      await fetchInvitations();
    } catch (err) {
      console.error('Error canceling invitation:', err);
      alert('Failed to cancel invitation');
    }
  };

  if (!activeTeam) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-gray-500 mb-4">Please select a team to manage</p>
            <Link href="/dashboard">
              <Button>Go to Dashboard</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const canManage = canManageTeam(activeTeam.id);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Invite Member Form */}
          {canManage && (
            <div className="bg-white shadow rounded-lg p-6 mb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Invite Team Member
              </h2>
              <form onSubmit={handleInvite} className="flex gap-4">
                <Input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="Enter email address"
                  required
                  className="flex-1"
                />
                <select
                  value={inviteRole}
                  onChange={(e) =>
                    setInviteRole(
                      e.target.value as 'player' | 'coach' | 'analyst'
                    )
                  }
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="player">Player</option>
                  <option value="coach">Coach</option>
                  <option value="analyst">Analyst</option>
                </select>
                <Button type="submit" disabled={inviting}>
                  {inviting ? 'Sending...' : 'Send Invite'}
                </Button>
              </form>

              {/* Bulk Upload Button */}
              <div className="mt-4 flex items-center gap-4">
                <div className="flex-1 border-t border-gray-200"></div>
                <span className="text-sm text-gray-500">or</span>
                <div className="flex-1 border-t border-gray-200"></div>
              </div>

              <div className="mt-4 space-y-2">
                <Button
                  variant="outline"
                  onClick={() => setShowQuickAdd(true)}
                  className="w-full"
                >
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Quick Add Player (No Email Required)
                </Button>

                <Button
                  variant="outline"
                  onClick={() => setShowBulkUpload(true)}
                  className="w-full"
                >
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  Bulk Upload from CSV
                </Button>
              </div>
            </div>
          )}

          {/* Team Members List */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-medium text-gray-900">
                Team Members ({members.length})
              </h2>
            </div>

            {loading ? (
              <div className="p-6 text-center">
                <div className="text-gray-500">Loading team members...</div>
              </div>
            ) : members.length === 0 ? (
              <div className="p-6 text-center">
                <div className="text-gray-500">No team members found</div>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {members.map((member) => {
                  const isPending = member.is_pending;
                  const displayName = isPending
                    ? member.pending_player_name
                    : member.users?.full_name ||
                      member.users?.email ||
                      'Unknown';
                  const displayEmail = isPending
                    ? 'No email (pending)'
                    : member.users?.email;

                  return (
                    <div key={member.id} className="px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {/* Avatar */}
                          <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                            {!isPending && member.users?.avatar_url ? (
                              <img
                                src={member.users.avatar_url}
                                alt={displayName || ''}
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              <span className="text-gray-600 font-medium">
                                {displayName?.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>

                          {/* Member Info */}
                          <div>
                            <div className="font-medium text-gray-900 flex items-center gap-2">
                              {displayName}
                              {isPending && (
                                <span className="px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">
                                  Pending
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center gap-2">
                              <span>{displayEmail}</span>
                              {member.jersey_number && (
                                <>
                                  <span>•</span>
                                  <span>#{member.jersey_number}</span>
                                </>
                              )}
                              {isPending && member.pending_player_position && (
                                <>
                                  <span>•</span>
                                  <span>{member.pending_player_position}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-4">
                          {/* Role */}
                          {canManage && member.user_id !== user?.id ? (
                            <select
                              value={member.role}
                              onChange={(e) =>
                                handleRoleChange(member.id, e.target.value)
                              }
                              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
                            >
                              <option value="player">Player</option>
                              <option value="coach">Coach</option>
                              <option value="analyst">Analyst</option>
                            </select>
                          ) : (
                            <span className="px-3 py-1 bg-gray-100 rounded-md text-sm capitalize">
                              {member.role}
                            </span>
                          )}

                          {/* Edit Button for Pending Players */}
                          {canManage && isPending && (
                            <button
                              onClick={() => setEditingPendingPlayer(member)}
                              className="text-blue-600 hover:text-blue-700 text-sm"
                            >
                              Edit
                            </button>
                          )}

                          {/* Remove Button */}
                          {canManage && member.user_id !== user?.id && (
                            <button
                              onClick={() => handleRemoveMember(member.id)}
                              className="text-red-600 hover:text-red-700 text-sm"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pending Invitations */}
          {canManage && invitations.length > 0 && (
            <div className="bg-white shadow rounded-lg mt-6">
              <div className="px-6 py-4 border-b">
                <h2 className="text-lg font-medium text-gray-900">
                  Pending Invitations ({invitations.length})
                </h2>
              </div>
              <div className="divide-y divide-gray-200">
                {invitations.map((invitation) => (
                  <div key={invitation.id} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">
                          {invitation.email}
                        </div>
                        <div className="text-sm text-gray-500">
                          Role:{' '}
                          <span className="capitalize">{invitation.role}</span>{' '}
                          • Expires:{' '}
                          {new Date(invitation.expires_at).toLocaleDateString()}
                        </div>
                      </div>
                      <button
                        onClick={() => handleCancelInvitation(invitation.id)}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Team Settings */}
          {canManage && (
            <div className="bg-white shadow rounded-lg mt-6 p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Team Settings
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Team Name
                  </label>
                  <Input
                    type="text"
                    value={activeTeam.name}
                    disabled
                    className="bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sport
                  </label>
                  <Input
                    type="text"
                    value={activeTeam.sport}
                    disabled
                    className="bg-gray-50"
                  />
                </div>
                <div className="pt-4">
                  <Button
                    variant="outline"
                    className="text-red-600 border-red-600 hover:bg-red-50"
                    onClick={() => setShowDeleteModal(true)}
                  >
                    Delete Team
                  </Button>
                  {!isTeamOwner && (
                    <p className="text-sm text-gray-500 mt-2">
                      Only the team owner can delete this team
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Bulk Upload Modal */}
      <BulkUploadModal
        isOpen={showBulkUpload}
        onClose={() => setShowBulkUpload(false)}
        teamId={activeTeam.id}
        onSuccess={() => {
          fetchInvitations();
          setShowBulkUpload(false);
        }}
      />

      {/* Quick Add Player Modal */}
      <QuickAddPlayerModal
        isOpen={showQuickAdd}
        onClose={() => setShowQuickAdd(false)}
        teamId={activeTeam.id}
        onSuccess={() => {
          fetchTeamMembers();
          setShowQuickAdd(false);
        }}
      />

      {/* Edit Pending Player Modal */}
      {editingPendingPlayer && (
        <EditPendingPlayerModal
          isOpen={!!editingPendingPlayer}
          onClose={() => setEditingPendingPlayer(null)}
          player={{
            id: editingPendingPlayer.id,
            pending_player_name: editingPendingPlayer.pending_player_name || '',
            jersey_number: editingPendingPlayer.jersey_number || null,
            pending_player_position: editingPendingPlayer.pending_player_position || null,
          }}
          onSuccess={() => {
            fetchTeamMembers();
            setEditingPendingPlayer(null);
          }}
        />
      )}

      {/* Delete Team Modal */}
      {activeTeam && (
        <DeleteTeamModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          teamId={activeTeam.id}
          teamName={activeTeam.name}
          isOwner={isTeamOwner}
        />
      )}
    </div>
  );
}
