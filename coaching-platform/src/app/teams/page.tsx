'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import TeamManagement from '@/components/teams/TeamManagement';
import { PlayerManagement } from '@/components/teams/PlayerManagement';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/stores/authStore';
import { createClient } from '@/lib/supabase/client';

function TeamsPageContent() {
  const [activeTab, setActiveTab] = useState<'members' | 'players'>('members');
  const [isTeamOwner, setIsTeamOwner] = useState(false);
  const { getActiveTeam } = useAuthStore();
  const { isCoach, user } = useAuth();
  const activeTeam = getActiveTeam();
  const supabase = createClient();

  useEffect(() => {
    const checkTeamOwnership = async () => {
      if (!activeTeam || !user) return;

      try {
        const { data: teamData, error } = await supabase
          .from('teams')
          .select('owner_id')
          .eq('id', activeTeam.id)
          .single();

        if (error) throw error;

        if (!teamData?.owner_id) {
          const { data: firstCoach, error: coachError } = await supabase
            .from('team_members')
            .select('user_id')
            .eq('team_id', activeTeam.id)
            .eq('role', 'coach')
            .order('created_at', { ascending: true })
            .limit(1)
            .single();

          if (!coachError && firstCoach) {
            setIsTeamOwner(firstCoach.user_id === user.id);
          }
        } else {
          setIsTeamOwner(teamData.owner_id === user.id);
        }
      } catch (err) {
        console.error('Error checking team ownership:', err);
        setIsTeamOwner(false);
      }
    };
    
    if (activeTeam && user) {
      checkTeamOwnership();
    }
  }, [activeTeam, user, supabase]);

  if (!activeTeam) {
    return <TeamManagement />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header with Tabs */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-3xl font-bold text-gray-900">
              {activeTeam.name}
            </h1>
            <p className="text-gray-600">
              {activeTeam.sport} • {activeTeam.organization?.name}
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="border-t border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('members')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'members'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Team Members & Invites
              </button>
              {isCoach && (
                <button
                  onClick={() => setActiveTab('players')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'players'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Player Profiles
                </button>
              )}
            </nav>
          </div>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'members' ? (
        <TeamManagement />
      ) : (
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <PlayerManagement
              teamId={activeTeam.id}
              teamName={activeTeam.name}
              isTeamOwner={isTeamOwner}
            />
          </div>
        </main>
      )}
    </div>
  );
}

export default function TeamsPage() {
  return (
    <ProtectedRoute requireAuth={true}>
      <TeamsPageContent />
    </ProtectedRoute>
  );
}
