'use client';

import { useEffect, useRef, useState } from 'react';
import { IVideoPlayer } from '@/types/VideoPlayer';
import { HTML5PlayerAdapter } from '@/lib/video/adapters/HTML5PlayerAdapter';
import { YouTubePlayerAdapter } from '@/lib/video/adapters/YouTubePlayerAdapter';
import { CanvasOverlay } from './CanvasOverlay';

interface UnifiedVideoPlayerProps {
  video: {
    id: string;
    source: string;
    video_url: string;
    storage_path?: string;
  };
  onReady?: () => void;
  onPlay?: () => void;
  onPause?: () => void;
  onTimeUpdate?: (time: number) => void;
  onEnded?: () => void;
  onError?: (error: string) => void;
}

export function UnifiedVideoPlayer({
  video,
  onReady,
  onPlay,
  onPause,
  onTimeUpdate,
  onEnded,
  onError,
}: UnifiedVideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<IVideoPlayer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isDrawingMode, setIsDrawingMode] = useState(false);

  useEffect(() => {
    let player: IVideoPlayer | null = null;

    const initializePlayer = async () => {
      if (!containerRef.current) return;

      try {
        console.log('UnifiedVideoPlayer: Starting initialization');
        setIsLoading(true);
        setError(null);

        // Create appropriate adapter based on video source
        switch (video.source) {
          case 'youtube':
            player = new YouTubePlayerAdapter(video.video_url);
            break;
          case 'upload':
            player = new HTML5PlayerAdapter(
              video.video_url,
              video.storage_path
            );
            break;
          default:
            throw new Error(`Unknown video source: ${video.source}`);
        }

        // Set up event handlers
        player.on('onReady', () => {
          console.log('UnifiedVideoPlayer: onReady event received');
          setIsLoading(false);
          setDuration(player!.getDuration());
          onReady?.();
        });

        player.on('onPlay', () => {
          setIsPlaying(true);
          onPlay?.();
        });

        player.on('onPause', () => {
          setIsPlaying(false);
          onPause?.();
        });

        player.on('onTimeUpdate', (time) => {
          setCurrentTime(time);
          onTimeUpdate?.(time);
        });

        player.on('onEnded', () => {
          setIsPlaying(false);
          onEnded?.();
        });

        player.on('onError', (error) => {
          setError(error);
          setIsLoading(false);
          onError?.(error);
        });

        player.on('onVolumeChange', (volume, muted) => {
          setVolume(volume);
          setIsMuted(muted);
        });

        // Initialize player
        await player.initialize(containerRef.current);
        playerRef.current = player;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to initialize player';
        setError(message);
        setIsLoading(false);
        onError?.(message);
      }
    };

    initializePlayer();

    // Cleanup
    return () => {
      if (player) {
        player.destroy();
      }
    };
  }, [video]);

  const handlePlayPause = async () => {
    if (!playerRef.current) return;

    try {
      if (isPlaying) {
        playerRef.current.pause();
      } else {
        await playerRef.current.play();
      }
    } catch (err) {
      console.error('Playback error:', err);
    }
  };

  const handleSeek = (time: number) => {
    if (!playerRef.current) return;
    playerRef.current.seek(time);
  };

  const handleVolumeChange = (newVolume: number) => {
    if (!playerRef.current) return;
    playerRef.current.setVolume(newVolume);
  };

  const handleMuteToggle = () => {
    if (!playerRef.current) return;

    if (isMuted) {
      playerRef.current.unmute();
    } else {
      playerRef.current.mute();
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative bg-black rounded-lg overflow-hidden">
      {/* Video Container */}
      <div
        ref={containerRef}
        className="relative w-full aspect-video"
        style={{ minHeight: '200px' }}
      >
        {isLoading && !error && (
          <div
            className="absolute inset-0 flex items-center justify-center bg-gray-900"
            style={{ zIndex: 20 }}
          >
            <div className="text-white">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p>Loading video...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-30">
            <div className="text-center">
              <p className="text-red-500 mb-2">Error loading video</p>
              <p className="text-white text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Canvas Overlay for Annotations */}
        <CanvasOverlay
          isDrawingMode={isDrawingMode}
          onDraw={(drawingData) => {
            console.log('Drawing data:', drawingData);
          }}
        />
      </div>

      {/* Custom Controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
        <div className="flex items-center gap-4">
          {/* Play/Pause Button */}
          <button
            onClick={handlePlayPause}
            className="text-white hover:text-gray-300 transition-colors"
            disabled={isLoading || !!error}
          >
            {isPlaying ? (
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            ) : (
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          {/* Time Display */}
          <div className="text-white text-sm">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>

          {/* Progress Bar */}
          <div className="flex-1">
            <input
              type="range"
              min="0"
              max={duration || 100}
              value={currentTime}
              onChange={(e) => handleSeek(parseFloat(e.target.value))}
              className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
              disabled={isLoading || !!error}
            />
          </div>

          {/* Volume Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleMuteToggle}
              className="text-white hover:text-gray-300 transition-colors"
              disabled={isLoading || !!error}
            >
              {isMuted ? (
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                </svg>
              ) : (
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                </svg>
              )}
            </button>

            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
              disabled={isLoading || !!error}
            />
          </div>

          {/* Drawing Mode Toggle */}
          <button
            onClick={() => setIsDrawingMode(!isDrawingMode)}
            className={`ml-4 px-3 py-1 rounded transition-colors text-sm ${
              isDrawingMode
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-gray-600 text-white hover:bg-gray-700'
            }`}
            disabled={isLoading || !!error}
          >
            {isDrawingMode ? (
              <span className="flex items-center gap-1">
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
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  />
                </svg>
                Drawing On
              </span>
            ) : (
              <span className="flex items-center gap-1">
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
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  />
                </svg>
                Draw
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
