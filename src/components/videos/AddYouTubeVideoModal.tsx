'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';

interface AddYouTubeVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd?: (url: string, videoId: string, title?: string) => void;
}

interface YouTubePreview {
  videoId: string;
  title?: string;
  thumbnailUrl: string;
}

// YouTube URL validation and ID extraction
function extractYouTubeVideoId(url: string): string | null {
  try {
    const urlObj = new URL(url);

    // Handle youtube.com/watch?v=VIDEO_ID
    if (
      urlObj.hostname === 'www.youtube.com' ||
      urlObj.hostname === 'youtube.com'
    ) {
      if (urlObj.pathname === '/watch') {
        return urlObj.searchParams.get('v');
      }
      // Handle youtube.com/embed/VIDEO_ID
      if (urlObj.pathname.startsWith('/embed/')) {
        return urlObj.pathname.split('/')[2];
      }
    }

    // Handle youtu.be/VIDEO_ID
    if (urlObj.hostname === 'youtu.be') {
      return urlObj.pathname.slice(1);
    }

    return null;
  } catch {
    return null;
  }
}

function isValidYouTubeUrl(url: string): boolean {
  return extractYouTubeVideoId(url) !== null;
}

export function AddYouTubeVideoModal({
  isOpen,
  onClose,
  onAdd,
}: AddYouTubeVideoModalProps) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<YouTubePreview | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  // Update preview when URL changes
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      const videoId = extractYouTubeVideoId(url);
      if (videoId) {
        setIsLoadingPreview(true);
        setError(null);

        // Set initial preview with thumbnail
        const initialPreview = {
          videoId,
          thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
          title: undefined,
        };
        setPreview(initialPreview);

        // Try to fetch video title using oEmbed API
        try {
          const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
          const response = await fetch(oembedUrl);
          if (response.ok) {
            const data = await response.json();
            setPreview((prev) => ({
              ...prev!,
              title: data.title,
            }));
          }
        } catch (err) {
          console.log('Could not fetch video title:', err);
        }

        // Try to load the thumbnail
        const img = new Image();
        img.onload = () => {
          setIsLoadingPreview(false);
        };
        img.onerror = () => {
          // Fallback to lower quality thumbnail if maxresdefault doesn't exist
          setPreview((prev) => ({
            ...prev!,
            thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
          }));
          setIsLoadingPreview(false);
        };
        img.src = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
      } else {
        setPreview(null);
        setIsLoadingPreview(false);
      }
    }, 500); // Debounce URL input

    return () => clearTimeout(timeoutId);
  }, [url]);

  if (!isOpen) {
    console.log('[AddYouTubeVideoModal] Modal is closed, not rendering');
    return null;
  }

  console.log('[AddYouTubeVideoModal] Modal is open, rendering...');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!url.trim()) {
      setError('Please enter a YouTube URL');
      return;
    }

    const videoId = extractYouTubeVideoId(url);

    if (!videoId) {
      setError(
        'Please enter a valid YouTube URL (e.g., https://www.youtube.com/watch?v=... or https://youtu.be/...)'
      );
      return;
    }

    console.log('YouTube URL validated:', url);
    console.log('Extracted video ID:', videoId);
    console.log('Video title:', preview?.title);

    onAdd?.(url, videoId, preview?.title);
  };

  const handleClose = () => {
    setUrl('');
    setError(null);
    setPreview(null);
    setIsLoadingPreview(false);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-[9998]"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Add YouTube Video</h2>
            <button
              onClick={handleClose}
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

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="youtube-url"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                YouTube URL
              </label>
              <input
                id="youtube-url"
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
              {error && (
                <div className="mt-1 text-sm text-red-600">{error}</div>
              )}
            </div>

            {/* YouTube Video Preview */}
            {preview && (
              <div className="space-y-2">
                <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
                  {isLoadingPreview ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-gray-400">Loading preview...</div>
                    </div>
                  ) : (
                    <>
                      <img
                        src={preview.thumbnailUrl}
                        alt="YouTube video thumbnail"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback to default thumbnail if both fail
                          const target = e.target as HTMLImageElement;
                          target.src = `https://img.youtube.com/vi/${preview.videoId}/default.jpg`;
                        }}
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                        <div className="bg-red-600 rounded-full p-3">
                          <svg
                            className="w-6 h-6 text-white"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      </div>
                    </>
                  )}
                </div>
                {preview.title && (
                  <h3 className="font-medium text-gray-900 line-clamp-2">
                    {preview.title}
                  </h3>
                )}
                <p className="text-sm text-gray-600">
                  Video ID: {preview.videoId}
                </p>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={handleClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                Add Video
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
