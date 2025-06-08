'use client';

import { useAuthStore } from '@/stores/authStore';
import { useAuth } from '@/hooks/useAuth';

export function DebugInfo() {
  const { activeTeamId, getActiveTeam, teams } = useAuthStore();
  const activeTeam = getActiveTeam();
  
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }
  
  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-80 text-white p-4 rounded-lg text-xs max-w-sm">
      <h3 className="font-bold mb-2">Debug Info</h3>
      <div className="space-y-1">
        <p>Active Team ID: {activeTeamId || 'None'}</p>
        <p>Active Team: {activeTeam?.name || 'None'}</p>
        <p>Total Teams: {teams.length}</p>
        <details className="mt-2">
          <summary className="cursor-pointer">All Teams</summary>
          <ul className="mt-1 ml-2">
            {teams.map(team => (
              <li key={team.id} className={team.id === activeTeamId ? 'font-bold' : ''}>
                {team.name} ({team.id.slice(0, 8)}...)
              </li>
            ))}
          </ul>
        </details>
      </div>
    </div>
  );
}