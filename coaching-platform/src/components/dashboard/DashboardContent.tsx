'use client';

import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CreateTeamModal } from '@/components/teams/CreateTeamModal';

export default function DashboardContent() {
  const { user, teams, isCoach, isPlayer, refreshUserTeams } = useAuth();
  const { setActiveTeam, activeTeamId, getActiveTeam } = useAuthStore();
  const router = useRouter();
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);

  // Check if coach needs onboarding
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const testOnboarding = urlParams.get('test-onboarding');

    if (testOnboarding === 'true') {
      // Only redirect if explicitly testing onboarding
      router.push('/onboarding');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="mt-2 text-gray-600">
              Welcome back, {user?.full_name || user?.email}
            </p>
          </div>
          {/* User Info Card */}
          <div className="bg-white overflow-hidden shadow rounded-lg mb-6">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Your Profile
              </h3>
              <div className="mt-2 max-w-xl text-sm text-gray-500">
                <p>Email: {user?.email}</p>
                <p>
                  Role: {isCoach ? 'Coach' : isPlayer ? 'Player' : 'Analyst'}
                </p>
              </div>
            </div>
          </div>

          {/* Teams */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Your Teams
              </h3>
              {teams.length > 0 ? (
                <div className="mt-4 space-y-4">
                  {teams.map((team) => (
                    <div
                      key={team.id}
                      className={`border rounded-lg p-4 transition-all ${
                        team.id === activeTeamId
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-md font-medium text-gray-900 flex items-center gap-2">
                            {team.name}
                            {team.id === activeTeamId && (
                              <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded">
                                Active
                              </span>
                            )}
                          </h4>
                          <p className="text-sm text-gray-500">
                            Sport: {team.sport}
                          </p>
                          <p className="text-sm text-gray-500">
                            Your role: {team.role}
                          </p>
                          {team.jersey_number && (
                            <p className="text-sm text-gray-500">
                              Jersey: #{team.jersey_number}
                            </p>
                          )}
                        </div>
                        <div className="space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setActiveTeam(team.id);
                              router.push('/dashboard/videos');
                            }}
                          >
                            View Videos
                          </Button>
                          {['coach', 'admin'].includes(team.role) && (
                            <Button
                              size="sm"
                              onClick={() => {
                                setActiveTeam(team.id);
                                router.push('/teams');
                              }}
                            >
                              Manage Team
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-4 text-center py-8">
                  <p className="text-gray-500">
                    You're not part of any teams yet.
                  </p>
                  <Button className="mt-4">Join a Team</Button>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          {isCoach && (
            <div className="mt-6 bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Quick Actions
                </h3>
                <div className="mt-4 space-y-3">
                  {/* Create Team Action */}
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-blue-900">Create New Team</h4>
                      <p className="text-sm text-blue-700">Start a new team and invite players</p>
                    </div>
                    <Button 
                      onClick={() => setShowCreateTeamModal(true)}
                      size="sm"
                    >
                      Create Team
                    </Button>
                  </div>

                  {/* Team-specific Actions */}
                  {activeTeamId && (
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div>
                        <h4 className="font-medium text-green-900">
                          {getActiveTeam()?.name} Actions
                        </h4>
                        <p className="text-sm text-green-700">
                          Upload videos and invite players to your active team
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            router.push('/dashboard/upload');
                          }}
                        >
                          Upload Video
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            router.push('/teams');
                          }}
                        >
                          Invite Players
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* No Active Team State */}
                  {!activeTeamId && teams.length > 0 && (
                    <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                      <div>
                        <h4 className="font-medium text-yellow-900">Select Active Team</h4>
                        <p className="text-sm text-yellow-700">
                          Choose a team from your list above to upload videos and manage players
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => router.push('/teams/all')}
                      >
                        View All Teams
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Create Team Modal */}
      <CreateTeamModal
        isOpen={showCreateTeamModal}
        onClose={() => setShowCreateTeamModal(false)}
        onSuccess={async () => {
          await refreshUserTeams();
          setShowCreateTeamModal(false);
        }}
        organizationId={null}
      />
    </div>
  );
}
