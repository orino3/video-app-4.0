'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface CreateTeamStepProps {
  onNext: (teamData: { name: string; sport: string }) => void;
  isLoading: boolean;
}

const SPORT_OPTIONS = [
  { value: 'soccer', label: 'Soccer', icon: '⚽' },
  { value: 'basketball', label: 'Basketball', icon: '🏀' },
  { value: 'football', label: 'American Football', icon: '🏈' },
  { value: 'volleyball', label: 'Volleyball', icon: '🏐' },
  { value: 'baseball', label: 'Baseball', icon: '⚾' },
  { value: 'hockey', label: 'Hockey', icon: '🏒' },
  { value: 'tennis', label: 'Tennis', icon: '🎾' },
  { value: 'other', label: 'Other', icon: '🏆' },
];

export function CreateTeamStep({ onNext, isLoading }: CreateTeamStepProps) {
  const [teamName, setTeamName] = useState('');
  const [selectedSport, setSelectedSport] = useState('');
  const [errors, setErrors] = useState<{ name?: string; sport?: string }>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: { name?: string; sport?: string } = {};

    if (!teamName.trim()) {
      newErrors.name = 'Team name is required';
    }

    if (!selectedSport) {
      newErrors.sport = 'Please select a sport';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onNext({ name: teamName.trim(), sport: selectedSport });
  };

  return (
    <div>
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Create Your Team
        </h2>
        <p className="text-gray-600">Let's set up your team profile</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="team-name"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Team Name
          </label>
          <Input
            id="team-name"
            type="text"
            value={teamName}
            onChange={(e) => {
              setTeamName(e.target.value);
              if (errors.name) setErrors({ ...errors, name: undefined });
            }}
            placeholder="e.g., Lincoln High School Varsity"
            className={errors.name ? 'border-red-500' : ''}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sport
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {SPORT_OPTIONS.map((sport) => (
              <button
                key={sport.value}
                type="button"
                onClick={() => {
                  setSelectedSport(sport.value);
                  if (errors.sport) setErrors({ ...errors, sport: undefined });
                }}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedSport === sport.value
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-2xl mb-1">{sport.icon}</div>
                <div className="text-sm font-medium text-gray-900">
                  {sport.label}
                </div>
              </button>
            ))}
          </div>
          {errors.sport && (
            <p className="mt-1 text-sm text-red-600">{errors.sport}</p>
          )}
        </div>

        <div className="pt-4">
          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? 'Creating Team...' : 'Create Team'}
          </Button>
        </div>
      </form>
    </div>
  );
}
