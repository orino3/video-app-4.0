'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Player {
  id: string;
  full_name: string | null;
  jersey_number: string | null;
  role: string;
  is_pending?: boolean;
}

interface PlayerMentionSelectorProps {
  onSave: (playerIds: string[]) => void;
  onCancel: () => void;
  initialPlayerIds?: string[];
}

export function PlayerMentionSelector({
  onSave,
  onCancel,
  initialPlayerIds = [],
}: PlayerMentionSelectorProps) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayerIds, setSelectedPlayerIds] =
    useState<string[]>(initialPlayerIds);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const supabase = createClient();
  const { user, getActiveTeam } = useAuth();
  const activeTeam = getActiveTeam();

  useEffect(() => {
    const fetchTeamPlayers = async () => {
      if (!activeTeam) {
        setLoading(false);
        return;
      }

      try {
        // Fetch team members with user details
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
          .order('is_pending', { ascending: true })
          .order('jersey_number', { ascending: true, nullsFirst: false });

        if (error) throw error;

        // Transform the data to handle both regular and pending players
        const playerList =
          data?.map((member) => ({
            id: member.id, // Use team_member id for all players
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
    const searchLower = searchTerm.toLowerCase();
    const nameMatch = (player.full_name || '').toLowerCase().includes(searchLower);
    const jerseyMatch = player.jersey_number?.includes(searchTerm) || false;
    return nameMatch || jerseyMatch;
  });

  const selectedPlayers = players.filter((p) =>
    selectedPlayerIds.includes(p.id)
  );

  return (
    <div className="bg-white rounded-lg shadow-2xl border border-gray-300 p-4 w-full max-w-md" style={{ maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Mention Players</h3>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600"
          title="Close"
        >
          <svg
            className="w-5 h-5"
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

      {/* Selected players display */}
      {selectedPlayers.length > 0 && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-2">Selected players:</p>
          <div className="flex flex-wrap gap-2">
            {selectedPlayers.map((player) => (
              <span
                key={player.id}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-700"
              >
                {player.jersey_number && `#${player.jersey_number} `}
                {player.full_name || 'Unknown Player'}
                <button
                  onClick={() => togglePlayer(player.id)}
                  className="ml-2 hover:text-indigo-900"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Search input */}
      <div className="mb-4">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by name or jersey number"
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Player list */}
      {loading ? (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-sm text-gray-500 mt-2">Loading players...</p>
        </div>
      ) : !activeTeam ? (
        <div className="text-center py-4 text-gray-500">
          <p>No team selected</p>
        </div>
      ) : filteredPlayers.length === 0 ? (
        <div className="text-center py-4 text-gray-500">
          <p>No players found</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-1" style={{ maxHeight: '300px' }}>
          {filteredPlayers.map((player) => (
            <button
              key={player.id}
              onClick={() => togglePlayer(player.id)}
              className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${
                selectedPlayerIds.includes(player.id)
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3">
                {player.jersey_number && (
                  <span className="text-lg font-bold text-gray-600 w-8 text-center">
                    {player.jersey_number}
                  </span>
                )}
                <div className="text-left">
                  <div className="font-medium text-gray-900 flex items-center gap-2">
                    {player.full_name || 'Unknown Player'}
                    {player.is_pending && (
                      <span className="px-1.5 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">
                        Pending
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 capitalize">
                    {player.role}
                  </div>
                </div>
              </div>
              {selectedPlayerIds.includes(player.id) && (
                <svg
                  className="w-5 h-5 text-indigo-600"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 mt-6 pt-4 border-t">
        <Button
          variant="outline"
          size="sm"
          onClick={onCancel}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={() => onSave(selectedPlayerIds)}
          className="flex-1"
        >
          Save Mentions ({selectedPlayerIds.length})
        </Button>
      </div>
    </div>
  );
}
