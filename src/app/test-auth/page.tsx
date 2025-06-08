'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';

export default function TestAuthPage() {
  const [email, setEmail] = useState('orino333@gmail.com');
  const [password, setPassword] = useState('qwer1234');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const supabase = createClient();

  const handleSignUp = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: 'Test User',
          },
        },
      });

      setResult({ action: 'signup', data, error });
      console.log('Signup result:', { data, error });
    } catch (err) {
      console.error('Signup error:', err);
      setResult({ action: 'signup', error: err });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      setResult({ action: 'signin', data, error });
      console.log('Signin result:', { data, error });

      if (data.session) {
        // Redirect to teams page after successful login
        window.location.href = '/teams/all';
      }
    } catch (err) {
      console.error('Signin error:', err);
      setResult({ action: 'signin', error: err });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      setResult({ action: 'signout', error });
      console.log('Signout result:', { error });
    } catch (err) {
      console.error('Signout error:', err);
      setResult({ action: 'signout', error: err });
    } finally {
      setLoading(false);
    }
  };

  const checkSession = async () => {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();
    setResult({ action: 'check', session, error });
    console.log('Session check:', { session, error });
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Authentication Test</h1>

      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        <Button onClick={handleSignUp} disabled={loading}>
          Sign Up
        </Button>
        <Button onClick={handleSignIn} disabled={loading}>
          Sign In
        </Button>
        <Button onClick={handleSignOut} disabled={loading} variant="outline">
          Sign Out
        </Button>
        <Button onClick={checkSession} disabled={loading} variant="outline">
          Check Session
        </Button>
      </div>

      {result && (
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-bold mb-2">Result ({result.action}):</h2>
          <pre className="text-sm whitespace-pre-wrap">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
