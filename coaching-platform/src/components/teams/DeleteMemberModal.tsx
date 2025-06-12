'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface DeleteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  member: {
    id: string;
    user_id: string;
    role: string;
    full_name: string;
    email: string;
  };
  teamId: string;
  isTeamOwner: boolean;
}

export function DeleteMemberModal({
  isOpen,
  onClose,
  onSuccess,
  member,
  teamId,
  isTeamOwner,
}: DeleteMemberModalProps) {
  const [loading, setLoading] = useState(false);
  const [preserveAnnotations, setPreserveAnnotations] = useState(true);
  
  const { user } = useAuth();
  const supabase = createClient();

  if (!isOpen) return null;

  // Check if current user can delete this member
  const canDelete = () => {
    // Can't delete yourself
    if (member.user_id === user?.id) return false;
    
    // Team owner can delete anyone
    if (isTeamOwner) return true;
    
    // Coaches can delete players and analysts
    if (member.role === 'player' || member.role === 'analyst') {
      return true;
    }
    
    // Coaches cannot delete other coaches
    return false;
  };

  const handleDelete = async () => {
    if (!canDelete()) {
      alert('You do not have permission to remove this member');
      return;
    }

    setLoading(true);
    try {
      // If not preserving annotations, delete them first
      if (!preserveAnnotations) {
        // Get all videos for this team
        const { data: videos } = await supabase
          .from('videos')
          .select('id')
          .eq('team_id', teamId);

        if (videos && videos.length > 0) {
          const videoIds = videos.map(v => v.id);
          
          // Delete annotations created by this user on team videos
          const { error: annotationError } = await supabase
            .from('annotations')
            .delete()
            .in('video_id', videoIds)
            .eq('created_by', member.user_id);

          if (annotationError) {
            console.error('Error deleting annotations:', annotationError);
            // Continue with member deletion even if annotation deletion fails
          }
        }
      }

      // Delete team member
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', member.id);

      if (error) throw error;

      // TODO: Send notification email to removed member
      // Note: Email system not yet configured
      console.log('TODO: Send removal notification to', member.email);

      alert(`${member.full_name} has been removed from the team${!preserveAnnotations ? ' along with their annotations' : ''}.`);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error removing team member:', err);
      alert(`Failed to remove team member: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const getRoleDescription = () => {
    if (member.role === 'coach' && isTeamOwner) {
      return 'This coach will lose access to manage the team and its videos.';
    } else if (member.role === 'coach') {
      return 'Only the team owner can remove other coaches.';
    } else if (member.role === 'player') {
      return 'This player will lose access to view team videos and their performance data.';
    } else {
      return 'This analyst will lose access to view team videos and analytics.';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Remove Team Member</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
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

        <div className="space-y-4">
          {/* Member Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="font-semibold text-gray-900">{member.full_name}</p>
            <p className="text-sm text-gray-600">{member.email}</p>
            <p className="text-sm text-gray-600 capitalize">Role: {member.role}</p>
          </div>

          {/* Warning Message */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex">
              <svg
                className="w-5 h-5 text-yellow-600 mt-0.5 mr-2 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <div className="text-sm text-yellow-800">
                <p className="font-medium">
                  {canDelete() ? 'This action cannot be undone.' : 'Permission Denied'}
                </p>
                <p>{getRoleDescription()}</p>
              </div>
            </div>
          </div>

          {/* Annotations Option */}
          {canDelete() && (
            <div className="border border-gray-200 rounded-lg p-4">
              <label className="flex items-start">
                <input
                  type="checkbox"
                  checked={preserveAnnotations}
                  onChange={(e) => setPreserveAnnotations(e.target.checked)}
                  className="mt-1 mr-3"
                />
                <div>
                  <p className="font-medium text-gray-900">
                    Preserve annotations
                  </p>
                  <p className="text-sm text-gray-600">
                    Keep all annotations and comments made by this member. Uncheck to delete their contributions.
                  </p>
                </div>
              </label>
            </div>
          )}

          {/* Error for permission */}
          {!canDelete() && member.user_id === user?.id && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">
                You cannot remove yourself from the team.
              </p>
            </div>
          )}

          {!canDelete() && member.role === 'coach' && !isTeamOwner && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">
                Only the team owner can remove other coaches.
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-6">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          {canDelete() && (
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
            >
              {loading ? 'Removing...' : 'Remove Member'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}