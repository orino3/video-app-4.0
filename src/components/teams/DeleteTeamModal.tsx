'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';

interface TeamContentSummary {
  video_count: number;
  member_count: number;
  total_annotations: number;
  total_video_size_mb: number;
}

interface DeleteTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamId: string;
  teamName: string;
  isOwner: boolean;
}

export function DeleteTeamModal({
  isOpen,
  onClose,
  teamId,
  teamName,
  isOwner,
}: DeleteTeamModalProps) {
  const [confirmTeamName, setConfirmTeamName] = useState('');
  const [contentSummary, setContentSummary] =
    useState<TeamContentSummary | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [fetchingContent, setFetchingContent] = useState(false);

  const router = useRouter();
  const { refreshUserTeams, setActiveTeam, teams } = useAuthStore();
  const supabase = createClient();

  useEffect(() => {
    if (isOpen && teamId) {
      fetchContentSummary();
    }
  }, [isOpen, teamId]);

  const fetchContentSummary = async () => {
    setFetchingContent(true);
    try {
      const { data, error } = await supabase.rpc('get_team_content_summary', {
        team_id_param: teamId,
      });

      if (error) throw error;

      setContentSummary(data);
    } catch (err) {
      console.error('Error fetching team content:', err);
    } finally {
      setFetchingContent(false);
    }
  };

  const handleDelete = async () => {
    if (!isOwner) {
      alert('Only the team owner can delete the team');
      return;
    }

    if (confirmTeamName !== 'DELETE') {
      alert('Please type DELETE to confirm.');
      return;
    }

    setIsDeleting(true);
    try {
      // Call the soft delete function
      const { error } = await supabase.rpc('soft_delete_team', {
        team_id_param: teamId,
      });

      if (error) throw error;

      alert(
        `Team "${teamName}" has been deleted. It can be restored within 30 days by contacting support.`
      );

      // Refresh user teams
      await refreshUserTeams();

      // If this was the active team, switch to another team or redirect
      const remainingTeams = teams.filter((t) => t.id !== teamId);
      if (remainingTeams.length > 0) {
        setActiveTeam(remainingTeams[0].id);
      } else {
        // No teams left, redirect to dashboard
        router.push('/dashboard');
      }

      onClose();
    } catch (err: any) {
      console.error('Error deleting team:', err);
      alert(`Failed to delete team: ${err.message || 'Unknown error'}`);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Delete Team: {teamName}
        </h2>

        {!isOwner ? (
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-800">
                <strong>Access Denied:</strong> Only the team owner can delete
                this team.
              </p>
            </div>
            <div className="flex justify-end">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Warning Section */}
            <div className="space-y-4 mb-6">
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <h3 className="text-sm font-semibold text-red-800 mb-2">
                  ⚠️ This action is destructive
                </h3>
                <ul className="text-sm text-red-700 space-y-1 list-disc list-inside">
                  <li>All team members will lose access immediately</li>
                  <li>All videos and annotations will become inaccessible</li>
                  <li>The team can be restored within 30 days</li>
                  <li>After 30 days, all data will be permanently deleted</li>
                </ul>
              </div>

              {/* Content Summary */}
              {fetchingContent ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-sm text-gray-500 mt-2">
                    Loading team content...
                  </p>
                </div>
              ) : (
                contentSummary && (
                  <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                    <h3 className="text-sm font-semibold text-gray-800 mb-2">
                      Content that will be deleted:
                    </h3>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• {contentSummary.member_count} team members</li>
                      <li>
                        • {contentSummary.video_count} videos (
                        {contentSummary.total_video_size_mb.toFixed(2)} MB)
                      </li>
                      <li>• {contentSummary.total_annotations} annotations</li>
                    </ul>
                  </div>
                )
              )}

              {/* Confirmation Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  To confirm deletion, type: <strong>DELETE</strong>
                </label>
                <Input
                  type="text"
                  value={confirmTeamName}
                  onChange={(e) => setConfirmTeamName(e.target.value)}
                  placeholder="DELETE"
                  className="w-full"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isDeleting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDelete}
                disabled={
                  isDeleting || confirmTeamName !== 'DELETE' || fetchingContent
                }
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                {isDeleting ? 'Deleting...' : 'Delete Team'}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
