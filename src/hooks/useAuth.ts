import { useAuthStore } from '@/stores/authStore';

export function useAuth() {
  const user = useAuthStore((state) => state.user);
  const teams = useAuthStore((state) => state.teams);
  const loading = useAuthStore((state) => state.loading);
  const initialized = useAuthStore((state) => state.initialized);
  const signOut = useAuthStore((state) => state.signOut);
  const refreshUserTeams = useAuthStore((state) => state.refreshUserTeams);
  const activeTeamId = useAuthStore((state) => state.activeTeamId);
  const setActiveTeam = useAuthStore((state) => state.setActiveTeam);
  const getActiveTeam = useAuthStore((state) => state.getActiveTeam);

  const isAuthenticated = !!user;
  const isCoach = teams.some((team) => ['coach', 'admin'].includes(team.role));
  const isPlayer = teams.some((team) => team.role === 'player');
  const isAnalyst = teams.some((team) => team.role === 'analyst');

  // Get user's role for a specific team
  const getRoleForTeam = (teamId: string) => {
    const team = teams.find((t) => t.id === teamId);
    return team?.role;
  };

  // Check if user has permission for a team
  const hasTeamAccess = (teamId: string) => {
    return teams.some((t) => t.id === teamId);
  };

  // Check if user can manage a team (coach or admin)
  const canManageTeam = (teamId: string) => {
    const role = getRoleForTeam(teamId);
    return role && ['coach', 'admin'].includes(role);
  };

  return {
    user,
    teams,
    loading,
    initialized,
    isAuthenticated,
    isCoach,
    isPlayer,
    isAnalyst,
    signOut,
    refreshUserTeams,
    getRoleForTeam,
    hasTeamAccess,
    canManageTeam,
    activeTeamId,
    setActiveTeam,
    getActiveTeam,
  };
}
