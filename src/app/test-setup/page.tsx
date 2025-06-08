'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function TestSetupPage() {
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const setupTestAccount = async () => {
    setLoading(true);
    setStatus('Creating test account...\n');

    try {
      // Create test user
      const timestamp = Date.now();
      const email = `coach.test.${timestamp}@gmail.com`;
      const password = 'TestPassword123!';

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: 'Test Coach',
          },
        },
      });

      if (authError) {
        setStatus((prev) => prev + `❌ Auth error: ${authError.message}\n`);
        return;
      }

      setStatus((prev) => prev + `✅ Created user: ${email}\n`);
      setStatus((prev) => prev + `✅ Password: ${password}\n`);

      if (authData.user) {
        // Manually confirm the email since we can't receive emails in test
        const { error: confirmError } = await supabase.auth.updateUser({
          email: email,
          data: { email_confirmed_at: new Date().toISOString() },
        });

        if (confirmError) {
          setStatus(
            (prev) =>
              prev +
              `⚠️ Could not auto-confirm email: ${confirmError.message}\n`
          );
        } else {
          setStatus((prev) => prev + `✅ Email confirmed\n`);
        }
        // Create an organization
        const { data: org, error: orgError } = await supabase
          .from('organizations')
          .insert({
            name: 'Test Organization',
          })
          .select()
          .single();

        if (orgError) {
          setStatus((prev) => prev + `❌ Org error: ${orgError.message}\n`);
        } else {
          setStatus((prev) => prev + `✅ Created organization: ${org.name}\n`);

          // Create a team
          const { data: team, error: teamError } = await supabase
            .from('teams')
            .insert({
              name: 'Test Eagles',
              sport: 'Soccer',
              organization_id: org.id,
            })
            .select()
            .single();

          if (teamError) {
            setStatus((prev) => prev + `❌ Team error: ${teamError.message}\n`);
          } else {
            setStatus((prev) => prev + `✅ Created team: ${team.name}\n`);

            // Add user as coach
            const { error: memberError } = await supabase
              .from('team_members')
              .insert({
                team_id: team.id,
                user_id: authData.user.id,
                role: 'coach',
              });

            if (memberError) {
              setStatus(
                (prev) => prev + `❌ Member error: ${memberError.message}\n`
              );
            } else {
              setStatus((prev) => prev + `✅ Added as coach to team\n`);
              setStatus(
                (prev) =>
                  prev + '\n🎉 Setup complete! Redirecting to teams page...\n'
              );

              setTimeout(() => {
                router.push('/teams/all');
              }, 2000);
            }
          }
        }
      }
    } catch (error) {
      setStatus((prev) => prev + `❌ Error: ${error}\n`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Test Account Setup</h1>

        <button
          onClick={setupTestAccount}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Setting up...' : 'Create Test Account'}
        </button>

        <pre className="mt-4 p-4 bg-gray-900 text-green-400 rounded whitespace-pre-wrap">
          {status || 'Click the button to create a test account with team...'}
        </pre>
      </div>
    </div>
  );
}
