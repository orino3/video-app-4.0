'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Player {
  id: string;
  full_name: string;
  jersey_number: string | null;
  role: string;
  is_pending?: boolean;
}

interface CompactMentionSelectorProps {
  onSave: (playerIds: string[]) => void;
  onCancel: () => void;
  initialPlayerIds?: string[];
}

export function CompactMentionSelector({
  onSave,
  onCancel,
  initialPlayerIds = [],
}: CompactMentionSelectorProps) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>(
    initialPlayerIds
  );
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const supabase = createClient();
  const { getActiveTeam } = useAuth();
  const activeTeam = getActiveTeam();

  useEffect(() => {
    const fetchTeamPlayers = async () => {
      if (!activeTeam) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('team_members')
          .select(
            `
            id,
            jersey_number,
            role,
            user_id,
            is_pending,
            pending_player_name,
            users (
              id,
              full_name
            )
          `
          )
          .eq('team_id', activeTeam.id)
          .order('jersey_number', { ascending: true, nullsFirst: false });

        if (error) throw error;

        const playerList =
          data?.map((member) => ({
            id: member.id,
            full_name: member.is_pending
              ? member.pending_player_name
              : member.users?.full_name || 'Unknown Player',
            jersey_number: member.jersey_number,
            role: member.role,
            is_pending: member.is_pending,
          })) || [];

        setPlayers(playerList);
      } catch (err) {
        console.error('Error fetching team players:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTeamPlayers();
  }, [activeTeam, supabase]);

  const togglePlayer = (playerId: string) => {
    if (selectedPlayerIds.includes(playerId)) {
      setSelectedPlayerIds(selectedPlayerIds.filter((id) => id !== playerId));
    } else {
      setSelectedPlayerIds([...selectedPlayerIds, playerId]);
    }
  };

  const filteredPlayers = players.filter((player) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      player.full_name.toLowerCase().includes(searchLower) ||
      player.jersey_number?.includes(searchTerm)
    );
  });

  const selectedPlayers = players.filter((p) =>
    selectedPlayerIds.includes(p.id)
  );

  return (
    <div className="bg-gray-800 rounded p-3 space-y-2">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-medium text-gray-300">Mention Players</h4>
        <button
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-300"
        >
          <svg
            className="w-3 h-3"
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

      {/* Selected players */}
      {selectedPlayers.length > 0 && (
        <div className="flex flex-wrap gap-1 pb-2 border-b border-gray-700">
          {selectedPlayers.map((player) => (
            <span
              key={player.id}
              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-indigo-900 text-indigo-200"
            >
              {player.jersey_number && `#${player.jersey_number} `}
              {player.full_name}
              <button
                onClick={() => togglePlayer(player.id)}
                className="ml-1 hover:text-white"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search */}
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search players..."
        className="w-full px-2 py-1 text-xs bg-gray-700 text-gray-200 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
      />

      {/* Player list */}
      <div className="max-h-32 overflow-y-auto space-y-1">
        {loading ? (
          <p className="text-xs text-gray-400 text-center py-2">Loading...</p>
        ) : filteredPlayers.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-2">
            No players found
          </p>
        ) : (
          filteredPlayers.map((player) => (
            <button
              key={player.id}
              onClick={() => togglePlayer(player.id)}
              className={`w-full flex items-center gap-2 p-1.5 rounded text-left transition-colors ${
                selectedPlayerIds.includes(player.id)
                  ? 'bg-indigo-900 text-indigo-200'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {player.jersey_number && (
                <span className="text-xs font-bold w-6 text-center">
                  {player.jersey_number}
                </span>
              )}
              <span className="text-xs flex-1">{player.full_name}</span>
              {player.is_pending && (
                <span className="text-xs bg-yellow-800 text-yellow-200 px-1 rounded">
                  Pending
                </span>
              )}
            </button>
          ))
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="flex-1 text-xs py-1"
        >
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={() => onSave(selectedPlayerIds)}
          className="flex-1 text-xs py-1 bg-indigo-600 hover:bg-indigo-700"
        >
          Add ({selectedPlayerIds.length})
        </Button>
      </div>
    </div>
  );
}