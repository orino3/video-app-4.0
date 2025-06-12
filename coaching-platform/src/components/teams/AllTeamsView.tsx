'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/Button';
import { CreateTeamModal } from './CreateTeamModal';
import Link from 'next/link';

interface TeamWithRole {
  id: string;
  name: string;
  sport: string;
  organization_id: string | null;
  organization?: {
    id: string;
    name: string;
  } | null;
  role: string;
  member_count?: number;
}

export function AllTeamsView() {
  const { user, teams } = useAuth();
  const { setActiveTeam, activeTeamId, refreshUserTeams } = useAuthStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);

  // Group teams by organization
  const groupedTeams = teams.reduce(
    (acc, team) => {
      const orgKey = team.organization_id || 'independent';
      if (!acc[orgKey]) {
        acc[orgKey] = {
          organization: team.organization || null,
          teams: [],
        };
      }
      acc[orgKey].teams.push(team);
      return acc;
    },
    {} as Record<string, { organization: any | null; teams: typeof teams }>
  );

  const handleCreateTeam = (orgId?: string) => {
    setSelectedOrgId(orgId || null);
    setShowCreateModal(true);
  };

  const handleTeamCreated = async () => {
    await refreshUserTeams();
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'coach':
        return 'bg-blue-100 text-blue-800';
      case 'player':
        return 'bg-green-100 text-green-800';
      case 'analyst':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Teams</h2>
          <p className="text-gray-600">
            Manage your teams across all organizations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/teams/recover">
            <Button variant="outline" size="sm">
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Recover Deleted Teams
            </Button>
          </Link>
          <Button onClick={() => handleCreateTeam()}>
            <svg
              className="w-4 h-4 mr-2"
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
            Create Team
          </Button>
        </div>
      </div>

      {/* Teams grouped by organization */}
      <div className="space-y-8">
        {/* Independent teams (no organization) */}
        {groupedTeams.independent && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Independent Teams
              </h3>
              <button
                onClick={() => handleCreateTeam()}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Add team
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {groupedTeams.independent.teams.map((team) => (
                <TeamCard
                  key={team.id}
                  team={team}
                  isActive={team.id === activeTeamId}
                  onSetActive={() => setActiveTeam(team.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Teams grouped by organization */}
        {Object.entries(groupedTeams)
          .filter(([key]) => key !== 'independent')
          .map(([orgId, { organization, teams }]) => (
            <div key={orgId}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {organization?.name || 'Unknown Organization'}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {teams.length} {teams.length === 1 ? 'team' : 'teams'}
                  </p>
                </div>
                <button
                  onClick={() => handleCreateTeam(orgId)}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Add team
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {teams.map((team) => (
                  <TeamCard
                    key={team.id}
                    team={team}
                    isActive={team.id === activeTeamId}
                    onSetActive={() => setActiveTeam(team.id)}
                  />
                ))}
              </div>
            </div>
          ))}
      </div>

      {/* Empty state */}
      {teams.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            No teams yet
          </h3>
          <p className="mt-2 text-sm text-gray-600">
            Create your first team to start organizing your coaching
          </p>
          <Button onClick={() => handleCreateTeam()} className="mt-4">
            Create Team
          </Button>
        </div>
      )}

      {/* Create Team Modal */}
      <CreateTeamModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setSelectedOrgId(null);
        }}
        onSuccess={handleTeamCreated}
        organizationId={selectedOrgId}
      />
    </div>
  );
}

// Team Card Component
function TeamCard({
  team,
  isActive,
  onSetActive,
}: {
  team: any;
  isActive: boolean;
  onSetActive: () => void;
}) {
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'coach':
        return 'bg-blue-100 text-blue-800';
      case 'player':
        return 'bg-green-100 text-green-800';
      case 'analyst':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div
      className={`bg-white rounded-lg border p-4 transition-all ${
        isActive
          ? 'border-blue-500 shadow-md'
          : 'border-gray-200 hover:shadow-md'
      }`}
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <h4 className="font-semibold text-gray-900">{team.name}</h4>
          <p className="text-sm text-gray-600">{team.sport}</p>
        </div>
        {isActive && (
          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
            Active
          </span>
        )}
      </div>

      <div className="flex items-center justify-between mb-4">
        <span
          className={`text-xs px-2 py-1 rounded-full ${getRoleBadgeColor(team.role)}`}
        >
          {team.role}
        </span>
        {team.jersey_number && (
          <span className="text-sm text-gray-600">#{team.jersey_number}</span>
        )}
      </div>

      <div className="flex gap-2">
        {!isActive && (
          <Button
            size="sm"
            variant="outline"
            onClick={onSetActive}
            className="flex-1"
          >
            Set Active
          </Button>
        )}
        <Link
          href={`/teams/${team.id}`}
          className={`flex-1 text-center px-3 py-1.5 text-sm rounded-md transition-colors ${
            isActive
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Manage
        </Link>
      </div>
    </div>
  );
}
