'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import ShareWithFamilyModal from '@/components/sharing/ShareWithFamilyModal';
import { DeleteMemberModal } from './DeleteMemberModal';

interface TeamMember {
  id: string;
  user_id: string | null;
  jersey_number: string | null;
  role: string;
  user: {
    id: string;
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  };
}

interface PlayerProfile {
  id: string;
  team_id: string;
  full_name: string;
  email: string | null;
  jersey_number: number | null;
  phone_number: string | null;
  whatsapp_number: string | null;
  avatar_url: string | null;
  is_active: boolean;
  linked_user_id: string | null;
}

interface PlayerManagementProps {
  teamId: string;
  teamName: string;
  isTeamOwner?: boolean;
}

export function PlayerManagement({ teamId, teamName, isTeamOwner = false }: PlayerManagementProps) {
  const [players, setPlayers] = useState<TeamMember[]>([]);
  const [playerProfiles, setPlayerProfiles] = useState<PlayerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlayer, setEditingPlayer] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ [key: string]: string }>({});
  const [shareModal, setShareModal] = useState<{
    isOpen: boolean;
    playerId: string;
    playerName: string;
  }>({ isOpen: false, playerId: '', playerName: '' });
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    member: TeamMember | null;
  }>({ isOpen: false, member: null });

  const supabase = createClient();
  const { user } = useAuth();

  useEffect(() => {
    console.log('[PlayerManagement] Team changed:', teamName, 'ID:', teamId);
    fetchAllPlayers();
  }, [teamId]); // Properly react to team changes

  const fetchAllPlayers = async () => {
    setLoading(true);
    try {
      // Clear previous data
      setPlayers([]);
      setPlayerProfiles([]);
      await Promise.all([fetchAuthenticatedPlayers(), fetchPlayerProfiles()]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAuthenticatedPlayers = async () => {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select(
          `
          id,
          user_id,
          jersey_number,
          role,
          users:user_id (
            id,
            full_name,
            email,
            avatar_url
          )
        `
        )
        .eq('team_id', teamId)
        .order('jersey_number', { ascending: true, nullsFirst: false });

      if (error) throw error;

      // Fix the data structure - team_members returns users as a single object, not array
      const formattedMembers = (data || []).map((member) => ({
        ...member,
        user: member.users as any,
      }));

      console.log('[PlayerManagement] Fetched authenticated players:', formattedMembers.length, 'for team:', teamId);
      setPlayers(formattedMembers);
    } catch (err) {
      console.error('Error fetching players:', err);
    }
  };

  const fetchPlayerProfiles = async () => {
    try {
      // Note: player_profiles table doesn't exist in the current schema
      // This feature would require creating the table first
      setPlayerProfiles([]);
    } catch (err) {
      console.error('Error fetching player profiles:', err);
    }
  };

  const handleEditStart = (player: TeamMember) => {
    setEditingPlayer(player.id);
    setEditValues({
      jersey_number: player.jersey_number || '',
      full_name: player.user.full_name || '',
    });
  };

  const handleEditCancel = () => {
    setEditingPlayer(null);
    setEditValues({});
  };

  const handleEditSave = async (player: TeamMember) => {
    try {
      // Update jersey number in team_members
      const { error: teamMemberError } = await supabase
        .from('team_members')
        .update({
          jersey_number: editValues.jersey_number || null,
        })
        .eq('id', player.id);

      if (teamMemberError) throw teamMemberError;

      // Update full name in users table
      if (editValues.full_name !== player.user.full_name && player.user_id) {
        const { error: userError } = await supabase
          .from('users')
          .update({
            full_name: editValues.full_name,
          })
          .eq('id', player.user_id);

        if (userError) throw userError;
      }

      // Refresh players list
      await fetchAuthenticatedPlayers();
      setEditingPlayer(null);
      setEditValues({});
    } catch (err) {
      console.error('Error updating player:', err);
      alert('Failed to update player information');
    }
  };

  const handleRemovePlayer = (player: TeamMember) => {
    setDeleteModal({ isOpen: true, member: player });
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'coach':
        return 'bg-blue-100 text-blue-800';
      case 'player':
        return 'bg-green-100 text-green-800';
      case 'analyst':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleEditProfile = async (profile: PlayerProfile) => {
    setEditingPlayer(profile.id);
    setEditValues({
      jersey_number: profile.jersey_number?.toString() || '',
      full_name: profile.full_name,
    });
  };

  const handleSaveProfile = async (profile: PlayerProfile) => {
    try {
      // Note: player_profiles table doesn't exist in the current schema
      throw new Error('Player profiles feature not available');
    } catch (err) {
      console.error('Error updating profile:', err);
      alert('Failed to update player profile');
    }
  };

  const handleRemoveProfile = async (profileId: string) => {
    if (!confirm('Are you sure you want to remove this player profile?')) {
      return;
    }

    try {
      // Note: player_profiles table doesn't exist in the current schema
      throw new Error('Player profiles feature not available');
    } catch (err) {
      console.error('Error removing profile:', err);
      alert('This feature is not yet available');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-500 mt-2">Loading players...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Player Roster - {teamName}
        </h2>

        <div className="text-sm text-gray-600 mb-6">
          Total Members: {players.length + playerProfiles.length}(
          {players.filter((p) => p.role === 'player').length +
            playerProfiles.length}{' '}
          players,
          {players.filter((p) => p.role === 'coach').length} coaches)
        </div>

        {players.length === 0 && playerProfiles.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No team members yet. Add or invite players to get started!
          </div>
        ) : (
          <div className="space-y-4">
            {players.map((player) => (
              <div
                key={player.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                {editingPlayer === player.id ? (
                  // Edit mode
                  <div className="flex items-center gap-4">
                    <div className="w-16">
                      <Input
                        type="text"
                        value={editValues.jersey_number || ''}
                        onChange={(e) =>
                          setEditValues({
                            ...editValues,
                            jersey_number: e.target.value,
                          })
                        }
                        placeholder="#"
                        className="text-center"
                        maxLength={3}
                      />
                    </div>
                    <div className="flex-1">
                      <Input
                        type="text"
                        value={editValues.full_name || ''}
                        onChange={(e) =>
                          setEditValues({
                            ...editValues,
                            full_name: e.target.value,
                          })
                        }
                        placeholder="Player Name"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleEditSave(player)}>
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleEditCancel}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  // View mode
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Jersey Number */}
                      <div className="w-16 text-center">
                        {player.jersey_number ? (
                          <span className="text-2xl font-bold text-gray-700">
                            {player.jersey_number}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </div>

                      {/* Player Info */}
                      <div>
                        <div className="font-medium text-gray-900">
                          {player.user.full_name || player.user.email}
                        </div>
                        {player.user.full_name && (
                          <div className="text-sm text-gray-500">
                            {player.user.email}
                          </div>
                        )}
                      </div>

                      {/* Role Badge */}
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(player.role)}`}
                      >
                        {player.role}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      {player.role === 'player' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            setShareModal({
                              isOpen: true,
                              playerId: player.user_id || '',
                              playerName:
                                player.user.full_name || player.user.email,
                            })
                          }
                        >
                          <svg
                            className="w-4 h-4 mr-1"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m9.632 4.684C18.886 16.938 19 17.482 19 18c0 1.657-1.343 3-3 3s-3-1.343-3-3 1.343-3 3-3c.482 0 .938.114 1.342.316m0 0a3 3 0 00-4.684-4.684m4.684 4.684L12.658 8.658m0 0a3 3 0 10-4.684 4.684"
                            />
                          </svg>
                          Share
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditStart(player)}
                      >
                        Edit
                      </Button>
                      {player.user_id !== user?.id && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRemovePlayer(player)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Player Profiles (Non-authenticated) */}
            {playerProfiles.map((profile) => (
              <div
                key={profile.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors bg-gray-50"
              >
                {editingPlayer === profile.id ? (
                  // Edit mode for profile
                  <div className="flex items-center gap-4">
                    <div className="w-16">
                      <Input
                        type="text"
                        value={editValues.jersey_number || ''}
                        onChange={(e) =>
                          setEditValues({
                            ...editValues,
                            jersey_number: e.target.value,
                          })
                        }
                        placeholder="#"
                        className="text-center"
                        maxLength={3}
                      />
                    </div>
                    <div className="flex-1">
                      <Input
                        type="text"
                        value={editValues.full_name || ''}
                        onChange={(e) =>
                          setEditValues({
                            ...editValues,
                            full_name: e.target.value,
                          })
                        }
                        placeholder="Player Name"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleSaveProfile(profile)}>
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleEditCancel}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  // View mode for profile
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Jersey Number */}
                      <div className="w-16 text-center">
                        {profile.jersey_number ? (
                          <span className="text-2xl font-bold text-gray-700">
                            {profile.jersey_number}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </div>

                      {/* Player Info */}
                      <div>
                        <div className="font-medium text-gray-900">
                          {profile.full_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {profile.email || 'No email'}
                          {!profile.linked_user_id && (
                            <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
                              Not registered
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Role Badge */}
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800`}
                      >
                        player (profile)
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setShareModal({
                            isOpen: true,
                            playerId: profile.id,
                            playerName: profile.full_name,
                          })
                        }
                      >
                        <svg
                          className="w-4 h-4 mr-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m9.632 4.684C18.886 16.938 19 17.482 19 18c0 1.657-1.343 3-3 3s-3-1.343-3-3 1.343-3 3-3c.482 0 .938.114 1.342.316m0 0a3 3 0 00-4.684-4.684m4.684 4.684L12.658 8.658m0 0a3 3 0 10-4.684 4.684"
                          />
                        </svg>
                        Share
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditProfile(profile)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRemoveProfile(profile.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tips Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">
          Tips for Managing Your Roster
        </h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>
            • Assign jersey numbers to help identify players in video
            annotations
          </li>
          <li>
            • Players with "Not registered" badges can be tagged but cannot
            access the platform yet
          </li>
          <li>• Use bulk upload to quickly add your entire roster</li>
          <li>
            • Share videos and stats with player families using the Share button
          </li>
        </ul>
      </div>

      {/* Share Modal */}
      {shareModal.isOpen && (
        <ShareWithFamilyModal
          isOpen={shareModal.isOpen}
          onClose={() =>
            setShareModal({ isOpen: false, playerId: '', playerName: '' })
          }
          playerId={shareModal.playerId}
          playerName={shareModal.playerName}
          shareType="stats"
          shareContent={{
            title: `${shareModal.playerName}'s Weekly Highlights`,
            description: 'Top plays and performance stats',
          }}
        />
      )}

      {/* Delete Member Modal */}
      {deleteModal.member && (
        <DeleteMemberModal
          isOpen={deleteModal.isOpen}
          onClose={() => setDeleteModal({ isOpen: false, member: null })}
          onSuccess={() => {
            fetchAllPlayers();
            setDeleteModal({ isOpen: false, member: null });
          }}
          member={{
            id: deleteModal.member.id,
            user_id: deleteModal.member.user_id || '',
            role: deleteModal.member.role,
            full_name: deleteModal.member.user.full_name || deleteModal.member.user.email,
            email: deleteModal.member.user.email,
          }}
          teamId={teamId}
          isTeamOwner={isTeamOwner}
        />
      )}
    </div>
  );
}
