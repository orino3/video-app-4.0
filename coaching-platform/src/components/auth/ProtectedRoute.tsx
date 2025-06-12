'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireRole?: string[];
  requireTeamAccess?: string;
  fallbackPath?: string;
}

export default function ProtectedRoute({
  children,
  requireAuth = true,
  requireRole,
  requireTeamAccess,
  fallbackPath = '/auth/login',
}: ProtectedRouteProps) {
  const { isAuthenticated, user, teams, loading, initialized } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!initialized || loading) return;

    // Check authentication requirement
    if (requireAuth && !isAuthenticated) {
      router.push(fallbackPath);
      return;
    }

    // Check role requirement
    if (requireRole && requireRole.length > 0) {
      const hasRequiredRole = teams.some((team) =>
        requireRole.includes(team.role)
      );

      if (!hasRequiredRole) {
        router.push('/dashboard'); // Redirect to dashboard if no required role
        return;
      }
    }

    // Check team access requirement
    if (requireTeamAccess) {
      const hasTeamAccess = teams.some((team) => team.id === requireTeamAccess);

      if (!hasTeamAccess) {
        router.push('/dashboard'); // Redirect to dashboard if no team access
        return;
      }
    }
  }, [
    initialized,
    loading,
    isAuthenticated,
    teams,
    requireAuth,
    requireRole,
    requireTeamAccess,
    router,
    fallbackPath,
  ]);

  // Show loading while checking authentication
  if (!initialized || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render children if requirements aren't met
  if (requireAuth && !isAuthenticated) {
    return null;
  }

  if (requireRole && requireRole.length > 0) {
    const hasRequiredRole = teams.some((team) =>
      requireRole.includes(team.role)
    );
    if (!hasRequiredRole) {
      return null;
    }
  }

  if (requireTeamAccess) {
    const hasTeamAccess = teams.some((team) => team.id === requireTeamAccess);
    if (!hasTeamAccess) {
      return null;
    }
  }

  return <>{children}</>;
}
