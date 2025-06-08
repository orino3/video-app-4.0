'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { createClient } from '@/lib/supabase/client';

interface EditPendingPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: {
    id: string;
    pending_player_name: string;
    jersey_number: string | null;
    pending_player_position: string | null;
  };
  onSuccess: () => void;
}

export default function EditPendingPlayerModal({
  isOpen,
  onClose,
  player,
  onSuccess,
}: EditPendingPlayerModalProps) {
  const [playerName, setPlayerName] = useState('');
  const [jerseyNumber, setJerseyNumber] = useState('');
  const [position, setPosition] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [sendInvite, setSendInvite] = useState(false);
  const [error, setError] = useState('');

  const supabase = createClient();

  useEffect(() => {
    if (player) {
      setPlayerName(player.pending_player_name || '');
      setJerseyNumber(player.jersey_number || '');
      setPosition(player.pending_player_position || '');
      setEmail('');
      setSendInvite(false);
    }
  }, [player]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!playerName.trim()) {
      setError('Player name is required');
      return;
    }

    setSaving(true);
    try {
      // Update the pending player information
      const { error: updateError } = await supabase
        .from('team_members')
        .update({
          pending_player_name: playerName.trim(),
          jersey_number: jerseyNumber.trim() || null,
          pending_player_position: position.trim() || null,
        })
        .eq('id', player.id);

      if (updateError) throw updateError;

      // If email is provided and invite is requested, create an invitation
      if (email.trim() && sendInvite) {
        // Get the team_id from the team_member record
        const { data: memberData, error: memberError } = await supabase
          .from('team_members')
          .select('team_id')
          .eq('id', player.id)
          .single();

        if (memberError) throw memberError;

        // Create team invitation
        const { error: inviteError } = await supabase
          .from('team_invitations')
          .insert({
            team_id: memberData.team_id,
            email: email.trim().toLowerCase(),
            role: 'player',
            expires_at: new Date(
              Date.now() + 7 * 24 * 60 * 60 * 1000
            ).toISOString(),
            metadata: {
              pending_player_id: player.id,
              player_name: playerName.trim(),
              jersey_number: jerseyNumber.trim() || null,
            },
          });

        if (inviteError) {
          if (inviteError.code === '23505') {
            throw new Error(
              'An invitation has already been sent to this email'
            );
          }
          throw inviteError;
        }

        alert(
          `Player updated and invitation sent to ${email}!\n\nNote: Email notifications are not yet configured. When the player signs up with this email, they will automatically be linked to their existing profile.`
        );
      } else {
        alert('Player information updated successfully!');
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error updating player:', err);
      setError(err instanceof Error ? err.message : 'Failed to update player');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Edit Pending Player</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg
              className="w-6 h-6"
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
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="playerName"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Player Name <span className="text-red-500">*</span>
            </label>
            <Input
              id="playerName"
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="John Smith"
              required
            />
          </div>

          <div>
            <label
              htmlFor="jerseyNumber"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Jersey Number
            </label>
            <Input
              id="jerseyNumber"
              type="text"
              value={jerseyNumber}
              onChange={(e) => setJerseyNumber(e.target.value)}
              placeholder="23"
              maxLength={3}
            />
          </div>

          <div>
            <label
              htmlFor="position"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Position
            </label>
            <Input
              id="position"
              type="text"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              placeholder="Forward"
            />
          </div>

          <div className="border-t pt-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">
              Send Invitation (Optional)
            </h3>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="player@example.com"
              />
            </div>

            {email && (
              <div className="mt-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={sendInvite}
                    onChange={(e) => setSendInvite(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">
                    Send invitation to claim profile
                  </span>
                </label>
              </div>
            )}
          </div>

          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={saving || !playerName.trim()}
              className="flex-1"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={saving}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>

        <div className="mt-4 p-3 bg-blue-50 rounded">
          <p className="text-xs text-blue-800">
            <strong>Tip:</strong> You can add an email address later to invite
            the player to claim their profile. When they sign up with that
            email, they'll automatically be linked to their existing data.
          </p>
        </div>
      </div>
    </div>
  );
}
