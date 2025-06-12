'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

interface DeletedTeam {
  id: string;
  name: string;
  sport: string;
  deleted_at: string | null;
  organization?: {
    name: string;
  } | null;
}

export default function RecoverTeamsPage() {
  const [deletedTeams, setDeletedTeams] = useState<DeletedTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoringTeam, setRestoringTeam] = useState<string | null>(null);

  const { user } = useAuth();
  const { refreshUserTeams } = useAuthStore();
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    if (user) {
      fetchDeletedTeams();
    }
  }, [user]);

  const fetchDeletedTeams = async () => {
    try {
      setLoading(true);

      // Query teams where user is the owner and team is soft-deleted
      const { data, error } = await supabase
        .from('teams')
        .select(
          `
          id,
          name,
          sport,
          deleted_at,
          organizations:organization_id (
            name
          )
        `
        )
        .eq('owner_id', user!.id)
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false });

      if (error) throw error;

      setDeletedTeams(data || []);
    } catch (err) {
      console.error('Error fetching deleted teams:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (teamId: string, teamName: string) => {
    if (!confirm(`Are you sure you want to restore the team "${teamName}"?`)) {
      return;
    }

    setRestoringTeam(teamId);
    try {
      const { error } = await supabase.rpc('restore_team', {
        team_id_param: teamId,
      });

      if (error) throw error;

      alert(`Team "${teamName}" has been restored successfully!`);

      // Refresh user teams
      await refreshUserTeams();

      // Redirect to team management
      router.push('/teams');
    } catch (err: any) {
      console.error('Error restoring team:', err);
      alert(`Failed to restore team: ${err.message || 'Unknown error'}`);
    } finally {
      setRestoringTeam(null);
      // Refresh the list
      fetchDeletedTeams();
    }
  };

  const getDaysUntilPermanentDeletion = (deletedAt: string) => {
    const deletedDate = new Date(deletedAt);
    const permanentDeletionDate = new Date(deletedDate);
    permanentDeletionDate.setDate(permanentDeletionDate.getDate() + 30);

    const now = new Date();
    const daysLeft = Math.ceil(
      (permanentDeletionDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    return Math.max(0, daysLeft);
  };

  return (
    <ProtectedRoute requireAuth={true}>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/teams/all"
              className="text-blue-600 hover:text-blue-700 text-sm mb-4 inline-block"
            >
              ← Back to Teams
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">
              Recover Deleted Teams
            </h1>
            <p className="text-gray-600 mt-2">
              Teams you've deleted can be restored within 30 days
            </p>
          </div>

          {/* Deleted Teams List */}
          {loading ? (
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-4">Loading deleted teams...</p>
            </div>
          ) : deletedTeams.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                No deleted teams
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                You haven't deleted any teams
              </p>
              <Link href="/teams/all">
                <Button className="mt-4">View Active Teams</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {deletedTeams.map((team) => {
                const daysLeft = getDaysUntilPermanentDeletion(team.deleted_at);
                const isRestoring = restoringTeam === team.id;

                return (
                  <div key={team.id} className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900">
                          {team.name}
                        </h3>
                        <div className="mt-1 text-sm text-gray-600 space-y-1">
                          <p>Sport: {team.sport}</p>
                          {team.organization && (
                            <p>Organization: {team.organization.name}</p>
                          )}
                          <p>
                            Deleted:{' '}
                            {new Date(team.deleted_at).toLocaleDateString()}
                          </p>
                        </div>

                        {/* Deletion Warning */}
                        <div
                          className={`mt-3 text-sm font-medium ${
                            daysLeft <= 7 ? 'text-red-600' : 'text-yellow-600'
                          }`}
                        >
                          {daysLeft > 0 ? (
                            <>
                              ⚠️ {daysLeft} {daysLeft === 1 ? 'day' : 'days'}{' '}
                              until permanent deletion
                            </>
                          ) : (
                            <>⚠️ Scheduled for permanent deletion</>
                          )}
                        </div>
                      </div>

                      <Button
                        onClick={() => handleRestore(team.id, team.name)}
                        disabled={isRestoring || daysLeft === 0}
                        className="ml-4"
                      >
                        {isRestoring ? 'Restoring...' : 'Restore Team'}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Info Box */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-md p-4">
            <h4 className="text-sm font-semibold text-blue-800 mb-2">
              About Team Recovery
            </h4>
            <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
              <li>Deleted teams can be restored within 30 days</li>
              <li>Restoring a team will re-add you as the coach</li>
              <li>All videos and annotations will be restored</li>
              <li>Other team members will need to be re-invited</li>
              <li>
                After 30 days, teams and all associated data are permanently
                deleted
              </li>
            </ul>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
