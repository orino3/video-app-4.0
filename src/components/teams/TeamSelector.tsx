'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
// import { ChevronDownIcon } from '@heroicons/react/24/outline';

export function TeamSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { teams, activeTeamId, setActiveTeam, getActiveTeam } = useAuthStore();
  const activeTeam = getActiveTeam();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (teams.length === 0) {
    return null;
  }

  if (teams.length === 1) {
    return (
      <div className="text-sm text-gray-600">
        <span className="font-medium">{teams[0].name}</span>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <div className="flex flex-col items-start">
          <span className="text-xs text-gray-500">Team</span>
          <span>{activeTeam?.name || 'Select Team'}</span>
        </div>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
          <div className="py-1">
            {teams.map((team) => (
              <button
                key={team.id}
                onClick={() => {
                  setActiveTeam(team.id);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                  activeTeamId === team.id
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700'
                }`}
              >
                <div className="flex flex-col">
                  <span className="font-medium">{team.name}</span>
                  <span className="text-xs text-gray-500">
                    {team.organization?.name} • {team.sport}
                  </span>
                  <span className="text-xs text-gray-500 capitalize">
                    Role: {team.role}
                  </span>
                </div>
              </button>
            ))}

            {/* Divider */}
            <div className="border-t border-gray-200 my-1"></div>

            {/* Manage All Teams Link */}
            <a
              href="/teams/all"
              onClick={() => setIsOpen(false)}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <div className="flex items-center justify-between">
                <span>Manage All Teams</span>
                <svg
                  className="w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </div>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
