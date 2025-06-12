'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';

interface AnnotationPanelProps {
  annotationId: string;
  timestamp: number;
  title: string;
  onTitleChange: (title: string) => void;
  onAddNote: () => void;
  onAddDrawing: () => void;
  onAddLoop: () => void;
  onAddTag: () => void;
  onAddMention: () => void;
  onClose: () => void;
  onSave: () => void;
  hasNote?: boolean;
  hasDrawing?: boolean;
  hasLoop?: boolean;
  hasTags?: boolean;
  hasMentions?: boolean;
  isMinimized?: boolean;
  onMinimizeChange?: (minimized: boolean) => void;
}

export function AnnotationPanel({
  timestamp,
  title,
  onTitleChange,
  onAddNote,
  onAddDrawing,
  onAddLoop,
  onAddTag,
  onAddMention,
  onClose,
  onSave,
  hasNote = false,
  hasDrawing = false,
  hasLoop = false,
  hasTags = false,
  hasMentions = false,
  isMinimized: externalIsMinimized,
  onMinimizeChange,
}: AnnotationPanelProps) {
  const [internalIsMinimized, setInternalIsMinimized] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Use external control if provided, otherwise use internal state
  const isMinimized =
    externalIsMinimized !== undefined
      ? externalIsMinimized
      : internalIsMinimized;

  const setIsMinimized = (value: boolean) => {
    if (onMinimizeChange) {
      onMinimizeChange(value);
    } else {
      setInternalIsMinimized(value);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isMinimized) return;
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart]);
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const hasAnyContent =
    hasNote ||
    hasDrawing ||
    hasLoop ||
    hasTags ||
    hasMentions ||
    title.trim().length > 0;

  // Minimized view
  if (isMinimized) {
    return (
      <div
        className={`bg-white rounded-lg shadow-lg border border-gray-200 p-2 flex items-center gap-2 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} select-none`}
        style={{
          transform: `translate(${position.x}px, ${position.y}px)`,
          transition: isDragging ? 'none' : 'transform 0.2s',
        }}
        onMouseDown={handleMouseDown}
      >
        <button
          onClick={() => setIsMinimized(false)}
          className="text-gray-600 hover:text-gray-800"
          title="Expand panel"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
            />
          </svg>
        </button>
        <span className="text-sm font-medium text-gray-700">
          {title || 'Coaching Event'} at {formatTime(timestamp)}
        </span>
        <div className="flex gap-1 ml-auto">
          {hasNote && (
            <span
              className="w-2 h-2 bg-blue-500 rounded-full"
              title="Has note"
            ></span>
          )}
          {hasDrawing && (
            <span
              className="w-2 h-2 bg-red-500 rounded-full"
              title="Has drawing"
            ></span>
          )}
          {hasLoop && (
            <span
              className="w-2 h-2 bg-green-500 rounded-full"
              title="Has loop"
            ></span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-3 w-80">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-sm font-medium text-gray-900">
              Coaching Event
            </h3>
            <p className="text-xs text-gray-500">at {formatTime(timestamp)}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsMinimized(true)}
              className="text-gray-400 hover:text-gray-600"
              title="Minimize panel"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 12H4"
                />
              </svg>
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              title="Close panel"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Title Input */}
        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Event title (e.g., Defensive breakdown)"
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          autoFocus
        />
      </div>

      {/* Content Types */}
      <div className="space-y-1.5 mb-3">
        <button
          onClick={onAddNote}
          className={`w-full flex items-center justify-between p-2.5 rounded-lg border transition-colors ${
            hasNote
              ? 'border-blue-500 bg-blue-50 text-blue-700'
              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center gap-3">
            <svg
              className="w-5 h-5"
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
            <span className="text-sm font-medium">Note</span>
          </div>
          {hasNote && (
            <svg
              className="w-5 h-5 text-blue-600"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
            </svg>
          )}
        </button>

        <button
          onClick={onAddDrawing}
          className={`w-full flex items-center justify-between p-2.5 rounded-lg border transition-colors ${
            hasDrawing
              ? 'border-red-500 bg-red-50 text-red-700'
              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center gap-3">
            <svg
              className="w-5 h-5"
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
            <span className="text-sm font-medium">Drawing</span>
          </div>
          {hasDrawing && (
            <svg
              className="w-5 h-5 text-red-600"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
            </svg>
          )}
        </button>

        <button
          onClick={onAddLoop}
          className={`w-full flex items-center justify-between p-2.5 rounded-lg border transition-colors ${
            hasLoop
              ? 'border-green-500 bg-green-50 text-green-700'
              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center gap-3">
            <svg
              className="w-5 h-5"
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
            <span className="text-sm font-medium">Loop</span>
          </div>
          {hasLoop && (
            <svg
              className="w-5 h-5 text-green-600"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
            </svg>
          )}
        </button>

        <button
          onClick={onAddTag}
          className={`w-full flex items-center justify-between p-2.5 rounded-lg border transition-colors ${
            hasTags
              ? 'border-purple-500 bg-purple-50 text-purple-700'
              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center gap-3">
            <svg
              className="w-5 h-5"
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
            <span className="text-sm font-medium">Tags</span>
          </div>
          {hasTags && (
            <svg
              className="w-5 h-5 text-purple-600"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
            </svg>
          )}
        </button>

        <button
          onClick={onAddMention}
          className={`w-full flex items-center justify-between p-2.5 rounded-lg border transition-colors ${
            hasMentions
              ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center gap-3">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            <span className="text-sm font-medium">Player Mentions</span>
          </div>
          {hasMentions && (
            <svg
              className="w-5 h-5 text-indigo-600"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
            </svg>
          )}
        </button>
      </div>

      {/* Footer - Move higher up */}
      <div className="mt-3 space-y-2">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={onSave}
            disabled={!hasAnyContent}
            className="flex-1"
          >
            Save Event
          </Button>
        </div>

        {!hasAnyContent && (
          <p className="text-xs text-gray-500 text-center">
            Add a title or content to save
          </p>
        )}
      </div>
    </div>
  );
}
