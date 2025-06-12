'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { SignupData } from '@/types/auth';

const SPORTS_LIST = [
  'water polo',
  'swimming',
  'basketball',
  'soccer',
  'volleyball',
  'baseball',
  'tennis',
  'rugby',
];

export default function SignupForm() {
  const [formData, setFormData] = useState<SignupData>({
    email: '',
    password: '',
    full_name: '',
    role: 'player',
    team_invitation_code: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'signup' | 'team-setup'>('signup');
  const [invitation, setInvitation] = useState<any>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get('invite');
  const supabase = createClient();

  useEffect(() => {
    if (inviteToken) {
      fetchInvitation();
    }
  }, [inviteToken]);

  const fetchInvitation = async () => {
    if (!inviteToken) return;

    try {
      const { data, error } = await supabase
        .from('team_invitations')
        .select(
          `
          *,
          teams (
            id,
            name,
            sport
          )
        `
        )
        .eq('id', inviteToken)
        .eq('accepted', false)
        .gte('expires_at', new Date().toISOString())
        .single();

      if (data) {
        setInvitation(data);
        // Pre-fill form with invitation data
        setFormData((prev) => ({
          ...prev,
          email: data.email,
          role: data.role as 'coach' | 'player' | 'analyst',
          full_name: (data.metadata as any)?.full_name || prev.full_name,
          team_invitation_code: inviteToken,
        }));
      }
    } catch (err) {
      console.error('Error fetching invitation:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      // Sign up user
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.full_name,
          },
        },
      });

      if (error) {
        setError(error.message);
      } else if (data.user) {
        // Handle invitation if present
        if (inviteToken && invitation) {
          try {
            // Accept the invitation
            await supabase
              .from('team_invitations')
              .update({ accepted: true })
              .eq('id', inviteToken);

            // Add user to team
            await supabase.from('team_members').insert({
              team_id: invitation.team_id,
              user_id: data.user.id,
              role: invitation.role,
              jersey_number: invitation.metadata?.jersey_number || null,
            });

            // Note: phone_number and whatsapp_number fields would need to be added 
            // to the users table if this metadata needs to be stored

            router.push('/dashboard');
          } catch (err) {
            console.error('Error accepting invitation:', err);
            router.push('/dashboard');
          }
        } else if (!formData.team_invitation_code) {
          // Move to team setup if no invitation
          setStep('team-setup');
        } else {
          // Legacy invitation code handling
          router.push('/dashboard');
        }
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (step === 'team-setup') {
    return <TeamSetupForm />;
  }

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">
          Create your account
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          {invitation
            ? `Join ${invitation.teams?.name}`
            : "Join your team's coaching platform"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div>
          <label
            htmlFor="full_name"
            className="block text-sm font-medium text-gray-700"
          >
            Full name
          </label>
          <Input
            id="full_name"
            name="full_name"
            type="text"
            required
            value={formData.full_name}
            onChange={handleChange}
            className="mt-1"
            placeholder="Enter your full name"
          />
        </div>

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700"
          >
            Email address
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            value={formData.email}
            onChange={handleChange}
            className="mt-1"
            placeholder="you@example.com"
            disabled={!!invitation}
          />
          {invitation && (
            <p className="mt-1 text-xs text-gray-500">
              Email is locked to the invitation address
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700"
          >
            Password
          </label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            value={formData.password}
            onChange={handleChange}
            className="mt-1"
            placeholder="Create a strong password"
            minLength={8}
          />
          <p className="mt-1 text-xs text-gray-500">
            Must be at least 8 characters long
          </p>
        </div>

        {!invitation && (
          <div>
            <label
              htmlFor="role"
              className="block text-sm font-medium text-gray-700"
            >
              I am a...
            </label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            >
              <option value="player">Player/Athlete</option>
              <option value="coach">Coach</option>
              <option value="analyst">Analyst</option>
            </select>
          </div>
        )}

        {!invitation && (
          <div>
            <label
              htmlFor="team_invitation_code"
              className="block text-sm font-medium text-gray-700"
            >
              Team invitation code (optional)
            </label>
            <Input
              id="team_invitation_code"
              name="team_invitation_code"
              type="text"
              value={formData.team_invitation_code}
              onChange={handleChange}
              className="mt-1"
              placeholder="Enter invitation code if you have one"
            />
            <p className="mt-1 text-xs text-gray-500">
              Leave blank if you're setting up a new team
            </p>
          </div>
        )}

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Creating account...' : 'Create account'}
        </Button>
      </form>

      <div className="text-center">
        <p className="text-sm text-gray-600">
          Already have an account?{' '}
          <Link
            href="/auth/login"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

function TeamSetupForm() {
  const [teamData, setTeamData] = useState({
    organization_name: '',
    team_name: '',
    sport: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      // Create organization and team
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .insert([{ name: teamData.organization_name }])
        .select()
        .single();

      if (orgError) {
        setError(orgError.message);
        return;
      }

      const { data: teamDataResult, error: teamError } = await supabase
        .from('teams')
        .insert([
          {
            organization_id: orgData.id,
            name: teamData.team_name,
            sport: teamData.sport,
          },
        ])
        .select()
        .single();

      if (teamError) {
        setError(teamError.message);
        return;
      }

      // Add user as admin/coach to the team
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('team_members').insert([
          {
            team_id: teamDataResult.id,
            user_id: user.id,
            role: 'admin',
          },
        ]);
      }

      router.push('/dashboard');
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setTeamData({
      ...teamData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Set up your team</h1>
        <p className="mt-2 text-sm text-gray-600">
          Create your organization and team to get started
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div>
          <label
            htmlFor="organization_name"
            className="block text-sm font-medium text-gray-700"
          >
            Organization/Club name
          </label>
          <Input
            id="organization_name"
            name="organization_name"
            type="text"
            required
            value={teamData.organization_name}
            onChange={handleChange}
            className="mt-1"
            placeholder="e.g., Bay Area Aquatics Club"
          />
        </div>

        <div>
          <label
            htmlFor="team_name"
            className="block text-sm font-medium text-gray-700"
          >
            Team name
          </label>
          <Input
            id="team_name"
            name="team_name"
            type="text"
            required
            value={teamData.team_name}
            onChange={handleChange}
            className="mt-1"
            placeholder="e.g., Senior Water Polo Team"
          />
        </div>

        <div>
          <label
            htmlFor="sport"
            className="block text-sm font-medium text-gray-700"
          >
            Sport
          </label>
          <select
            id="sport"
            name="sport"
            required
            value={teamData.sport}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          >
            <option value="">Select a sport</option>
            {SPORTS_LIST.map((sport) => (
              <option key={sport} value={sport}>
                {sport.charAt(0).toUpperCase() + sport.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Creating team...' : 'Create team'}
        </Button>
      </form>
    </div>
  );
}
