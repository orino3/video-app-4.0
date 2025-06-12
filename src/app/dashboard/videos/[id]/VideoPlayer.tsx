'use client';

// Try the fixed version first
import { UnifiedVideoPlayer } from '@/components/player/UnifiedVideoPlayerFixed';
import { useEffect } from 'react';

interface VideoPlayerProps {
  video: {
    id: string;
    source: string;
    video_url: string;
    storage_path?: string;
    title: string;
  };
}

export function VideoPlayer({ video }: VideoPlayerProps) {
  useEffect(() => {
    console.log('VideoPlayer mounted with video:', video);
  }, [video]);

  return (
    <div className="mb-6">
      <UnifiedVideoPlayer
        video={video}
        onReady={() => console.log('Video ready')}
        onPlay={() => console.log('Video playing')}
        onPause={() => console.log('Video paused')}
        onTimeUpdate={(time) => console.log('Time update:', time)}
        onEnded={() => console.log('Video ended')}
        onError={(error) => console.error('Video error:', error)}
      />
    </div>
  );
}
