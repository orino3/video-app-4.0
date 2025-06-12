'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { createClient } from '@/lib/supabase/client';

interface QuickAddPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamId: string;
  onSuccess: () => void;
}

export default function QuickAddPlayerModal({
  isOpen,
  onClose,
  teamId,
  onSuccess,
}: QuickAddPlayerModalProps) {
  const [playerName, setPlayerName] = useState('');
  const [jerseyNumber, setJerseyNumber] = useState('');
  const [position, setPosition] = useState('');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');

  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!playerName.trim()) {
      setError('Player name is required');
      return;
    }

    setAdding(true);
    try {
      const { error: insertError } = await supabase
        .from('team_members')
        .insert({
          team_id: teamId,
          role: 'player',
          jersey_number: jerseyNumber.trim() || null,
          is_pending: true,
          pending_player_name: playerName.trim(),
          pending_player_position: position.trim() || null,
          user_id: null,
        });

      if (insertError) {
        if (insertError.code === '23505') {
          throw new Error('A player with this jersey number already exists');
        }
        throw insertError;
      }

      // Reset form
      setPlayerName('');
      setJerseyNumber('');
      setPosition('');

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error adding player:', err);
      setError(err instanceof Error ? err.message : 'Failed to add player');
    } finally {
      setAdding(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Quick Add Player</h2>
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

        <p className="text-sm text-gray-600 mb-4">
          Add a player immediately without requiring an email address. They can
          claim their profile later.
        </p>

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
              autoFocus
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

          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={adding || !playerName.trim()}
              className="flex-1"
            >
              {adding ? 'Adding...' : 'Add Player'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={adding}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>

        <div className="mt-4 p-3 bg-blue-50 rounded">
          <p className="text-xs text-blue-800">
            <strong>Note:</strong> This player will be immediately available for
            tagging in annotations. They'll see a "Pending" badge until they
            claim their profile via email invitation.
          </p>
        </div>
      </div>
    </div>
  );
}
