'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import { WelcomeStep } from './WelcomeStep';
import { CreateTeamStep } from './CreateTeamStep';
import { InvitePlayersStep } from './InvitePlayersStep';
import { FeatureOverviewStep } from './FeatureOverviewStep';
import { useRouter } from 'next/navigation';

export type OnboardingStep =
  | 'welcome'
  | 'create-team'
  | 'invite-players'
  | 'feature-overview';

export function OnboardingFlow() {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [teamId, setTeamId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user, teams, refreshTeams } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  // Check if user has already completed onboarding
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!user) return;

      // Allow testing onboarding flow
      const urlParams = new URLSearchParams(window.location.search);
      const forceOnboarding = urlParams.get('force') === 'true';

      if (!forceOnboarding) {
        // Check if user has any teams
        if (teams.length > 0) {
          // User already has teams, skip onboarding
          router.push('/dashboard');
          return;
        }

        // Check localStorage for onboarding completion
        const hasCompletedOnboarding = localStorage.getItem(
          `onboarding-completed-${user.id}`
        );
        if (hasCompletedOnboarding === 'true') {
          router.push('/dashboard');
        }
      }
    };

    checkOnboardingStatus();
  }, [user, teams, router]);

  const handleCreateTeam = async (teamData: {
    name: string;
    sport: string;
  }) => {
    setIsLoading(true);
    try {
      // Create organization first (optional - can be null)
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: `${teamData.name} Organization`,
        })
        .select()
        .single();

      if (orgError) throw orgError;

      // Create team
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .insert({
          organization_id: org.id,
          name: teamData.name,
          sport: teamData.sport,
        })
        .select()
        .single();

      if (teamError) throw teamError;

      // Add user as coach
      const { error: memberError } = await supabase
        .from('team_members')
        .insert({
          team_id: team.id,
          user_id: user!.id,
          role: 'coach',
        });

      if (memberError) throw memberError;

      setTeamId(team.id);
      await refreshTeams();
      setCurrentStep('invite-players');
    } catch (error) {
      console.error('Error creating team:', error);
      alert('Failed to create team. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInvitePlayers = async (emails: string[]) => {
    if (!teamId) return;

    setIsLoading(true);
    try {
      // Send invitations (in real app, would send emails)
      for (const email of emails) {
        // Check if user exists
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('email', email)
          .single();

        if (existingUser) {
          // Add existing user to team
          await supabase.from('team_members').insert({
            team_id: teamId,
            user_id: existingUser.id,
            role: 'player',
          });
        } else {
          // TODO: In a real app, would send invitation emails
          // For now, just log the email
          console.log(`Would send invitation to: ${email}`);
        }
      }

      setCurrentStep('feature-overview');
    } catch (error) {
      console.error('Error inviting players:', error);
      alert('Some invitations failed. You can invite more players later.');
      setCurrentStep('feature-overview');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteOnboarding = () => {
    // Mark onboarding as completed
    localStorage.setItem(`onboarding-completed-${user?.id}`, 'true');
    router.push('/dashboard');
  };

  const handleSkip = () => {
    // Allow skipping to next step
    switch (currentStep) {
      case 'welcome':
        setCurrentStep('create-team');
        break;
      case 'create-team':
        // Can't skip team creation
        alert('Please create a team to continue');
        break;
      case 'invite-players':
        setCurrentStep('feature-overview');
        break;
      case 'feature-overview':
        handleCompleteOnboarding();
        break;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">
              Step{' '}
              {currentStep === 'welcome'
                ? '1'
                : currentStep === 'create-team'
                  ? '2'
                  : currentStep === 'invite-players'
                    ? '3'
                    : '4'}{' '}
              of 4
            </span>
            {currentStep !== 'create-team' && (
              <button
                onClick={handleSkip}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Skip
              </button>
            )}
          </div>
          <div className="h-2 bg-gray-200 rounded-full">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-300"
              style={{
                width:
                  currentStep === 'welcome'
                    ? '25%'
                    : currentStep === 'create-team'
                      ? '50%'
                      : currentStep === 'invite-players'
                        ? '75%'
                        : '100%',
              }}
            />
          </div>
        </div>

        {/* Step content */}
        <div className="bg-white shadow-lg rounded-lg p-8">
          {currentStep === 'welcome' && (
            <WelcomeStep onNext={() => setCurrentStep('create-team')} />
          )}

          {currentStep === 'create-team' && (
            <CreateTeamStep onNext={handleCreateTeam} isLoading={isLoading} />
          )}

          {currentStep === 'invite-players' && (
            <InvitePlayersStep
              onNext={handleInvitePlayers}
              onSkip={() => setCurrentStep('feature-overview')}
              isLoading={isLoading}
            />
          )}

          {currentStep === 'feature-overview' && (
            <FeatureOverviewStep onComplete={handleCompleteOnboarding} />
          )}
        </div>
      </div>
    </div>
  );
}
