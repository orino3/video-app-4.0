'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { VideoList } from '@/components/videos/VideoList';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

function VideosPageContent() {
  const { getActiveTeam } = useAuthStore();
  const activeTeam = getActiveTeam();

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {activeTeam ? `${activeTeam.name} Videos` : 'Team Videos'}
            </h1>
            {activeTeam && (
              <p className="text-gray-600 mt-1">
                {activeTeam.sport} • Manage and analyze your team&apos;s videos
              </p>
            )}
          </div>
          {activeTeam && (
            <div className="flex gap-2">
              <Link href="/dashboard/upload">
                <Button className="flex items-center gap-2">
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
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  Upload Video
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* No Active Team Warning */}
        {!activeTeam && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <svg
                className="w-5 h-5 text-blue-600 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <h3 className="text-blue-800 font-medium">Viewing All Teams</h3>
                <p className="text-blue-700 text-sm">Showing videos from all your teams. Select an active team from the dashboard to filter videos and enable uploading.</p>
              </div>
            </div>
          </div>
        )}

        <VideoList />
      </div>
    </div>
  );
}

export default function VideosPage() {
  return (
    <ProtectedRoute>
      <VideosPageContent />
    </ProtectedRoute>
  );
}
