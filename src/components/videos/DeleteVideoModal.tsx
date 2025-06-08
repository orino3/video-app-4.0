'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';

interface DeleteVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDelete: () => void;
  video: {
    id: string;
    title: string;
    source: string;
    video_url: string;
    uploaded_by: string;
    file_size?: number;
    team_id: string;
  };
}

interface AnnotationCount {
  total: number;
  notes: number;
  drawings: number;
  loops: number;
  tags: number;
  mentions: number;
}

export function DeleteVideoModal({
  isOpen,
  onClose,
  onDelete,
  video,
}: DeleteVideoModalProps) {
  const [loading, setLoading] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [annotationCount, setAnnotationCount] = useState<AnnotationCount>({
    total: 0,
    notes: 0,
    drawings: 0,
    loops: 0,
    tags: 0,
    mentions: 0,
  });
  const [loadingCounts, setLoadingCounts] = useState(true);
  const [shares, setShares] = useState<any[]>([]);

  const { user, isCoach, hasTeamAccess } = useAuth();
  const supabase = createClient();

  // Check if user can delete this video
  const canDelete =
    (isCoach && hasTeamAccess(video.team_id)) || user?.id === video.uploaded_by;

  const expectedConfirmText = 'DELETE';

  useEffect(() => {
    if (isOpen && video) {
      fetchAnnotationCounts();
      fetchVideoShares();
    }
  }, [isOpen, video]);

  const fetchAnnotationCounts = async () => {
    try {
      setLoadingCounts(true);

      // Get all annotations for this video
      const { data: annotations, error: annotationsError } = await supabase
        .from('annotations')
        .select('id')
        .eq('video_id', video.id)
        .is('deleted_at', null);

      if (annotationsError) throw annotationsError;

      if (!annotations || annotations.length === 0) {
        setAnnotationCount({
          total: 0,
          notes: 0,
          drawings: 0,
          loops: 0,
          tags: 0,
          mentions: 0,
        });
        return;
      }

      const annotationIds = annotations.map(a => a.id);

      // Count each type of annotation component
      const [notesRes, drawingsRes, loopsRes, tagsRes, mentionsRes] =
        await Promise.all([
          supabase
            .from('annotation_notes')
            .select('id', { count: 'exact' })
            .in('annotation_id', annotationIds),
          supabase
            .from('annotation_drawings')
            .select('id', { count: 'exact' })
            .in('annotation_id', annotationIds),
          supabase
            .from('annotation_loops')
            .select('id', { count: 'exact' })
            .in('annotation_id', annotationIds),
          supabase
            .from('annotation_tags')
            .select('id', { count: 'exact' })
            .in('annotation_id', annotationIds),
          supabase
            .from('annotation_mentions')
            .select('id', { count: 'exact' })
            .in('annotation_id', annotationIds),
        ]);

      setAnnotationCount({
        total: annotations.length,
        notes: notesRes.count || 0,
        drawings: drawingsRes.count || 0,
        loops: loopsRes.count || 0,
        tags: tagsRes.count || 0,
        mentions: mentionsRes.count || 0,
      });
    } catch (error) {
      console.error('Error fetching annotation counts:', error);
    } finally {
      setLoadingCounts(false);
    }
  };

  const fetchVideoShares = async () => {
    try {
      const { data: shareData, error } = await supabase
        .from('video_shares')
        .select(`
          id,
          shared_at,
          teams:shared_to_team_id (
            name
          )
        `)
        .eq('video_id', video.id);

      if (error) throw error;
      setShares(shareData || []);
    } catch (error) {
      console.error('Error fetching video shares:', error);
      setShares([]);
    }
  };

  const handleDownloadVideo = async () => {
    if (video.source === 'youtube') {
      // Open YouTube video in new tab
      window.open(`https://www.youtube.com/watch?v=${video.video_url}`, '_blank');
      return;
    }

    try {
      // For uploaded videos, get the signed URL and trigger download
      const { data, error } = await supabase.storage
        .from('videos')
        .createSignedUrl(video.video_url, 3600); // 1 hour expiry

      if (error) throw error;

      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = data.signedUrl;
      link.download = `${video.title}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading video:', error);
      alert('Failed to download video. Please try again.');
    }
  };

  const handleDownloadAnnotations = async () => {
    try {
      // Get all annotations with their components
      const { data: annotations, error } = await supabase
        .from('annotations')
        .select(`
          id,
          timestamp_start,
          timestamp_end,
          created_at,
          annotation_notes (content),
          annotation_drawings (drawing_data, canvas_width, canvas_height),
          annotation_loops (loop_start_time, loop_end_time),
          annotation_tags (tag_name, tag_category),
          annotation_mentions (
            player_name,
            player_jersey_number
          )
        `)
        .eq('video_id', video.id)
        .is('deleted_at', null)
        .order('timestamp_start');

      if (error) throw error;

      const exportData = {
        video: {
          id: video.id,
          title: video.title,
          source: video.source,
          exported_at: new Date().toISOString(),
        },
        annotations: annotations || [],
        summary: annotationCount,
      };

      // Create and download JSON file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${video.title}-annotations.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading annotations:', error);
      alert('Failed to download annotations. Please try again.');
    }
  };

  const handleDelete = async () => {
    if (!canDelete) {
      alert('You do not have permission to delete this video.');
      return;
    }

    if (confirmText !== expectedConfirmText) {
      alert(`Please type exactly: ${expectedConfirmText}`);
      return;
    }

    try {
      setLoading(true);

      // Delete video shares first (foreign key constraint)
      const { error: sharesError } = await supabase
        .from('video_shares')
        .delete()
        .eq('video_id', video.id);

      if (sharesError) throw sharesError;

      // Delete annotation components (cascading)
      const { data: annotations } = await supabase
        .from('annotations')
        .select('id')
        .eq('video_id', video.id);

      if (annotations && annotations.length > 0) {
        const annotationIds = annotations.map(a => a.id);

        // Delete all annotation components
        await Promise.all([
          supabase
            .from('annotation_notes')
            .delete()
            .in('annotation_id', annotationIds),
          supabase
            .from('annotation_drawings')
            .delete()
            .in('annotation_id', annotationIds),
          supabase
            .from('annotation_loops')
            .delete()
            .in('annotation_id', annotationIds),
          supabase
            .from('annotation_tags')
            .delete()
            .in('annotation_id', annotationIds),
          supabase
            .from('annotation_mentions')
            .delete()
            .in('annotation_id', annotationIds),
        ]);

        // Delete annotations
        const { error: annotationsError } = await supabase
          .from('annotations')
          .delete()
          .eq('video_id', video.id);

        if (annotationsError) throw annotationsError;
      }

      // Delete from storage if it's an uploaded file
      if (video.source === 'upload') {
        const { error: storageError } = await supabase.storage
          .from('videos')
          .remove([video.video_url]);

        if (storageError) {
          console.warn('Storage deletion error (file may not exist):', storageError);
          // Continue with database deletion even if storage deletion fails
        }
      }

      // Finally, delete the video record
      console.log('[DeleteVideoModal] Deleting video record:', video.id);
      const { error: videoError } = await supabase
        .from('videos')
        .delete()
        .eq('id', video.id);

      if (videoError) throw videoError;

      console.log('[DeleteVideoModal] Video successfully deleted from database');
      onDelete();
      onClose();
    } catch (error) {
      // Safely log error without causing console errors
      console.log('[DeleteVideoModal] Error deleting video');
      
      // Extract error message safely
      let errorMessage = 'Unknown error occurred';
      if (error && typeof error === 'object') {
        if ('message' in error) {
          errorMessage = String((error as any).message);
        } else if ('error' in error) {
          errorMessage = String((error as any).error);
        }
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      console.log('[DeleteVideoModal] Error details:', errorMessage);
      alert(`Failed to delete video: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  if (!canDelete) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-md w-full p-6">
          <h3 className="text-lg font-semibold text-red-600 mb-4">
            Access Denied
          </h3>
          <p className="text-gray-600 mb-6">
            You do not have permission to delete this video. Only coaches and the original uploader can delete videos.
          </p>
          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Delete Video</h3>
              <p className="text-sm text-gray-600">This action cannot be undone</p>
            </div>
          </div>

          {/* Video Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-gray-900 mb-2">Video Details</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p><strong>Title:</strong> {video.title}</p>
              <p><strong>Source:</strong> {video.source === 'youtube' ? 'YouTube' : 'Uploaded File'}</p>
              {video.file_size && (
                <p><strong>Size:</strong> {(video.file_size / (1024 * 1024)).toFixed(2)} MB</p>
              )}
            </div>
          </div>

          {/* Annotation Warning */}
          {loadingCounts ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-yellow-800">Loading annotation data...</p>
            </div>
          ) : annotationCount.total > 0 ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <h4 className="font-medium text-red-800 mb-2">
                ⚠️ Annotations Will Be Lost
              </h4>
              <p className="text-red-700 text-sm mb-3">
                This video has{' '}
                <strong>{annotationCount.total} annotations</strong> that will
                be permanently deleted:
              </p>
              <div className="grid grid-cols-2 gap-2 text-sm text-red-700">
                {annotationCount.notes > 0 && (
                  <p>• {annotationCount.notes} notes</p>
                )}
                {annotationCount.drawings > 0 && (
                  <p>• {annotationCount.drawings} drawings</p>
                )}
                {annotationCount.loops > 0 && (
                  <p>• {annotationCount.loops} loops</p>
                )}
                {annotationCount.tags > 0 && (
                  <p>• {annotationCount.tags} tags</p>
                )}
                {annotationCount.mentions > 0 && (
                  <p>• {annotationCount.mentions} player mentions</p>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-green-800">
                ✓ No annotations will be lost (this video has no annotations)
              </p>
            </div>
          )}

          {/* Shares Warning */}
          {shares.length > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
              <h4 className="font-medium text-orange-800 mb-2">
                🔗 Shared with Teams
              </h4>
              <p className="text-orange-700 text-sm mb-2">
                This video is currently shared with {shares.length} team(s):
              </p>
              <ul className="text-sm text-orange-700 list-disc list-inside">
                {shares.map((share, index) => (
                  <li key={index}>{share.teams?.name}</li>
                ))}
              </ul>
              <p className="text-orange-700 text-sm mt-2">
                Deleting will remove access for all shared teams.
              </p>
            </div>
          )}

          {/* Download Options */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-blue-800 mb-3">
              💾 Download Before Deletion
            </h4>
            <p className="text-blue-700 text-sm mb-3">
              Consider downloading the video and annotations before deletion:
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadVideo}
              >
                {video.source === 'youtube'
                  ? '🔗 Open YouTube'
                  : '📥 Download Video'}
              </Button>
              {annotationCount.total > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadAnnotations}
                >
                  📋 Download Annotations
                </Button>
              )}
            </div>
          </div>

          {/* Confirmation */}
          <div className="border-t pt-6">
            <p className="text-sm text-gray-600 mb-3">
              To confirm deletion, type: <strong>{expectedConfirmText}</strong>
            </p>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={expectedConfirmText}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 mb-4"
            />

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button
                onClick={handleDelete}
                disabled={loading || confirmText !== expectedConfirmText}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {loading ? 'Deleting...' : 'Delete Video'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}