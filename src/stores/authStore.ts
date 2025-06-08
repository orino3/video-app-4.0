import { create } from 'zustand';
import { createClient } from '@/lib/supabase/client';
import type { AuthState, User, Team } from '@/types/auth';

interface AuthActions {
  initialize: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshUserTeams: () => Promise<void>;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setActiveTeam: (teamId: string) => void;
  getActiveTeam: () => Team | null;
}

interface ExtendedAuthState extends AuthState {
  activeTeamId: string | null;
}

export const useAuthStore = create<ExtendedAuthState & AuthActions>(
  (set, get) => ({
    user: null,
    teams: [],
    loading: true,
    initialized: false,
    activeTeamId: null,

    initialize: async () => {
      const supabase = createClient();

      try {
        // Get initial session
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          // Get user profile
          const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profile) {
            set({ user: profile });
            await get().refreshUserTeams();
          }
        }

        // Listen to auth changes
        supabase.auth.onAuthStateChange(async (event, session) => {
          if (event === 'SIGNED_IN' && session?.user) {
            const { data: profile } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (profile) {
              set({ user: profile });
              await get().refreshUserTeams();
            }
          } else if (event === 'SIGNED_OUT') {
            set({ user: null, teams: [] });
          }
        });
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        set({ loading: false, initialized: true });
      }
    },

    refreshUserTeams: async () => {
      const { user } = get();
      if (!user) return;

      const supabase = createClient();

      try {
        const { data: teamMembers } = await supabase
          .from('team_members')
          .select(
            `
          role,
          jersey_number,
          teams:team_id (
            id,
            name,
            sport,
            organization_id,
            organizations:organization_id (
              id,
              name
            )
          )
        `
          )
          .eq('user_id', user.id);

        if (teamMembers) {
          const teams = teamMembers.map((tm: any) => ({
            ...tm.teams,
            role: tm.role,
            jersey_number: tm.jersey_number,
            organization: tm.teams.organizations,
          }));

          set({ teams });

          // Load active team from localStorage or set first team
          const state = get();
          const savedActiveTeamId = localStorage.getItem('activeTeamId');

          if (
            savedActiveTeamId &&
            teams.some((t) => t.id === savedActiveTeamId)
          ) {
            set({ activeTeamId: savedActiveTeamId });
          } else if (!state.activeTeamId && teams.length > 0) {
            set({ activeTeamId: teams[0].id });
            localStorage.setItem('activeTeamId', teams[0].id);
          }
        }
      } catch (error) {
        console.error('Error fetching user teams:', error);
      }
    },

    signOut: async () => {
      const supabase = createClient();
      await supabase.auth.signOut();
      set({ user: null, teams: [], activeTeamId: null });
    },

    setUser: (user) => set({ user }),
    setLoading: (loading) => set({ loading }),

    setActiveTeam: (teamId) => {
      const { teams } = get();
      const teamExists = teams.some((team) => team.id === teamId);
      if (teamExists) {
        set({ activeTeamId: teamId });
        // Persist to localStorage for next session
        localStorage.setItem('activeTeamId', teamId);
      }
    },

    getActiveTeam: () => {
      const { teams, activeTeamId } = get();
      if (!activeTeamId) return null;
      return teams.find((team) => team.id === activeTeamId) || null;
    },
  })
);
