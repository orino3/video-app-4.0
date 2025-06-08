'use client';

import { useState } from 'react';

interface AnnotationMenuProps {
  onSelectType: (type: 'note' | 'draw' | 'loop' | 'tag') => void;
  onCancel: () => void;
}

export function AnnotationMenu({
  onSelectType,
  onCancel,
}: AnnotationMenuProps) {
  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4">
      <h3 className="text-sm font-medium text-gray-900 mb-3">
        Choose Annotation Type
      </h3>

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => onSelectType('note')}
          className="flex flex-col items-center p-3 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-colors"
        >
          <svg
            className="w-6 h-6 mb-1 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
          <span className="text-xs font-medium">Note</span>
        </button>

        <button
          onClick={() => onSelectType('draw')}
          className="flex flex-col items-center p-3 rounded-lg border border-gray-200 hover:border-red-500 hover:bg-red-50 transition-colors"
        >
          <svg
            className="w-6 h-6 mb-1 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
            />
          </svg>
          <span className="text-xs font-medium">Draw</span>
        </button>

        <button
          onClick={() => onSelectType('loop')}
          className="flex flex-col items-center p-3 rounded-lg border border-gray-200 hover:border-green-500 hover:bg-green-50 transition-colors"
        >
          <svg
            className="w-6 h-6 mb-1 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          <span className="text-xs font-medium">Loop</span>
        </button>

        <button
          onClick={() => onSelectType('tag')}
          className="flex flex-col items-center p-3 rounded-lg border border-gray-200 hover:border-purple-500 hover:bg-purple-50 transition-colors opacity-50 cursor-not-allowed"
          disabled
          title="Coming soon"
        >
          <svg
            className="w-6 h-6 mb-1 text-purple-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
            />
          </svg>
          <span className="text-xs font-medium">Tag</span>
        </button>
      </div>

      <button
        onClick={onCancel}
        className="mt-3 w-full text-sm text-gray-500 hover:text-gray-700"
      >
        Cancel
      </button>
    </div>
  );
}
