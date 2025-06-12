'use client';

import { Button } from '@/components/ui/Button';

interface FeatureOverviewStepProps {
  onComplete: () => void;
}

export function FeatureOverviewStep({ onComplete }: FeatureOverviewStepProps) {
  const features = [
    {
      title: 'Upload & Analyze Videos',
      description: 'Upload game footage or link YouTube videos for analysis',
      icon: (
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
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
      ),
      demo: '/dashboard/upload',
    },
    {
      title: 'Create Coaching Events',
      description:
        'Add annotations with drawings, notes, loops, and player mentions',
      icon: (
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
            d="M12 4v16m8-8H4"
          />
        </svg>
      ),
      demo: '/dashboard/videos',
    },
    {
      title: 'Quick Actions',
      description:
        'Use Quick Draw, Quick Note, and Quick Loop for fast annotations',
      icon: (
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
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      ),
      tips: [
        'Draw button for instant drawing',
        'Note for quick text',
        'Loop for 5-second replays',
      ],
    },
    {
      title: 'Team Collaboration',
      description: 'Share videos with players and track who views what',
      icon: (
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
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      ),
      demo: '/teams',
    },
  ];

  return (
    <div>
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          You're All Set! 🎉
        </h2>
        <p className="text-gray-600">
          Here's a quick overview of what you can do
        </p>
      </div>

      <div className="space-y-4 mb-8">
        {features.map((feature, index) => (
          <div
            key={index}
            className="flex items-start p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 mr-4">
              {feature.icon}
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-gray-900 mb-1">
                {feature.title}
              </h3>
              <p className="text-sm text-gray-600">{feature.description}</p>
              {feature.tips && (
                <ul className="mt-2 space-y-1">
                  {feature.tips.map((tip, tipIndex) => (
                    <li
                      key={tipIndex}
                      className="text-sm text-gray-500 flex items-center"
                    >
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2" />
                      {tip}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <svg
            className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          <div>
            <p className="text-sm font-medium text-blue-900 mb-1">
              Pro Tip: Try a Sample Video!
            </p>
            <p className="text-sm text-blue-800">
              We recommend uploading a short practice video first to explore all
              the annotation features. You can always delete it later.
            </p>
          </div>
        </div>
      </div>

      <Button size="lg" onClick={onComplete} className="w-full">
        Go to Dashboard
      </Button>
    </div>
  );
}
