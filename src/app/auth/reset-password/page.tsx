'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [hasValidCode, setHasValidCode] = useState(false);
  const [isCheckingCode, setIsCheckingCode] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handlePasswordResetFlow = async () => {
      try {
        const supabase = createClient();

        // First check if we already have a valid session (user might have come from a valid reset link)
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (session && !sessionError) {
          // We have a valid session, allow password reset
          setHasValidCode(true);
          return;
        }

        // Check for hash parameters (Supabase commonly uses hash fragments for auth)
        const hash = window.location.hash;
        if (hash) {
          const hashParams = new URLSearchParams(hash.substring(1));
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');
          const type = hashParams.get('type');

          if (type === 'recovery' && accessToken && refreshToken) {
            try {
              // Validate that tokens look like JWTs before attempting to use them
              const isValidJWT = (token: string) => {
                const parts = token.split('.');
                return (
                  parts.length === 3 && parts.every((part) => part.length > 0)
                );
              };

              if (!isValidJWT(accessToken) || !isValidJWT(refreshToken)) {
                throw new Error('Invalid token format');
              }

              // Attempt to set session with the provided tokens
              const { data, error } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              });

              if (!error && data.session) {
                setHasValidCode(true);
                // Clean up URL for security
                window.history.replaceState(
                  {},
                  document.title,
                  window.location.pathname
                );
                return;
              } else {
                console.error('Session error:', error);
                throw new Error(
                  error?.message || 'Failed to establish session'
                );
              }
            } catch (sessionErr: any) {
              console.error('Token validation failed:', sessionErr);

              // Provide more specific error messages
              let errorMessage =
                'This reset link has expired or is invalid. Please request a new password reset.';
              if (sessionErr.message?.includes('JWT')) {
                errorMessage =
                  'The reset link format is invalid. Please request a new password reset.';
              }

              setMessage({
                type: 'error',
                text: errorMessage,
              });
              return;
            }
          }
        }

        // Check for query parameters as fallback
        const accessToken = searchParams.get('access_token');
        const refreshToken = searchParams.get('refresh_token');
        const type = searchParams.get('type');

        if (type === 'recovery' && accessToken && refreshToken) {
          try {
            // Validate that tokens look like JWTs before attempting to use them
            const isValidJWT = (token: string) => {
              const parts = token.split('.');
              return (
                parts.length === 3 && parts.every((part) => part.length > 0)
              );
            };

            if (!isValidJWT(accessToken) || !isValidJWT(refreshToken)) {
              throw new Error('Invalid token format');
            }

            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (!error && data.session) {
              setHasValidCode(true);
              return;
            } else {
              throw new Error(error?.message || 'Failed to establish session');
            }
          } catch (sessionErr: any) {
            console.error('Query param token validation failed:', sessionErr);

            // Provide more specific error messages
            let errorMessage =
              'This reset link has expired or is invalid. Please request a new password reset.';
            if (sessionErr.message?.includes('JWT')) {
              errorMessage =
                'The reset link format is invalid. Please request a new password reset.';
            }

            setMessage({
              type: 'error',
              text: errorMessage,
            });
            return;
          }
        }

        // No valid reset parameters or session found
        setMessage({
          type: 'error',
          text: 'Invalid reset link. Please request a new password reset.',
        });
      } catch (error) {
        console.error('Password reset flow error:', error);
        setMessage({
          type: 'error',
          text: 'An error occurred while processing your reset link.',
        });
      } finally {
        setIsCheckingCode(false);
      }
    };

    handlePasswordResetFlow();
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!hasValidCode) {
      setMessage({
        type: 'error',
        text: 'Invalid session. Please request a new password reset.',
      });
      return;
    }

    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }

    if (password.length < 8) {
      setMessage({
        type: 'error',
        text: 'Password must be at least 8 characters long',
      });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const supabase = createClient();

      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        console.error('Password update error:', error);
        setMessage({
          type: 'error',
          text: error.message || 'Failed to update password. Please try again.',
        });
      } else {
        setMessage({
          type: 'success',
          text: 'Password updated successfully! Redirecting to login...',
        });

        // Sign out after successful password reset
        await supabase.auth.signOut();

        setTimeout(() => {
          router.push('/auth/login');
        }, 2000);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setMessage({
        type: 'error',
        text: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Reset your password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your new password below
          </p>
        </div>

        {isCheckingCode ? (
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">
              Verifying reset link...
            </p>
          </div>
        ) : !hasValidCode ? (
          <div className="space-y-4">
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">
                {message?.text ||
                  'Invalid reset link. Please request a new password reset.'}
              </p>
            </div>
            <div className="text-center">
              <Button
                onClick={() => router.push('/auth/forgot-password')}
                variant="outline"
                className="w-full"
              >
                Request Password Reset
              </Button>
            </div>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {message && (
              <div
                className={`rounded-md p-4 ${
                  message.type === 'success' ? 'bg-green-50' : 'bg-red-50'
                }`}
              >
                <p
                  className={`text-sm ${
                    message.type === 'success'
                      ? 'text-green-800'
                      : 'text-red-800'
                  }`}
                >
                  {message.text}
                </p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700"
                >
                  New Password
                </label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1"
                  placeholder="Enter new password"
                  minLength={8}
                />
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700"
                >
                  Confirm New Password
                </label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1"
                  placeholder="Confirm new password"
                  minLength={8}
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading || !hasValidCode}
              className="w-full"
            >
              {loading ? 'Updating password...' : 'Update password'}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
