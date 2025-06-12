'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/stores/authStore';

interface ShareVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoId: string;
  videoTitle: string;
}

interface Team {
  id: string;
  name: string;
  sport?: string;
  organization?: {
    name: string;
  } | null;
}

export function ShareVideoModal({
  isOpen,
  onClose,
  videoId,
  videoTitle,
}: ShareVideoModalProps) {
  const [availableTeams, setAvailableTeams] = useState<Team[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingTeams, setFetchingTeams] = useState(true);

  const { user, teams: userTeams } = useAuth();
  const { activeTeamId } = useAuthStore();
  const supabase = createClient();

  useEffect(() => {
    if (isOpen) {
      fetchAvailableTeams();
    }
  }, [isOpen, activeTeamId]);

  const fetchAvailableTeams = async () => {
    try {
      setFetchingTeams(true);

      // Get all teams where the user is a coach, excluding the current team
      const { data: allUserTeams, error: teamsError } = await supabase
        .from('team_members')
        .select(
          `
          team_id,
          role,
          teams:team_id (
            id,
            name,
            sport,
            organizations:organization_id (
              name
            )
          )
        `
        )
        .eq('user_id', user!.id)
        .eq('role', 'coach');

      if (teamsError) throw teamsError;

      // Filter out current team
      const otherTeams = (allUserTeams || [])
        .map((tm) => ({
          id: tm.teams.id,
          name: tm.teams.name,
          sport: tm.teams.sport,
          organization: tm.teams.organizations,
        }))
        .filter((team) => team.id !== activeTeamId);

      // Check which teams already have this video shared
      const { data: existingShares } = await supabase
        .from('video_shares')
        .select('shared_to_team_id')
        .eq('video_id', videoId);

      const sharedTeamIds = new Set(
        existingShares?.map((share) => share.shared_to_team_id) || []
      );

      // Filter out teams that already have the video
      const teamsToShow = otherTeams.filter(
        (team) => !sharedTeamIds.has(team.id)
      );

      setAvailableTeams(teamsToShow);
    } catch (err) {
      console.error('Error fetching teams:', err);
    } finally {
      setFetchingTeams(false);
    }
  };

  const handleShare = async () => {
    if (selectedTeams.length === 0) return;

    setLoading(true);
    try {
      // Create shares for all selected teams
      const shares = selectedTeams.map((teamId) => ({
        video_id: videoId,
        shared_to_team_id: teamId,
        shared_by: user!.id,
      }));

      const { data, error } = await supabase
        .from('video_shares')
        .insert(shares)
        .select();

      console.log('Share attempt:', { shares, data, error });

      if (error) throw error;

      alert(`Video shared to ${selectedTeams.length} team(s) successfully!`);
      onClose();
    } catch (err: any) {
      console.error('Error sharing video:', err);
      alert(`Failed to share video: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const toggleTeamSelection = (teamId: string) => {
    setSelectedTeams((prev) =>
      prev.includes(teamId)
        ? prev.filter((id) => id !== teamId)
        : [...prev, teamId]
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Share Video</h2>
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

        <div className="mb-4">
          <p className="text-gray-600 text-sm">
            Sharing: <span className="font-semibold">{videoTitle}</span>
          </p>
        </div>

        {fetchingTeams ? (
          <div className="py-8 text-center text-gray-500">Loading teams...</div>
        ) : availableTeams.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            <p>No other teams available to share with.</p>
            <p className="text-sm mt-2">
              You can only share videos with teams where you are a coach.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <h3 className="font-semibold mb-2">
                Select teams to share with:
              </h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {availableTeams.map((team) => (
                  <label
                    key={team.id}
                    className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedTeams.includes(team.id)}
                      onChange={() => toggleTeamSelection(team.id)}
                      className="mr-3"
                    />
                    <div>
                      <div className="font-medium">{team.name}</div>
                      {team.organization && (
                        <div className="text-sm text-gray-500">
                          {team.organization.name}
                        </div>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleShare}
                disabled={loading || selectedTeams.length === 0}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading
                  ? 'Sharing...'
                  : `Share to ${selectedTeams.length} Team(s)`}
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
