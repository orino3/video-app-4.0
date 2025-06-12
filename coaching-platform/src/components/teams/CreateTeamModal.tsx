'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface CreateTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  organizationId?: string | null;
}

const SPORTS = [
  'Soccer',
  'Basketball',
  'Baseball',
  'Football',
  'Hockey',
  'Volleyball',
  'Tennis',
  'Golf',
  'Swimming',
  'Track & Field',
  'Other',
];

export function CreateTeamModal({
  isOpen,
  onClose,
  onSuccess,
  organizationId,
}: CreateTeamModalProps) {
  const [teamName, setTeamName] = useState('');
  const [sport, setSport] = useState('');
  const [customSport, setCustomSport] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [createNewOrg, setCreateNewOrg] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuth();
  const supabase = createClient();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Create team form submitted');
    console.log('Event type:', e.type);
    console.log('Event target:', e.target);

    if (!user) {
      console.error('No user found');
      setError('You must be logged in to create a team');
      return;
    }

    console.log('Form values:', {
      teamName,
      sport,
      organizationId,
      createNewOrg,
      organizationName,
    });

    setLoading(true);
    setError(null);

    try {
      let finalOrgId = organizationId;

      // Create new organization if requested
      if (createNewOrg && organizationName.trim()) {
        const { data: newOrg, error: orgError } = await supabase
          .from('organizations')
          .insert({
            name: organizationName.trim(),
          })
          .select()
          .single();

        if (orgError) throw orgError;
        finalOrgId = newOrg.id;
      } else if (!finalOrgId) {
        // If no organization is selected, create a default one for the user
        const { data: newOrg, error: orgError } = await supabase
          .from('organizations')
          .insert({
            name: `${user.email}'s Organization`,
          })
          .select()
          .single();

        if (orgError) throw orgError;
        finalOrgId = newOrg.id;
      }

      // Create the team
      const finalSport = sport === 'Other' ? customSport : sport;
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .insert({
          name: teamName.trim(),
          sport: finalSport,
          organization_id: finalOrgId,
        })
        .select()
        .single();

      if (teamError) {
        throw teamError;
      }

      // Add the current user as a coach
      const { error: memberError } = await supabase
        .from('team_members')
        .insert({
          team_id: team.id,
          user_id: user.id,
          role: 'coach',
        });

      if (memberError) {
        throw memberError;
      }

      // Success
      onSuccess();
      onClose();

      // Reset form
      setTeamName('');
      setSport('');
      setCustomSport('');
      setOrganizationName('');
      setCreateNewOrg(false);
    } catch (err: any) {
      console.error('Error creating team:', err);
      // Log more details about the error
      alert(`Error creating team: ${err.message || 'Unknown error'}`);
      console.log('Full error:', err);
      if (err && typeof err === 'object' && 'details' in err) {
        console.error('Error details:', err.details);
      }
      if (err && typeof err === 'object' && 'hint' in err) {
        console.error('Error hint:', err.hint);
      }
      setError(err instanceof Error ? err.message : 'Failed to create team');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Create New Team</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
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
          {/* Team Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Team Name
            </label>
            <Input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="e.g., Eagles U16"
              required
            />
          </div>

          {/* Sport */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sport
            </label>
            <select
              value={sport}
              onChange={(e) => setSport(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select a sport</option>
              {SPORTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            {sport === 'Other' && (
              <Input
                type="text"
                value={customSport}
                onChange={(e) => setCustomSport(e.target.value)}
                placeholder="Enter sport name"
                className="mt-2"
                required
              />
            )}
          </div>

          {/* Organization */}
          {!organizationId && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Organization/Club (Optional)
              </label>

              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={!createNewOrg}
                    onChange={() => setCreateNewOrg(false)}
                    className="mr-2"
                  />
                  <span className="text-sm">
                    No organization (Independent team)
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={createNewOrg}
                    onChange={() => setCreateNewOrg(true)}
                    className="mr-2"
                  />
                  <span className="text-sm">Create new organization</span>
                </label>

                {createNewOrg && (
                  <Input
                    type="text"
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    placeholder="Organization name"
                    className="ml-6"
                    required={createNewOrg}
                  />
                )}
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                loading ||
                !teamName ||
                !sport ||
                (sport === 'Other' && !customSport)
              }
              onClick={(e) => {
                console.log('Button clicked directly');
                console.log('Button type:', e.currentTarget.type);
                console.log('Form:', e.currentTarget.form);
              }}
            >
              {loading ? 'Creating...' : 'Create Team'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
