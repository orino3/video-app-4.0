import { notFound } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { createClient } from '@/lib/supabase/server';
import { VideoPlayer } from './VideoPlayer';

interface VideoPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function VideoPage({ params }: VideoPageProps) {
  const supabase = await createClient();
  const { id } = await params;

  // Fetch video data
  const { data: video, error } = await supabase
    .from('videos')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !video) {
    notFound();
  }

  return (
    <ProtectedRoute>
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Video Player Container */}
          <VideoPlayer video={video} />

          {/* Video Info */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h1 className="text-2xl font-bold mb-4">{video.title}</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Source:</span>
                <span className="ml-2 font-medium capitalize">
                  {video.source}
                </span>
              </div>

              <div>
                <span className="text-gray-500">Added:</span>
                <span className="ml-2 font-medium">
                  {new Date(video.created_at).toLocaleString()}
                </span>
              </div>

              {video.duration && (
                <div>
                  <span className="text-gray-500">Duration:</span>
                  <span className="ml-2 font-medium">
                    {Math.floor(video.duration / 60)}:
                    {String(video.duration % 60).padStart(2, '0')}
                  </span>
                </div>
              )}
            </div>

            {/* Debug Info */}
            <div className="mt-6 p-4 bg-gray-50 rounded text-sm">
              <p className="font-semibold mb-2">Debug Info:</p>
              <p>Video ID: {video.id}</p>
              <p>Video URL: {video.video_url}</p>
              <p>Team ID: {video.team_id}</p>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
