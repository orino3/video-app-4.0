'use client';

import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';

interface WelcomeStepProps {
  onNext: () => void;
}

export function WelcomeStep({ onNext }: WelcomeStepProps) {
  const { user } = useAuth();

  return (
    <div className="text-center">
      <div className="mb-6">
        <svg
          className="w-20 h-20 mx-auto text-blue-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>

      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        Welcome to Video Coaching Platform!
      </h1>

      <p className="text-lg text-gray-600 mb-8">
        Hi {user?.full_name || 'Coach'}, we're excited to have you here. Let's
        get you set up with your team in just a few minutes.
      </p>

      <div className="space-y-4 text-left max-w-md mx-auto mb-8">
        <div className="flex items-start">
          <svg
            className="w-6 h-6 text-green-500 mt-0.5 mr-3 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <div>
            <h3 className="font-medium text-gray-900">Create Your Team</h3>
            <p className="text-sm text-gray-600">
              Set up your team profile and organization
            </p>
          </div>
        </div>

        <div className="flex items-start">
          <svg
            className="w-6 h-6 text-green-500 mt-0.5 mr-3 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <div>
            <h3 className="font-medium text-gray-900">Invite Your Players</h3>
            <p className="text-sm text-gray-600">
              Add your team members and assign roles
            </p>
          </div>
        </div>

        <div className="flex items-start">
          <svg
            className="w-6 h-6 text-green-500 mt-0.5 mr-3 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <div>
            <h3 className="font-medium text-gray-900">Learn Key Features</h3>
            <p className="text-sm text-gray-600">
              Quick overview of video analysis tools
            </p>
          </div>
        </div>
      </div>

      <Button onClick={onNext} size="lg" className="w-full sm:w-auto">
        Get Started
      </Button>
    </div>
  );
}
