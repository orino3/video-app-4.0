export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: 'coach' | 'player' | 'analyst' | 'admin';
  jersey_number?: string;
  created_at: string;
  updated_at: string;
}

export interface Team {
  id: string;
  organization_id: string | null;
  name: string;
  sport: string;
  created_at: string;
  updated_at: string;
  organization?: Organization | null;
}

export interface Organization {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface AuthState {
  user: User | null;
  teams: (Team & {
    role: string;
    jersey_number?: string;
    organization?: Organization | null;
  })[];
  loading: boolean;
  initialized: boolean;
}

export interface SignupData {
  email: string;
  password: string;
  full_name: string;
  role: 'coach' | 'player' | 'analyst';
  team_invitation_code?: string;
}

export interface LoginData {
  email: string;
  password: string;
}
