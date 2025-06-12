'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export default function TestDBPage() {
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const supabase = createClient();

  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    try {
      // Test 1: Get current user
      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser();
      console.log('Auth user:', authUser);
      if (authError) console.error('Auth error:', authError);

      // Test 2: List teams
      const { data: teams, error: teamsError } = await supabase
        .from('teams')
        .select('*')
        .limit(5);

      console.log('Teams:', teams);
      if (teamsError) console.error('Teams error:', teamsError);

      // Test 3: Try to create a test team
      const testTeamName = `Test Team ${Date.now()}`;
      const { data: newTeam, error: createError } = await supabase
        .from('teams')
        .insert({
          name: testTeamName,
          sport: 'Test Sport',
          organization_id: null,
        })
        .select()
        .single();

      console.log('New team:', newTeam);
      if (createError) console.error('Create error:', createError);

      setResult({
        authUser,
        authError,
        teams,
        teamsError,
        newTeam,
        createError,
      });
    } catch (err) {
      console.error('Test error:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Database Connection Test</h1>

      <div className="mb-4">
        <p>
          <strong>Current user from hook:</strong> {user?.email || 'No user'}
        </p>
      </div>

      {loading && <p>Testing connection...</p>}

      {error && (
        <div className="bg-red-100 p-4 rounded">
          <h2 className="font-bold text-red-800">Error:</h2>
          <pre className="text-sm">{JSON.stringify(error, null, 2)}</pre>
        </div>
      )}

      {result && (
        <div className="space-y-4">
          <div className="bg-gray-100 p-4 rounded">
            <h2 className="font-bold">Auth User:</h2>
            <pre className="text-sm">
              {JSON.stringify(result.authUser, null, 2)}
            </pre>
            {result.authError && (
              <div className="text-red-600 mt-2">
                Error: {JSON.stringify(result.authError, null, 2)}
              </div>
            )}
          </div>

          <div className="bg-gray-100 p-4 rounded">
            <h2 className="font-bold">Teams:</h2>
            <pre className="text-sm">
              {JSON.stringify(result.teams, null, 2)}
            </pre>
            {result.teamsError && (
              <div className="text-red-600 mt-2">
                Error: {JSON.stringify(result.teamsError, null, 2)}
              </div>
            )}
          </div>

          <div className="bg-gray-100 p-4 rounded">
            <h2 className="font-bold">Create Team Test:</h2>
            <pre className="text-sm">
              {JSON.stringify(result.newTeam, null, 2)}
            </pre>
            {result.createError && (
              <div className="text-red-600 mt-2">
                Error: {JSON.stringify(result.createError, null, 2)}
              </div>
            )}
          </div>
        </div>
      )}

      <button
        onClick={testConnection}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Re-test Connection
      </button>
    </div>
  );
}
