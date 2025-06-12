'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/stores/authStore';
import Link from 'next/link';
import { AddYouTubeVideoModal } from './AddYouTubeVideoModal';
import { ShareVideoModal } from './ShareVideoModal';
import { DeleteVideoModal } from './DeleteVideoModal';

interface Video {
  id: string;
  title: string;
  source: string;
  video_url: string;
  created_at: string;
  file_size?: number;
  duration?: number;
  access_type?: 'owned' | 'shared';
  owner_team_name?: string;
  shared_at?: string;
  uploaded_by?: string;
  team_id?: string;
}

export function VideoList() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [videoToDelete, setVideoToDelete] = useState<Video | null>(null);
  const [refreshKey, setRefreshKey] = useState(0); // Force refresh mechanism

  const { teams, isCoach, user } = useAuth();
  const { getActiveTeam, activeTeamId } = useAuthStore();
  const supabase = createClient();

  // Helper function to check if user can delete a video
  const canDeleteVideo = (video: Video) => {
    if (!user) return false;
    // Coaches can delete any video in their team, uploaders can delete their own videos
    return (
      (isCoach && video.access_type === 'owned') ||
      user.id === video.uploaded_by
    );
  };

  const fetchVideos = useCallback(async () => {
    console.log('[VideoList] fetchVideos called');
    try {
      setLoading(true);
      setError(null); // Clear any previous errors
      setVideos([]); // Clear previous videos
      const activeTeam = getActiveTeam();
      
      // If no active team, show videos from all user's teams
      if (!activeTeam) {
        console.log('[VideoList] No active team - fetching videos from all teams');
        const userTeamIds = teams.map(team => team.id);
        if (userTeamIds.length === 0) {
          setError('You are not a member of any teams');
          return;
        }

        // Get videos from all user's teams
        const { data: allVideos, error: allError } = await supabase
          .from('videos')
          .select(
            'id, title, source, video_url, created_at, file_size, duration, uploaded_by, team_id'
          )
          .in('team_id', userTeamIds)
          .order('created_at', { ascending: false });

        if (allError) throw allError;
        
        console.log('[VideoList] All teams videos:', allVideos?.length || 0);
        const formattedVideos = (allVideos || []).map((v) => ({
          ...v,
          access_type: 'owned' as const,
        }));
        setVideos(formattedVideos);
        return;
      }

      const teamId = activeTeam.id;
      console.log(
        '[VideoList] Fetching videos for team:',
        activeTeam.name,
        'ID:',
        teamId
      );

      // First, get videos owned by this team
      const { data: ownedVideos, error: ownedError } = await supabase
        .from('videos')
        .select(
          'id, title, source, video_url, created_at, file_size, duration, uploaded_by, team_id'
        )
        .eq('team_id', teamId)
        .order('created_at', { ascending: false });

      if (ownedError) throw ownedError;

      console.log(
        '[VideoList] Owned videos for team',
        teamId,
        ':',
        ownedVideos?.length || 0
      );

      // Then, get videos shared to this team
      const { data: sharedVideos, error: sharedError } = await supabase
        .from('video_shares')
        .select(
          `
          video_id,
          shared_at,
          videos:video_id (
            id,
            title,
            source,
            video_url,
            created_at,
            file_size,
            duration,
            uploaded_by,
            team_id,
            teams:team_id (
              name
            )
          )
        `
        )
        .eq('shared_to_team_id', teamId)
        .order('shared_at', { ascending: false });

      if (sharedError) throw sharedError;

      // Combine owned and shared videos
      const allVideos = [
        ...(ownedVideos || []).map((v) => ({
          ...v,
          access_type: 'owned' as const,
        })),
        ...(sharedVideos || []).map((share) => ({
          ...share.videos,
          access_type: 'shared' as const,
          owner_team_name: share.videos.teams?.name,
          shared_at: share.shared_at,
        })),
      ];

      // Sort by created_at (newest first)
      allVideos.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      console.log('[VideoList] Total videos fetched:', allVideos.length);
      setVideos(allVideos);
    } catch (err) {
      console.log('[VideoList] Error fetching videos');
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.log('[VideoList] Error details:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
      console.log('[VideoList] Fetch completed, loading state set to false');
    }
  }, [getActiveTeam, supabase, teams]);

  useEffect(() => {
    // Always fetch videos when component mounts or when activeTeamId, teams, or refreshKey change
    fetchVideos();
  }, [activeTeamId, fetchVideos, refreshKey]); // Fetch videos regardless of active team

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading videos...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="text-red-600">Error: {error}</div>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <>
        <div className="bg-white rounded-lg border p-8 text-center">
          <div className="text-gray-400 text-4xl mb-4">📹</div>
          <h2 className="text-xl font-semibold mb-2">No videos yet</h2>
          <p className="text-gray-600 mb-6">
            Upload your first video or add a YouTube video to get started with video analysis
          </p>
          <div className="flex justify-center gap-3">
            <Link
              href="/dashboard/upload"
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Upload Video
            </Link>
            <button
              onClick={() => {
                console.log('[VideoList] YouTube button clicked (empty state), opening modal');
                setIsModalOpen(true);
              }}
              className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
              Add YouTube Video
            </button>
          </div>
        </div>

        {/* Modals - Always render these even when no videos */}
        <AddYouTubeVideoModal
          isOpen={isModalOpen}
          onClose={() => {
            console.log('[VideoList] Closing YouTube modal');
            setIsModalOpen(false);
          }}
          onAdd={async (url, videoId, title) => {
            console.log('Adding YouTube video:', url);
            console.log('Video ID:', videoId);
            console.log('Title:', title);

            try {
              // Save YouTube video to database
              const activeTeam = getActiveTeam();
              let teamId: string;
              
              if (!activeTeam) {
                // If no active team, use the first team the user belongs to
                if (teams.length === 0) {
                  throw new Error('You must be a member of at least one team to add videos');
                }
                teamId = teams[0].id;
                alert(`No active team selected. Adding video to "${teams[0].name}".`);
              } else {
                teamId = activeTeam.id;
              }

              // Get current user
              const { data: userData, error: userError } =
                await supabase.auth.getUser();
              if (userError || !userData.user) {
                throw new Error('User not authenticated');
              }

              const { data, error } = await supabase
                .from('videos')
                .insert({
                  team_id: teamId,
                  title: title || `YouTube Video - ${videoId}`,
                  source: 'youtube',
                  video_url: videoId, // Store just the video ID
                  uploaded_by: userData.user.id,
                })
                .select()
                .single();

              if (error) throw error;

              console.log('YouTube video saved:', data);

              // Close modal and refresh videos
              setIsModalOpen(false);
              await fetchVideos();

              // Show success message (we'll use alert for now, could be replaced with toast)
              alert('YouTube video added successfully!');
            } catch (err) {
              console.error('Error saving YouTube video:', err);
              alert(`Error saving video: ${err instanceof Error ? err.message : 'Unknown error occurred'}`);
              // Keep modal open on error so user can retry
            }
          }}
        />
      </>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">
          {videos.length} {videos.length === 1 ? 'Video' : 'Videos'}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => {
              console.log('[VideoList] YouTube button clicked, opening modal');
              setIsModalOpen(true);
            }}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
            Add YouTube Video
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {videos.map((video) => (
          <div
            key={video.id}
            className="bg-white rounded-lg border overflow-hidden hover:shadow-lg transition-shadow"
          >
            <div className="aspect-video bg-gray-100 relative overflow-hidden">
              {video.source === 'youtube' ? (
                <>
                  <img
                    src={`https://img.youtube.com/vi/${video.video_url}/hqdefault.jpg`}
                    alt={video.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = `https://img.youtube.com/vi/${video.video_url}/default.jpg`;
                    }}
                  />
                  <div className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded text-xs font-semibold flex items-center gap-1">
                    <svg
                      className="w-3 h-3"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                    </svg>
                    YouTube
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-gray-400 text-4xl">🎬</div>
                </div>
              )}
              {video.access_type === 'shared' && (
                <div className="absolute bottom-2 left-2 bg-purple-600 text-white px-2 py-1 rounded text-xs font-semibold">
                  Shared from {video.owner_team_name}
                </div>
              )}
            </div>

            <div className="p-4">
              <h3 className="font-semibold text-lg mb-1 truncate">
                {video.title}
              </h3>

              <div className="text-sm text-gray-500 space-y-1">
                <div className="flex items-center gap-2">
                  {video.source === 'youtube' ? (
                    <svg
                      className="w-4 h-4 text-red-600"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                    </svg>
                  ) : (
                    <svg
                      className="w-4 h-4 text-gray-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                  )}
                  <span className="capitalize">{video.source}</span>
                </div>
                {video.file_size && (
                  <p>Size: {formatFileSize(video.file_size)}</p>
                )}
                <p>Added: {formatDate(video.created_at)}</p>
              </div>

              <div className="mt-4 flex gap-2">
                <Link
                  href={`/dashboard/videos/${video.id}`}
                  className="flex-1 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 text-center"
                >
                  View
                </Link>
                {isCoach &&
                  video.access_type === 'owned' &&
                  teams.length > 1 && (
                    <button
                      onClick={() => {
                        setSelectedVideo({ id: video.id, title: video.title });
                        setShareModalOpen(true);
                      }}
                      className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50"
                      title="Share with other teams"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m9.032 4.026a3 3 0 10-5.464 0m5.464 0a3 3 0 01-5.464 0M6.732 6.732a3 3 0 10-4.268 4.268m4.268-4.268a3 3 0 014.268 4.268m0 0a3 3 0 104.268 4.268M6.732 11a3 3 0 014.268 0"
                        />
                      </svg>
                    </button>
                  )}
                {canDeleteVideo(video) && (
                  <button
                    onClick={() => {
                      setVideoToDelete(video);
                      setDeleteModalOpen(true);
                    }}
                    className="px-3 py-1 border border-red-300 text-red-600 rounded text-sm hover:bg-red-50"
                    title="Delete video"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedVideo && (
        <ShareVideoModal
          isOpen={shareModalOpen}
          onClose={() => {
            setShareModalOpen(false);
            setSelectedVideo(null);
            // Refresh videos to show any updates
            fetchVideos();
          }}
          videoId={selectedVideo.id}
          videoTitle={selectedVideo.title}
        />
      )}

      <AddYouTubeVideoModal
        isOpen={isModalOpen}
        onClose={() => {
          console.log('[VideoList] Closing YouTube modal');
          setIsModalOpen(false);
        }}
        onAdd={async (url, videoId, title) => {
          console.log('Adding YouTube video:', url);
          console.log('Video ID:', videoId);
          console.log('Title:', title);

          try {
            // Save YouTube video to database
            const activeTeam = getActiveTeam();
            let teamId: string;
            
            if (!activeTeam) {
              // If no active team, use the first team the user belongs to
              if (teams.length === 0) {
                throw new Error('You must be a member of at least one team to add videos');
              }
              teamId = teams[0].id;
              alert(`No active team selected. Adding video to "${teams[0].name}".`);
            } else {
              teamId = activeTeam.id;
            }

            // Get current user
            const { data: userData, error: userError } =
              await supabase.auth.getUser();
            if (userError || !userData.user) {
              throw new Error('User not authenticated');
            }

            const { data, error } = await supabase
              .from('videos')
              .insert({
                team_id: teamId,
                title: title || `YouTube Video - ${videoId}`,
                source: 'youtube',
                video_url: videoId, // Store just the video ID
                uploaded_by: userData.user.id,
              })
              .select()
              .single();

            if (error) throw error;

            console.log('YouTube video saved:', data);

            // Close modal and refresh videos
            setIsModalOpen(false);
            await fetchVideos();

            // Show success message (we'll use alert for now, could be replaced with toast)
            alert('YouTube video added successfully!');
          } catch (err) {
            console.error('Error saving YouTube video:', err);
            alert(`Error saving video: ${err instanceof Error ? err.message : 'Unknown error occurred'}`);
            // Keep modal open on error so user can retry
          }
        }}
      />

      {videoToDelete && (
        <DeleteVideoModal
          isOpen={deleteModalOpen}
          onClose={() => {
            setDeleteModalOpen(false);
            setVideoToDelete(null);
          }}
          onDelete={() => {
            // Close modal first, then refresh
            console.log('[VideoList] Video deleted, closing modal and refreshing list...');
            setDeleteModalOpen(false);
            setVideoToDelete(null);
            
            // Force refresh by updating refreshKey
            setRefreshKey(prev => prev + 1);
            console.log('[VideoList] Triggered refresh via refreshKey');
          }}
          video={{
            id: videoToDelete.id,
            title: videoToDelete.title,
            source: videoToDelete.source,
            video_url: videoToDelete.video_url,
            uploaded_by: videoToDelete.uploaded_by || '',
            file_size: videoToDelete.file_size,
            team_id: videoToDelete.team_id || '',
          }}
        />
      )}
    </div>
  );
}
